import * as XLSX from 'xlsx';
import { format, addMonths } from 'date-fns';
import { ProjectInput, MacroInput, SimulationParams } from '../types';

export function exportMemoryCard(
  projects: ProjectInput[], 
  macros: MacroInput[], 
  globalSim: SimulationParams,
  baseDate: Date
) {
  const projectColumns = [
    'Empresa', 'Nome do projeto', 'Padrão', 'Numero de unidades', 'Metragem média das unidades',
    'Data de lançamento', 'Data de início das obras', 'Data estimada de entrega',
    'VGV Total', '% vendas', '% recebido de sinal', '% pré-chaves', '% pós-chaves',
    '% de obras', 'Custo incorrido', 'Custo a incorrer',
    'Estoque Atual', 'Pré-chaves recebido', 'Pré-chaves a receber atual', 'Pós-chaves a receber atual',
    'Posição de Caixa da SPE', 'Saldo do Financiamento atual liberado', 'Saldo do financiamento total',
    'Taxa anual (Fin)', 'Indexador (Fin)', '% de financiamento do projeto',
    'Saldo no inicio (Permuta)', 'Taxa Anual (Permuta)', 'Indexador (Permuta)', '% de permuta dos recebíveis',
    'Outros Custos VGV < 33%', 'Outros Custos VGV < 66%', 'Outros Custos VGV > 66%',
    'Custo Jurídico Obra', 'Custo Jurídico Pós-Obra',
    'Override Sim - Sobrecusto', 'Override Sim - Atraso', 'Override Sim - Desconto',
    'Matriz Sens 1 - Desconto', 'Matriz Sens 2 - Sobrecusto', 'Matriz Sens 3 - Atraso'
  ];

  const projectsRows = projects.map(p => {
    const custoAIncorrerBake = p.custoAIncorrer * (1 + globalSim.costOverrun);
    const dataEstimadaEntregaBake = addMonths(p.dataEstimadaEntrega, globalSim.delayMonths);

    return [
      p.empresa,
      p.nome,
      p.padrao,
      p.numeroUnidades,
      p.metragemMedia,
      p.dataLancamento,
      p.dataInicioObras,
      dataEstimadaEntregaBake,
      p.vgvTotal,
      p.percVendas,
      p.vendasPercSinal,
      p.vendasPercPreChaves,
      p.vendasPercPosChaves,
      p.percObras,
      p.custoIncorrido,
      custoAIncorrerBake,
      p.estoqueAtual,
      p.preChavesRecebido,
      p.preChavesAReceberAtual,
      p.posChavesAReceberAtual,
      p.posicaoCaixa,
      p.saldoFinanciamentoLiberado,
      p.saldoFinanciamentoTotal,
      p.finTaxaAnual,
      p.finIndexador,
      p.finPercFinanciamento,
      p.permutaSaldoInicio,
      p.permutaTaxaAnual,
      p.permutaIndexador,
      p.permutaPercRecebiveis,
      p.outrosCustosVgvTerc1 ?? '',
      p.outrosCustosVgvTerc2 ?? '',
      p.outrosCustosVgvTerc3 ?? '',
      p.custoJuridicoObra ?? '',
      p.custoJuridicoPosObra ?? '',
      p.customSim?.costOverrun ?? '',
      p.customSim?.delayMonths ?? '',
      p.customSim?.discountStock ?? '',
      p.sensMatrix1_Discount ?? '',
      p.sensMatrix2_Cost ?? '',
      p.sensMatrix3_Delay ?? ''
    ];
  });

  const macroColumns = ['Mês/Ano', 'INCC', 'CDI', 'IPCA', 'TR'];
  const macroRows = macros.map(m => [
    m.mesAno,
    m.incc,
    m.cdi,
    m.ipca,
    m.tr
  ]);

  const premissasColumns = ['Parâmetro', 'Valor'];
  const premissasRows = [
    ['Data Base da Projeção', baseDate],
    ['Desconto Estoque Pronto', globalSim.discountStock],
    ['Velocidade de Vendas (Multiplicador)', globalSim.salesSpeedMultiplier],
    ['Corretagem', globalSim.brokerageFee],
    ['Carrego Estoque (Baixo Padrão)', globalSim.carregoBaixo],
    ['Carrego Estoque (Médio Padrão)', globalSim.carregoMedio],
    ['Carrego Estoque (Alto Padrão)', globalSim.carregoAlto]
  ];

  const options = { dateNF: 'dd/mm/yyyy', cellDates: true };
  const wsProjects = XLSX.utils.aoa_to_sheet([projectColumns, ...projectsRows], options);
  const wsMacros = XLSX.utils.aoa_to_sheet([macroColumns, ...macroRows], options);
  const wsPremissas = XLSX.utils.aoa_to_sheet([premissasColumns, ...premissasRows], options);

  wsProjects['!cols'] = projectColumns.map((colName) => ({ wch: Math.max(16, colName.length + 2) }));
  wsMacros['!cols'] = macroColumns.map((colName) => ({ wch: Math.max(15, colName.length + 2) }));
  wsPremissas['!cols'] = [{ wch: 35 }, { wch: 20 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsProjects, 'Projetos');
  XLSX.utils.book_append_sheet(wb, wsMacros, 'Macros');
  XLSX.utils.book_append_sheet(wb, wsPremissas, 'Premissas');

  XLSX.writeFile(wb, 'MemoryCard_IncorpRisk.xlsx');
}
