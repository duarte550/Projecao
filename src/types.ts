export interface ProjectInput {
  id: string;
  empresa: string;
  nome: string;
  padrao: 'Médio' | 'Alto';
  dataLancamento: Date;
  percVendas: number;
  vgvTotal: number;
  percObras: number;
  custoAIncorrer: number;
  custoIncorrido: number;
  preChavesRecebido: number;
  preChavesAReceberAtual: number;
  posChavesAReceberAtual: number;
  estoqueAtual: number;
  numeroUnidades: number;
  metragemMedia: number;
  posicaoCaixa: number;
  saldoFinanciamentoLiberado: number;
  saldoFinanciamentoTotal: number;
  dataEstimadaEntrega: Date;
  dataInicioObras: Date;
  
  finTaxaAnual: number;
  finIndexador: string;
  finPercFinanciamento: number;
  
  permutaTaxaAnual: number;
  permutaIndexador: string;
  permutaSaldoInicio: number;
  permutaPercRecebiveis: number;

  vendasPercSinal: number;
  vendasPercPreChaves: number;
  vendasPercPosChaves: number;
}

export interface MacroInput {
  mesAno: Date;
  incc: number;
  cdi: number;
  ipca?: number;
}

export interface SimulationParams {
  costOverrun: number;
  delayMonths: number;
  salesSpeedMultiplier: number;
  discountStock: number;
  brokerageFee: number;
}

export interface MonthlyCashFlow {
  month: number;
  date: Date;
  isConstruction: boolean;
  
  percVendasInicial: number;
  vendasMes: number;
  percVendasFinal: number;
  
  percObrasInicial: number;
  obrasMes: number;
  percObrasFinal: number;
  
  estoqueRemanescentePerc: number;
  estoqueRemanescenteRs: number;
  
  saldoReceberPreChaves: number;
  saldoReceberPosChaves: number;
  
  caixaInicial: number;
  receivables: number;
  receivablesPreChaves: number;
  receivablesRepasse: number;
  receivablesEstoque: number;
  rendimentoCaixa: number;
  retPayment: number;
  brokeragePayment: number;
  permutaPayment: number;
  constructionCost: number;
  financingInterestPaid: number;
  caixaFinal: number;
  financingDrawdown: number;
  caixaAposFinanciamento: number;
  
  financingBalanceInicial: number;
  financingInterest: number;
  financingAmortization: number;
  financingBalance: number;
  
  permutaBalanceInicial: number;
  permutaInterest: number;
  permutaBalance: number;
  equityCashFlow: number;
  accumulatedOutOfPocketInterest: number;
  
  percObras: number;
  percVendas: number;
  unidadesVendidasMes: number;
  precoMedioVenda: number;
}

export interface ProjectMetrics {
  nav: number;
  totalOutOfPocketInterest: number;
  finalCoverageRatio: number;
  icFinanciamento: number;
  icFinanciamentoEstoque: number;
  icTotal: number;
  icTotalEstoque: number;
  remainingStockValue: number;
  maxDiscountBeforeNegativeNav: number;
  resourcesToFinishWorks: number;
  statusCurvaOtima: 'OK' | 'Atrasado';
  expectedPercObras: number;
}

export interface ProjectData {
  input: ProjectInput;
  simulation: SimulationParams;
  cashFlow: MonthlyCashFlow[];
  metrics: ProjectMetrics;
}
