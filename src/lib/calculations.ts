import { addMonths, differenceInMonths } from 'date-fns';
import {
  ProjectInput,
  SimulationParams,
  MonthlyCashFlow,
  ProjectMetrics,
  ProjectData,
  MacroInput,
} from '../types';

// ─────────────────────────────────────────────────────────────
//  Curva ótima de desenvolvimento
// ─────────────────────────────────────────────────────────────

/** Retorna o % de obras esperado para um dado % de vendas, conforme a curva ótima. */
export function calculateOptimalCurve(percVendas: number): number {
  if (percVendas < 0.30) return 0;
  if (percVendas < 0.35) return 1.7866 * percVendas - 0.5326;
  if (percVendas < 0.55) return 3.0136 * percVendas - 0.9617;
  return 1.0313 * percVendas + 0.1335;
}

// ─────────────────────────────────────────────────────────────
//  Utilitários de taxas / indexadores
// ─────────────────────────────────────────────────────────────

interface MacroRates {
  cdiAnnual: number;
  inccAnnual: number;
  ipcaAnnual: number;
  trAnnual: number;
  cdiMonthly: number;
  inccMonthly: number;
}

/** Retorna a taxa anual do indexador (CDI / INCC / IPCA / TR). */
function getIndexerAnnualRate(
  indexador: string,
  cdi: number,
  incc: number,
  ipca: number,
  tr: number,
): number {
  const idx = indexador?.toUpperCase().trim();
  if (idx === 'CDI') return cdi;
  if (idx === 'INCC') return incc;
  if (idx === 'IPCA') return ipca;
  if (idx === 'TR') return tr;
  return 0;
}

/** Converte taxa anual efetiva em taxa mensal equivalente. */
function annualToMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/** Compõe taxa de spread + indexador e retorna taxa mensal. */
function computeMonthlyDebtRate(
  spreadAnual: number,
  indexador: string,
  rates: MacroRates,
): number {
  const indexerRate = getIndexerAnnualRate(
    indexador,
    rates.cdiAnnual,
    rates.inccAnnual,
    rates.ipcaAnnual,
    rates.trAnnual,
  );
  const totalAnnual = (1 + spreadAnual) * (1 + indexerRate) - 1;
  return annualToMonthlyRate(totalAnnual);
}

/** Busca o cenário macro do mês ou retorna defaults. */
function getMacroRatesForMonth(macros: MacroInput[], monthDate: Date): MacroRates {
  const macroForMonth = macros.find(
    (m) =>
      m.mesAno.getFullYear() === monthDate.getFullYear() &&
      m.mesAno.getMonth() === monthDate.getMonth(),
  );

  const cdiAnnual = macroForMonth?.cdi ?? 0.105;
  const inccAnnual = macroForMonth?.incc ?? 0.05;
  const ipcaAnnual = macroForMonth?.ipca ?? 0.045;
  const trAnnual = macroForMonth?.tr ?? 0.02; // Default de 2% aa caso vazio

  return {
    cdiAnnual,
    inccAnnual,
    ipcaAnnual,
    trAnnual,
    cdiMonthly: annualToMonthlyRate(cdiAnnual),
    inccMonthly: annualToMonthlyRate(inccAnnual),
  };
}

// ─────────────────────────────────────────────────────────────
//  Fases do projeto
// ─────────────────────────────────────────────────────────────

interface PhaseFlags {
  isConstructionPhase: boolean;
  isGrace: boolean;
  isRepasse: boolean;
  isStockSale: boolean;
  isConstructing: boolean;
}

function determinePhase(
  m: number,
  constructionMonths: number,
  currentMonthDate: Date,
  input: ProjectInput,
  currentPercVendas: number,
  currentPercObras: number,
): PhaseFlags {
  const isConstructionPhase = m <= constructionMonths;
  const isGrace = m > constructionMonths && m <= constructionMonths + 3;
  const isRepasse = m > constructionMonths + 3 && m <= constructionMonths + 9;
  const isStockSale = m > constructionMonths + 9;

  const worksCanStart =
    input.percObras > 0 ||
    (currentMonthDate >= input.dataInicioObras && currentPercVendas >= 0.30);

  const isConstructing =
    worksCanStart && isConstructionPhase && currentPercObras < 1;

  return { isConstructionPhase, isGrace, isRepasse, isStockSale, isConstructing };
}

// ─────────────────────────────────────────────────────────────
//  Correção monetária (INCC)
// ─────────────────────────────────────────────────────────────

