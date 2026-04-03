import * as XLSX from 'xlsx';
import { dummyProjects } from './dummyData';
import { format } from 'date-fns';

export function downloadTemplate() {
  const projectColumns = [
    // Identificação
    'Empresa',
    'Nome do projeto',
    'Padrão',
    'Numero de unidades',
    'Metragem média das unidades',
    
    // Cronograma
    'Data de lançamento',
    'Data de início das obras',
    'Data estimada de entrega',
    
    // Comercial
    'VGV Total',
    '% vendas',
    '% recebido de sinal',
    '% pré-chaves',
    '% pós-chaves',
    
    // Engenharia
    '% de obras',
    'Custo incorrido',
    'Custo a incorrer',
    
    // Posição Financeira
    'Estoque Atual',
    'Pré-chaves recebido',
    'Pré-chaves a receber atual',
    'Pós-chaves a receber atual',
    'Posição de Caixa da SPE',
    'Saldo do Financiamento atual liberado',
    'Saldo do financiamento total',

    // Dados de Financiamento à Construção
    'Taxa anual (Fin)',
    'Indexador (Fin)',
    '% de financiamento do projeto',
    
    // Dados de Permuta Registrada
    'Saldo no inicio (Permuta)',
    'Taxa Anual (Permuta)',
    'Indexador (Permuta)',
    '% de permuta dos recebíveis'
  ];

  const macroColumns = ['Mês/Ano', 'INCC', 'CDI', 'IPCA'];

  const projectsRows = dummyProjects.map(p => [
    p.empresa,
    p.nome,
    p.padrao,
    p.numeroUnidades,
    p.metragemMedia,
    
    format(p.dataLancamento, 'yyyy-MM-dd'),
    format(p.dataInicioObras, 'yyyy-MM-dd'),
    format(p.dataEstimadaEntrega, 'yyyy-MM-dd'),
    
    p.vgvTotal,
    p.percVendas,
    p.vendasPercSinal,
    p.vendasPercPreChaves,
    p.vendasPercPosChaves,
    
    p.percObras,
    p.custoIncorrido,
    p.custoAIncorrer,
    
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
    p.permutaPercRecebiveis
  ]);

  const macroRows = [];
  let currentDate = new Date();
  for (let i = 0; i < 36; i++) {
    macroRows.push([
      format(currentDate, 'yyyy-MM-dd'),
      0.05,
      0.105,
      0.045
    ]);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  const premissasColumns = ['Parâmetro', 'Valor'];
  const premissasRows = [
    ['Data Base da Projeção', format(new Date(), 'yyyy-MM-dd')]
  ];

  const wsProjects = XLSX.utils.aoa_to_sheet([projectColumns, ...projectsRows]);
  const wsMacros = XLSX.utils.aoa_to_sheet([macroColumns, ...macroRows]);
  const wsPremissas = XLSX.utils.aoa_to_sheet([premissasColumns, ...premissasRows]);

  // Expandir larguras logicamente para conforto de leitura
  wsProjects['!cols'] = projectColumns.map((colName) => ({ wch: Math.max(16, colName.length + 2) }));
  wsMacros['!cols'] = macroColumns.map((colName) => ({ wch: Math.max(15, colName.length + 2) }));
  wsPremissas['!cols'] = [{ wch: 25 }, { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsProjects, 'Projetos');
  XLSX.utils.book_append_sheet(wb, wsMacros, 'Macros');
  XLSX.utils.book_append_sheet(wb, wsPremissas, 'Premissas');

  XLSX.writeFile(wb, 'Template_IncorpRisk.xlsx');
}
