import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ProjectData } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function getColLetter(colIndex: number): string {
  let temp = colIndex;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

export async function exportProjectCashFlowToExcel(data: ProjectData) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Fluxo de Caixa', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }]
  });

  const cf = data.cashFlow;
  
  // 1. Create Header Row
  const headerRow = ['Mês / Item', ...cf.map(c => format(c.date, 'MMM/yy', { locale: ptBR }).toUpperCase())];
  const rHeader = sheet.addRow(headerRow);
  rHeader.font = { bold: true };
  rHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF1F9' } };
  
  sheet.getColumn(1).width = 45; // Wide first column
  for (let i = 2; i <= cf.length + 1; i++) {
    sheet.getColumn(i).width = 16;
  }

  // 2. Setup Styles
  const currencyStyle = { numFmt: '"R$ "#,##0.00' };
  const percentStyle = { numFmt: '0.00%' };
  const getCol = (idx: number) => getColLetter(idx + 1); // 0-based index to Col B, Col C...

  let rowIndex = 2;

  const addStaticRow = (label: string, accessor: (c: typeof cf[0]) => number, formatStyle: any = currencyStyle, isBold = false) => {
    const row = [label, ...cf.map(c => accessor(c))];
    const r = sheet.addRow(row);
    for (let i = 2; i <= row.length; i++) {
        r.getCell(i).style = formatStyle;
        if (isBold) r.getCell(i).font = { bold: true };
    }
    if (isBold) r.getCell(1).font = { bold: true };
    const currentRow = rowIndex;
    rowIndex++;
    return currentRow;
  };

  const addHeaderLabel = (label: string) => {
    const r = sheet.addRow([label]);
    r.getCell(1).font = { bold: true, color: { argb: 'FF333333' } };
    if (label !== '') r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    rowIndex++;
    return rowIndex - 1;
  };

  // Section 0. Tracking
  addHeaderLabel('I. ESTATÍSTICAS DO MÊS');
  addStaticRow('% Vendas Final', c => c.percVendasFinal, percentStyle);
  addStaticRow('% Obra Final', c => c.percObrasFinal, percentStyle);
  const rowIndexCaixaInicial = addStaticRow('Caixa Inicial (Início do Mês)', c => c.caixaInicial, currencyStyle, true);

  // Formulized Operacional
  addHeaderLabel('');
  addHeaderLabel('II. FLUXO DE CAIXA OPERACIONAL (A)');
  const rRecebimentos = addStaticRow('Recebimentos Brutos (Vendas)', c => c.receivables);
  const rRendimentos = addStaticRow('Rendimentos sobre Caixa', c => c.rendimentoCaixa);
  const rRet = addStaticRow('Imposto RET (-)', c => -c.retPayment);
  addStaticRow('Despesas de Corretagem (-)', c => -c.brokeragePayment);
  const rCusto = addStaticRow('Custo de Obras (-)', c => -c.constructionCost);

  const rowResOpData = ['Resultado Operacional (A)'];
  const rResOp = sheet.addRow(rowResOpData);
  rResOp.getCell(1).font = { bold: true };
  rResOp.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
  for (let i = 0; i < cf.length; i++) {
    const colId = getCol(i);
    rResOp.getCell(i + 2).value = { formula: `SUM(${colId}${rRecebimentos}:${colId}${rCusto})` };
    rResOp.getCell(i + 2).style = { ...currencyStyle, font: { bold: true } };
  }
  const rowIndexResOp = rowIndex++;

  // Formulized Financeiro
  addHeaderLabel('');
  addHeaderLabel('III. SERVIÇO DAS DÍVIDAS E TRANSAÇÕES (B)');
  const rSaque = addStaticRow('Liberação Financiamento (Saque) (+)', c => c.financingDrawdown);
  const rJuros = addStaticRow('Pagamento Juros do Financiamento (-)', c => -c.financingInterestPaid);
  const rAmort = addStaticRow('Amortização Principal Financiamento (-)', c => -c.financingAmortization);
  const rPermuta = addStaticRow('Pagamento Permuta (-)', c => -c.permutaPayment);

  const rowResFinData = ['Resultado Financeiro (B)'];
  const rResFin = sheet.addRow(rowResFinData);
  rResFin.getCell(1).font = { bold: true };
  rResFin.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
  for (let i = 0; i < cf.length; i++) {
    const colId = getCol(i);
    rResFin.getCell(i + 2).value = { formula: `SUM(${colId}${rSaque}:${colId}${rPermuta})` };
    rResFin.getCell(i + 2).style = { ...currencyStyle, font: { bold: true } };
  }
  const rowIndexResFin = rowIndex++;

  addHeaderLabel('');
  addHeaderLabel('IV. FLUXO DE CAPITAL (SÓCIOS)');
  const rowIndexAporte = addStaticRow('Aporte (-) ou Distribuição (+)', c => c.equityCashFlow);
  
  addHeaderLabel('');
  const rCaixaFinal = sheet.addRow(['SALDO FINAL DE CAIXA (MÊS)']);
  rCaixaFinal.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  rCaixaFinal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
  const rowIndexCaixaFinal = rowIndex++;
  for (let i = 0; i < cf.length; i++) {
    const colId = getCol(i);
    const formula = `${colId}${rowIndexCaixaInicial} + ${colId}${rowIndexResOp} + ${colId}${rowIndexResFin} - ${colId}${rowIndexAporte}`;
    rCaixaFinal.getCell(i + 2).value = { formula };
    rCaixaFinal.getCell(i + 2).style = { ...currencyStyle, font: { bold: true, color: { argb: 'FFFFFFFF' } } };
  }

  // Cross-link subsequent months' initial cash to previous month's final cash dynamically!
  for (let i = 1; i < cf.length; i++) {
     const prevColId = getCol(i - 1);
     const currentCell = sheet.getCell(rowIndexCaixaInicial, i + 2);
     currentCell.value = { formula: `${prevColId}${rowIndexCaixaFinal}` };
  }

  addHeaderLabel('');
  addHeaderLabel('V. CONTROLE DE ENDIVIDAMENTO (ESTÁTICO DA SIMULAÇÃO)');
  addStaticRow('Saldo Devedor Financiamento', c => c.financingBalance);
  addStaticRow('Saldo Devedor Permuta', c => c.permutaBalance);

  addHeaderLabel('');
  addHeaderLabel('VI. CARTEIRA DE RECEBÍVEIS (VENDIDO)');
  addStaticRow('Saldo a Receber - Pré-Chaves', c => c.saldoReceberPreChaves);
  addStaticRow('Saldo a Receber - Pós-Chaves/Repasse', c => c.saldoReceberPosChaves);

  // Export
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Fluxo_de_Caixa_${data.input.nome.replace(/\s+/g, '_')}.xlsx`);
}