interface INCCPools {
  costAIncorrer: number;
  poolPreChaves: number;
  repassePool: number;
  vgvTotal: number;
  estoque: number;
}

/** Aplica correção INCC sobre saldos e parcelas futuras. */
function applyINCC(
  pools: INCCPools,
  futureInstallments: number[],
  inccMonthly: number,
  currentMonth: number,
  totalMonths: number,
): INCCPools {
  const factor = 1 + inccMonthly;
  const updated: INCCPools = {
    costAIncorrer: pools.costAIncorrer * factor,
    poolPreChaves: pools.poolPreChaves * factor,
    repassePool: pools.repassePool * factor,
    vgvTotal: pools.vgvTotal * factor,
    estoque: pools.estoque * factor,
  };

  for (let i = currentMonth; i <= totalMonths; i++) {
    if (futureInstallments[i]) {
      futureInstallments[i] *= factor;
    }
  }

  return updated;
}

// ─────────────────────────────────────────────────────────────
//  Cálculo de recebíveis por fase
// ─────────────────────────────────────────────────────────────

interface ReceivablesResult {
  receivables: number;
  receivablesPreChaves: number;
  receivablesRepasse: number;
  receivablesEstoque: number;
  poolPreChaves: number;
  repassePool: number;
  estoque: number;
  repasseMonthCount: number;
}

function calculateReceivables(
  phase: PhaseFlags,
  pools: INCCPools,
  futureInstallments: number[],
  input: ProjectInput,
  sim: SimulationParams,
  vgvVendidoMes: number,
  vgvVendidoTabela: number,
  m: number,
  constructionMonths: number,
  repasseMonthCount: number,
): ReceivablesResult {
  let { poolPreChaves, repassePool, estoque } = pools;
  let receivablesPreChaves = 0;
  let receivablesRepasse = 0;
  let receivablesEstoque = 0;
  let receivables = 0;

  const remainingConstMonths = Math.max(1, constructionMonths - m + 1);

  if (phase.isConstructionPhase) {
    // Parcelas do pool pré-chaves existente
    const installmentBase = poolPreChaves / remainingConstMonths;
    poolPreChaves -= installmentBase;
    receivablesPreChaves = installmentBase;

    // Novas vendas do mês: sinal + parcelas pré-chaves + repasse futuro
    const sinal = vgvVendidoMes * (input.vendasPercSinal || 0.10);
    const parcelasTotal = vgvVendidoMes * (input.vendasPercPreChaves || 0.15);
    const repasseTotal = vgvVendidoMes * (input.vendasPercPosChaves || 0.75);

    const parcelaMensal = parcelasTotal / remainingConstMonths;
    receivablesPreChaves += sinal;

    for (let i = m; i <= constructionMonths; i++) {
      futureInstallments[i] = (futureInstallments[i] || 0) + parcelaMensal;
    }
    receivablesPreChaves += futureInstallments[m];

    repassePool += repasseTotal;
    receivables = receivablesPreChaves;
  } else if (phase.isGrace) {
    // Vendas feitas na carência vão para o pool de repasse
    repassePool += vgvVendidoMes;
  } else if (phase.isRepasse) {
    repasseMonthCount++;
    const remainingRepasseMonths = Math.max(1, 6 - repasseMonthCount + 1);
    const repasseRecebimento = repassePool / remainingRepasseMonths;
    repassePool -= repasseRecebimento;

    receivablesRepasse = repasseRecebimento + vgvVendidoMes;
    receivables = receivablesRepasse;
  } else if (phase.isStockSale) {
    receivablesEstoque = vgvVendidoMes;
    receivables = receivablesEstoque;
  }

  // Abater o valor de tabela do estoque físico/financeiro referencial independentemente da fase
  estoque -= vgvVendidoTabela;

  return {
    receivables,
    receivablesPreChaves,
    receivablesRepasse,
    receivablesEstoque,
    poolPreChaves,
    repassePool,
    estoque,
    repasseMonthCount,
  };
}

// ─────────────────────────────────────────────────────────────
//  Cascata de pagamentos (construction vs. post-construction)
// ─────────────────────────────────────────────────────────────

interface WaterfallResult {
  permutaPayment: number;
  finInterestPaid: number;
  finAmortization: number;
  finDrawdown: number;
  equityCashFlow: number;
  outOfPocketInterest: number;
  finalCaixa: number;
  finBalance: number;
  permutaBalance: number;
  accumulatedOOP: number;
  availableCashRecord: number;
}

