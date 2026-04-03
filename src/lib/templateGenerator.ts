import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { dummyProjects } from './dummyData';
import { format } from 'date-fns';

export async function downloadTemplate() {
  const wb = new ExcelJS.Workbook();
  const wsProjects = wb.addWorksheet('Projetos');
  const wsMacros = wb.addWorksheet('Macros');
  const wsPremissas = wb.addWorksheet('Premissas');

  const config = [
    // Identificação (Cinza)
    { header: 'Empresa', unit: 'Texto', color: 'F1F5F9', font: '1E293B', width: 25 },
    { header: 'Nome do projeto', unit: 'Texto', color: 'F1F5F9', font: '1E293B', width: 35 },
    { header: 'Padrão', unit: 'Alto/Médio', color: 'F1F5F9', font: '1E293B', width: 15 },
    { header: 'Numero de unidades', unit: 'Inteiro', color: 'F1F5F9', font: '1E293B', width: 20 },
    { header: 'Metragem média das unidades', unit: 'Decimal', color: 'F1F5F9', font: '1E293B', width: 25 },
    
    // Cronograma (Verde)
    { header: 'Data de lançamento', unit: 'MM/DD/AAAA', color: 'DCFCE7', font: '166534', width: 20 },
    { header: 'Data de início das obras', unit: 'MM/DD/AAAA', color: 'DCFCE7', font: '166534', width: 20 },
    { header: 'Data estimada de entrega', unit: 'MM/DD/AAAA', color: 'DCFCE7', font: '166534', width: 20 },
    
    // Comercial (Azul)
    { header: 'VGV Total', unit: 'R$', color: 'DBEAFE', font: '1E40AF', width: 20 },
    { header: '% vendas', unit: 'Decimal (Ex: 0.5 = 50%)', color: 'DBEAFE', font: '1E40AF', width: 25 },
    { header: '% recebido de sinal', unit: 'Decimal', color: 'DBEAFE', font: '1E40AF', width: 25 },
    { header: '% pré-chaves', unit: 'Decimal', color: 'DBEAFE', font: '1E40AF', width: 25 },
    { header: '% pós-chaves', unit: 'Decimal', color: 'DBEAFE', font: '1E40AF', width: 25 },
    { header: 'Modo Projeção Vendas (linear/target/historical)', unit: 'Texto', color: 'DBEAFE', font: '1E40AF', width: 45 },
    { header: 'Alvo % Vendas Fim Obra', unit: 'Decimal', color: 'DBEAFE', font: '1E40AF', width: 25 },
    { header: 'Média Histórica Vendas Mensal', unit: 'Decimal', color: 'DBEAFE', font: '1E40AF', width: 30 },
    
    // Engenharia (Amarelo)
    { header: '% de obras', unit: 'Decimal', color: 'FEF3C7', font: '92400E', width: 20 },
    { header: 'Custo incorrido', unit: 'R$', color: 'FEF3C7', font: '92400E', width: 20 },
    { header: 'Custo a incorrer', unit: 'R$', color: 'FEF3C7', font: '92400E', width: 20 },
    
    // Posição Financeira (Roxo)
    { header: 'Estoque Atual', unit: 'R$', color: 'F3E8FF', font: '6B21A8', width: 20 },
    { header: 'Pré-chaves recebido', unit: 'R$', color: 'F3E8FF', font: '6B21A8', width: 25 },
    { header: 'Pré-chaves a receber atual', unit: 'R$', color: 'F3E8FF', font: '6B21A8', width: 30 },
    { header: 'Pós-chaves a receber atual', unit: 'R$', color: 'F3E8FF', font: '6B21A8', width: 30 },
    { header: 'Posição de Caixa da SPE', unit: 'R$', color: 'F3E8FF', font: '6B21A8', width: 25 },
    
    // Financiamento à Construção (Rosa)
    { header: 'Saldo do Financiamento atual liberado', unit: 'R$', color: 'FCE7F3', font: '9D174D', width: 35 },
    { header: 'Saldo do financiamento total', unit: 'R$', color: 'FCE7F3', font: '9D174D', width: 30 },
    { header: 'Taxa anual (Fin)', unit: 'Decimal (Ex: 0.12 = 12%)', color: 'FCE7F3', font: '9D174D', width: 25 },
    { header: 'Indexador (Fin)', unit: 'Texto (Ex: CDI)', color: 'FCE7F3', font: '9D174D', width: 25 },
    { header: '% de financiamento do projeto', unit: 'Decimal', color: 'FCE7F3', font: '9D174D', width: 30 },
    
    // Permuta (Laranja)
    { header: 'Saldo no inicio (Permuta)', unit: 'R$', color: 'FFEDD5', font: 'C2410C', width: 25 },
    { header: 'Taxa Anual (Permuta)', unit: 'Decimal', color: 'FFEDD5', font: 'C2410C', width: 25 },
    { header: 'Indexador (Permuta)', unit: 'Texto', color: 'FFEDD5', font: 'C2410C', width: 25 },
    { header: '% de permuta dos recebíveis', unit: 'Decimal', color: 'FFEDD5', font: 'C2410C', width: 30 }
  ];

  wsProjects.columns = config.map(c => ({ header: c.header, key: c.header, width: c.width }));
  wsProjects.insertRow(2, config.map(c => c.unit));
  
  config.forEach((c, index) => {
    const colNumber = index + 1;
    const cellH1 = wsProjects.getCell(1, colNumber);
    cellH1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.color } };
    cellH1.font = { bold: true, color: { argb: c.font } };
    cellH1.border = { bottom: { style: 'thin' }, right: { style: 'thin', color: { argb: 'E2E8F0' } } };
    cellH1.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    
    const cellH2 = wsProjects.getCell(2, colNumber);
    cellH2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: c.color } };
    cellH2.font = { italic: true, size: 10, color: { argb: c.font } };
    cellH2.border = { bottom: { style: 'medium' }, right: { style: 'thin', color: { argb: 'E2E8F0' } } };
    cellH2.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  wsProjects.getRow(1).height = 30;
  wsProjects.views = [{ state: 'frozen', ySplit: 2 }];

  dummyProjects.forEach(p => {
    wsProjects.addRow([
      p.empresa,
      p.nome,
      p.padrao,
      p.numeroUnidades,
      p.metragemMedia,
      format(p.dataLancamento, 'MM/dd/yyyy'),
      format(p.dataInicioObras, 'MM/dd/yyyy'),
      format(p.dataEstimadaEntrega, 'MM/dd/yyyy'),
      p.vgvTotal,
      p.percVendas,
      p.vendasPercSinal,
      p.vendasPercPreChaves,
      p.vendasPercPosChaves,
      p.salesProjectionMode || 'linear',
      p.targetPercVendasObra || 0.8,
      p.histVendasMensal || 0.05,
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
  });

  // Aba: Macros
  wsMacros.columns = [
    { header: 'Mês/Ano', key: 'mes', width: 20 },
    { header: 'INCC', key: 'incc', width: 15 },
    { header: 'CDI', key: 'cdi', width: 15 },
    { header: 'IPCA', key: 'ipca', width: 15 }
  ];
  wsMacros.insertRow(2, ['DD/MM/AAAA', 'Decimal', 'Decimal', 'Decimal']);
  
  const macroColors = ['E2E8F0', 'E2E8F0', 'E2E8F0', 'E2E8F0'];
  macroColors.forEach((color, idx) => {
    const colNumber = idx + 1;
    [1, 2].forEach(rowNum => {
      const cell = wsMacros.getCell(rowNum, colNumber);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
      cell.font = rowNum === 1 ? { bold: true, color: { argb: '334155' } } : { italic: true, size: 10, color: { argb: '64748B' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: rowNum === 2 ? { style: 'medium' } : { style: 'thin' } };
    });
  });

  let currentDate = new Date();
  for (let i = 0; i < 36; i++) {
    wsMacros.addRow([format(currentDate, 'MM/dd/yyyy'), 0.05, 0.105, 0.045]);
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Aba: Premissas
  wsPremissas.columns = [
    { header: 'Parâmetro', key: 'parametro', width: 35 },
    { header: 'Valor', key: 'valor', width: 25 }
  ];
  
  [1, 2].forEach(colNumber => {
    const cell = wsPremissas.getCell(1, colNumber);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'CBD5E1' } };
    cell.font = { bold: true, color: { argb: '0F172A' } };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
  });

  wsPremissas.addRow(['Data Base da Projeção', format(new Date(), 'MM/dd/yyyy')]);
  wsPremissas.addRow(['Desconto Estoque Pronto', 0.10]);
  wsPremissas.addRow(['Velocidade de Vendas (Multiplicador)', 1.0]);
  wsPremissas.addRow(['Corretagem', 0.06]);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, 'Template_IncorpRisk.xlsx');
}