/** Cascata durante a fase de construção. */
function waterfallConstruction(
  availableCash: number,
  constructionCost: number,
  finInterest: number,
  finBalance: number,
  finTotalLimit: number,
  permutaBalance: number,
  permutaPercRecebiveis: number,
  receivables: number,
  minimumCaixa: number,
  accumulatedOOP: number,
): WaterfallResult {
  let permutaPayment = Math.min(receivables * permutaPercRecebiveis, permutaBalance);
  availableCash -= permutaPayment;
  permutaBalance -= permutaPayment;

  availableCash -= constructionCost;

  let finInterestPaid: number;
  let outOfPocketInterest = 0;

  if (availableCash >= finInterest) {
    finInterestPaid = finInterest;
    availableCash -= finInterest;
  } else {
    finInterestPaid = Math.max(0, availableCash);
    availableCash -= finInterestPaid;
    outOfPocketInterest = finInterest - finInterestPaid;
    accumulatedOOP += outOfPocketInterest;
  }
  finBalance += finInterest - finInterestPaid;

  const caixaFinal = availableCash;
  let finDrawdown = 0;
  let equityCashFlow = 0;
  let finalCaixa: number;

  if (caixaFinal < minimumCaixa) {
    const shortfall = minimumCaixa - caixaFinal;
    finDrawdown = Math.min(shortfall, finTotalLimit - finBalance);
    finBalance += finDrawdown;

    if (finDrawdown < shortfall) {
      equityCashFlow = -(shortfall - finDrawdown);
      finalCaixa = minimumCaixa;
    } else {
      finalCaixa = caixaFinal + finDrawdown;
    }
  } else {
    finalCaixa = caixaFinal;
  }

  return {
    permutaPayment,
    finInterestPaid,
    finAmortization: 0,
    finDrawdown,
    equityCashFlow,
    outOfPocketInterest,
    finalCaixa,
    finBalance,
    permutaBalance,
    accumulatedOOP,
    availableCashRecord: caixaFinal,
  };
}

/** Cascata pós-construção (grace / repasse / venda de estoque). */
function waterfallPostConstruction(
  availableCash: number,
  finInterest: number,
  finBalance: number,
  permutaBalance: number,
  permutaPercRecebiveis: number,
  receivables: number,
  minimumCaixa: number,
  isRepasseOrLater: boolean
): WaterfallResult {
  let permutaPayment = Math.min(receivables * permutaPercRecebiveis, permutaBalance);
  availableCash -= permutaPayment;
  permutaBalance -= permutaPayment;

  // Juros pagos integralmente (se o caixa zerar ou ficar negativo, a diferença será aportada)
  let finInterestPaid = finInterest;
  availableCash -= finInterestPaid;

  const sweepBuffer = isRepasseOrLater ? 0 : minimumCaixa;
  let cashAvailableForSweep = Math.max(0, availableCash - sweepBuffer);

  let finAmortization = 0;
  if (cashAvailableForSweep > 0) {
    finAmortization = Math.min(cashAvailableForSweep, finBalance);
    availableCash -= finAmortization;
    finBalance -= finAmortization;
    cashAvailableForSweep -= finAmortization;
  }

  if (cashAvailableForSweep > 0) {
    const extraPermuta = Math.min(cashAvailableForSweep, permutaBalance);
    permutaPayment += extraPermuta;
    availableCash -= extraPermuta;
    permutaBalance -= extraPermuta;
    cashAvailableForSweep -= extraPermuta;
  }

  const caixaFinal = availableCash;
  const targetMin = isRepasseOrLater ? 0 : minimumCaixa;
  let equityCashFlow = 0;
  let finalCaixa: number;

  if (caixaFinal > targetMin) {
    equityCashFlow = caixaFinal - targetMin; // Distribuição
    finalCaixa = targetMin;
  } else if (caixaFinal < targetMin) {
    equityCashFlow = -(targetMin - caixaFinal); // Aporte
    finalCaixa = targetMin;
  } else {
    finalCaixa = caixaFinal;
  }


  return {
    permutaPayment,
    finInterestPaid,
    finAmortization,
    finDrawdown: 0,
    equityCashFlow,
    outOfPocketInterest: 0,
    finalCaixa,
    finBalance,
    permutaBalance,
    accumulatedOOP: 0, // não muda pós-construção
    availableCashRecord: caixaFinal,
  };
}

// ─────────────────────────────────────────────────────────────
//  Cálculo de métricas finais
// ─────────────────────────────────────────────────────────────

function computeMetrics(
  cashFlow: MonthlyCashFlow[],
  input: ProjectInput,
  sim: SimulationParams,
  accumulatedOutOfPocketInterest: number,
  currentEstoque: number,
  jurosAIncorrerConstrucao: number
): ProjectMetrics {
  const nav = cashFlow.reduce((sum, cf) => sum + cf.equityCashFlow, 0);

  const expectedPercObras = calculateOptimalCurve(input.percVendas);
  const statusCurvaOtima: 'OK' | 'Atrasado' =
    input.percObras <= expectedPercObras ? 'OK' : 'Atrasado';

  const maxDiscountBeforeNegativeNav =
    input.estoqueAtual > 0
      ? Math.min(1, Math.max(0, sim.discountStock + nav / input.estoqueAtual))
      : 0;

  const finalCoverageRatio =
    input.saldoFinanciamentoTotal > 0
      ? (input.vgvTotal * (1 - sim.discountStock)) / input.saldoFinanciamentoTotal
      : 0;

  // Índices de cobertura
  const posChaves = input.posChavesAReceberAtual;
  const estoque50 = input.estoqueAtual * 0.5;
  const divFin = input.saldoFinanciamentoTotal;
  const divTotal = divFin + input.permutaSaldoInicio;

  const icFinanciamento = divFin > 0 ? posChaves / divFin : 0;
  const icFinanciamentoEstoque = divFin > 0 ? (posChaves + estoque50) / divFin : 0;
  const icTotal = divTotal > 0 ? posChaves / divTotal : 0;
  const icTotalEstoque = divTotal > 0 ? (posChaves + estoque50) / divTotal : 0;

  const saldoALiberar = Math.max(0, input.saldoFinanciamentoTotal - input.saldoFinanciamentoLiberado);

  const resourcesToFinishWorks = 
    input.posicaoCaixa + 
    input.preChavesAReceberAtual + 
    saldoALiberar - 
    input.custoAIncorrer - 
    jurosAIncorrerConstrucao;

  const gapObra = Math.max(0, -resourcesToFinishWorks);
  const vgvDisponivelDuranteObra = input.vgvTotal * ((input.vendasPercSinal || 0.10) + (input.vendasPercPreChaves || 0.15)) * (1 - sim.discountStock);
  const percVendasParaGap = vgvDisponivelDuranteObra > 0 ? gapObra / vgvDisponivelDuranteObra : 0;

  return {
    nav,
    totalOutOfPocketInterest: accumulatedOutOfPocketInterest,
    finalCoverageRatio,
    icFinanciamento,
    icFinanciamentoEstoque,
    icTotal,
    icTotalEstoque,
    remainingStockValue: Math.max(0, currentEstoque),
    maxDiscountBeforeNegativeNav,
    resourcesToFinishWorks,
    percVendasParaGap,
    statusCurvaOtima,
    expectedPercObras,
  };
}

// ─────────────────────────────────────────────────────────────
//  Simulação principal
// ─────────────────────────────────────────────────────────────

export function runSimulation(
  input: ProjectInput,
  sim: SimulationParams,
  macros: MacroInput[] = [],
  fallbackDate?: Date,
  isStaticForMetrics = false
): ProjectData {
  // ── Data-base da projeção ──
  const currentDate = macros.length > 0
    ? new Date(macros[0].mesAno)
    : (fallbackDate || new Date());
  currentDate.setDate(1);

  // ── Parâmetros ajustados pela simulação ──
  const custoTotalReferencia = input.custoIncorrido + input.custoAIncorrer;
  const adjustedCustoAIncorrer = input.custoAIncorrer + (custoTotalReferencia * sim.costOverrun);
  const adjustedDataEntrega = addMonths(input.dataEstimadaEntrega, sim.delayMonths);
  const constructionMonths = Math.max(1, differenceInMonths(adjustedDataEntrega, currentDate));
  const totalMonths = constructionMonths + 15; // Construção + Carência (3) + Revendas (12 meses totais de escoamento pós-carência)

  // ── Estado mutável ao longo da projeção ──
  let pools: INCCPools = {
    costAIncorrer: adjustedCustoAIncorrer,
    poolPreChaves: input.preChavesAReceberAtual,
    repassePool: input.posChavesAReceberAtual,
    vgvTotal: input.vgvTotal,
    estoque: input.estoqueAtual,
  };

  let currentCaixa = input.posicaoCaixa;
  const minimumCaixa = input.posicaoCaixa;

  let currentFinBalance = input.saldoFinanciamentoLiberado;
  let currentPermutaBalance = input.permutaSaldoInicio;
  let accumulatedOutOfPocketInterest = 0;

  let currentPercVendas = input.percVendas;
  let currentPercObras = input.percObras;

  const remainingVendas = 1 - input.percVendas;
  const remainingUnits = input.numeroUnidades * remainingVendas;

  const futureInstallments: number[] = new Array(totalMonths + 1).fill(0);
  let repasseMonthCount = 0;

  const cashFlow: MonthlyCashFlow[] = [];

  // ── Loop mensal ──
  for (let m = 1; m <= totalMonths; m++) {
    const currentMonthDate = addMonths(currentDate, m);

    // 1. Determinar fase do projeto
    const phase = determinePhase(
      m, constructionMonths, currentMonthDate,
      input, currentPercVendas, currentPercObras,
    );

    // 2. Taxas macro do mês
    const rates = getMacroRatesForMonth(macros, currentMonthDate);

    // 3. Correção monetária (INCC) sobre saldos
    pools = applyINCC(pools, futureInstallments, rates.inccMonthly, m, totalMonths);

    // 4. Taxas de dívida do mês
    const finMonthlyRate = computeMonthlyDebtRate(input.finTaxaAnual, input.finIndexador, rates);
    const permutaMonthlyRate = computeMonthlyDebtRate(input.permutaTaxaAnual, input.permutaIndexador, rates);

    // 5. Snapshot de início do mês
    const percVendasInicial = currentPercVendas;
    const percObrasInicial = currentPercObras;
    const caixaInicial = currentCaixa;
    const rendimentoCaixa = caixaInicial > 0 ? caixaInicial * (rates.cdiMonthly * 0.85) : 0;

    // 6. Evolução de obras
    const remainingConstMonths = Math.max(1, constructionMonths - m + 1);
    let constructionCost = 0;
    let obrasMes = 0;

    if (phase.isConstructing) {
      obrasMes = Math.min(1 - currentPercObras, (1 - currentPercObras) / remainingConstMonths);
      constructionCost = pools.costAIncorrer / remainingConstMonths;
      pools.costAIncorrer -= constructionCost;
    }

    // 7. Vendas do mês
    let vendasMesBase = remainingVendas / totalMonths; // 'linear' fallback

    if (input.salesProjectionMode === 'target') {
      const target = input.targetPercVendasObra || input.percVendas;
      const salesToHitTarget = Math.max(0, target - input.percVendas);
      const salesLeftAfterTarget = Math.max(0, 1 - target);
      const monthsPostConst = totalMonths - constructionMonths;

      if (phase.isConstructionPhase) {
        vendasMesBase = salesToHitTarget / constructionMonths;
      } else {
        vendasMesBase = salesLeftAfterTarget / monthsPostConst;
      }
    } else if (input.salesProjectionMode === 'historical') {
      vendasMesBase = input.histVendasMensal || 0;
    }

    let vendasMes = vendasMesBase * (sim.salesSpeedMultiplier ?? 1);
    
    // Limita as vendas para não ultrapassar 100% do projeto
    vendasMes = Math.min(vendasMes, Math.max(0, 1 - currentPercVendas));
    
    const unidadesVendidasMes = input.numeroUnidades * vendasMes;
    
    // O usuário definiu que o desconto de estoque (discountStock) deve aplicar em todas as unidades vendidas 
    // a partir da data de simulação, e não apenas no estoque pronto da fase final.
    const vgvVendidoTabela = vendasMes * pools.vgvTotal;
    const vgvVendidoMes = vgvVendidoTabela * (1 - sim.discountStock);

    // 8. Recebíveis por fase
    const recResult = calculateReceivables(
      phase, pools, futureInstallments, input, sim,
      vgvVendidoMes, vgvVendidoTabela, m, constructionMonths, repasseMonthCount,
    );
    pools.poolPreChaves = recResult.poolPreChaves;
    pools.repassePool = recResult.repassePool;
    pools.estoque = recResult.estoque;
    repasseMonthCount = recResult.repasseMonthCount;

    // 9. Atualizar % vendas / obras
    currentPercVendas += vendasMes;
    currentPercObras += obrasMes;

    const precoMedioVenda = unidadesVendidasMes > 0
      ? vgvVendidoMes / unidadesVendidasMes
      : 0;

    const estoqueRemanescentePerc = Math.max(0, 1 - currentPercVendas);
    const estoqueRemanescenteRs = pools.vgvTotal * estoqueRemanescentePerc;

    // 10. Juros sobre dívidas
    const financingBalanceInicial = currentFinBalance;
    const finInterest = currentFinBalance * finMonthlyRate;

    const permutaBalanceInicial = currentPermutaBalance;
    const permutaInterest = currentPermutaBalance * permutaMonthlyRate;
    currentPermutaBalance += permutaInterest;

    // 11. Caixa disponível bruto
    let availableCash = caixaInicial + recResult.receivables + rendimentoCaixa;
    const retPayment = recResult.receivables * 0.04; // Imposto RET simples
    const brokeragePayment = vgvVendidoMes * (sim.brokerageFee ?? 0.06);

    availableCash -= retPayment;
    availableCash -= brokeragePayment;

    // 12. Cascata de pagamentos
    let wf: WaterfallResult;

    if (phase.isConstructionPhase) {
      wf = waterfallConstruction(
        availableCash,
        constructionCost,
        finInterest,
        currentFinBalance,
        input.saldoFinanciamentoTotal,
        currentPermutaBalance,
        input.permutaPercRecebiveis,
        recResult.receivables,
        minimumCaixa,
        accumulatedOutOfPocketInterest,
      );
      accumulatedOutOfPocketInterest = wf.accumulatedOOP;
    } else {
      wf = waterfallPostConstruction(
        availableCash,
        finInterest,
        currentFinBalance,
        currentPermutaBalance,
        input.permutaPercRecebiveis,
        recResult.receivables,
        minimumCaixa,
        m === totalMonths,
      );
    }

    currentFinBalance = wf.finBalance;
    currentPermutaBalance = wf.permutaBalance;
    currentCaixa = wf.finalCaixa;

    // 13. Registrar fluxo do mês
    cashFlow.push({
      month: m,
      date: currentMonthDate,
      isConstruction: phase.isConstructionPhase,

      percVendasInicial,
      vendasMes,
      percVendasFinal: currentPercVendas,

      percObrasInicial,
      obrasMes,
      percObrasFinal: currentPercObras,

      estoqueRemanescentePerc,
      estoqueRemanescenteRs,
      saldoReceberPreChaves: pools.poolPreChaves,
      saldoReceberPosChaves: pools.repassePool,

      caixaInicial,
      receivables: recResult.receivables,
      receivablesPreChaves: recResult.receivablesPreChaves,
      receivablesRepasse: recResult.receivablesRepasse,
      receivablesEstoque: recResult.receivablesEstoque,
      rendimentoCaixa,
      retPayment,
      brokeragePayment,
      permutaPayment: wf.permutaPayment,
      constructionCost,
      financingInterestPaid: wf.finInterestPaid,
      caixaFinal: wf.availableCashRecord,
      financingDrawdown: wf.finDrawdown,
      caixaAposFinanciamento: currentCaixa,

      financingBalanceInicial,
      financingInterest: finInterest,
      financingAmortization: wf.finAmortization,
      financingBalance: currentFinBalance,

      permutaBalanceInicial,
      permutaInterest,
      permutaBalance: currentPermutaBalance,
      equityCashFlow: wf.equityCashFlow,
      accumulatedOutOfPocketInterest,

      percObras: currentPercObras,
      percVendas: currentPercVendas,
      unidadesVendidasMes,
      precoMedioVenda,
    });
  }

  // ── Métricas finais ──
  let jurosStatic = 0;
  if (!isStaticForMetrics) {
    const staticResult = runSimulation(input, { ...sim, salesSpeedMultiplier: 0 }, macros, fallbackDate, true);
    jurosStatic = staticResult.cashFlow
      .filter(cf => cf.isConstruction)
      .reduce((sum, cf) => sum + cf.financingInterest, 0);
  } else {
    jurosStatic = cashFlow
      .filter(cf => cf.isConstruction)
      .reduce((sum, cf) => sum + cf.financingInterest, 0);
  }

  const metrics = computeMetrics(
    cashFlow,
    input,
    sim,
    accumulatedOutOfPocketInterest,
    pools.estoque,
    jurosStatic
  );

  return { input, simulation: sim, cashFlow, metrics };
}
