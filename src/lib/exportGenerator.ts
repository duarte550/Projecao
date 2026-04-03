import * as XLSX from 'xlsx';
import { ProjectData } from '../types';
import { format } from 'date-fns';

export function downloadCashFlows(projectsData: ProjectData[]) {
  const rows: any[] = [];

  projectsData.forEach(data => {
    data.cashFlow.forEach(cf => {
      rows.push({
        'Projeto': data.input.nome,
        'Mês': cf.month,
        'Data': format(cf.date, 'MM/yyyy'),
        '% Obras Acumulado': cf.percObras,
        '% Vendas Acumulado': cf.percVendas,
        'Unidades Vendidas no Mês': cf.unidadesVendidasMes,
        'Preço Médio de Venda': cf.precoMedioVenda,
        'Recebíveis': cf.receivables,
        'Custo de Obras': cf.constructionCost,
        'Rendimento do Caixa': cf.rendimentoCaixa,
        'Pagamento Permuta': cf.permutaPayment,
        'Juros Financiamento Pagos': cf.financingInterestPaid,
        'Juros Financiamento Acruados': cf.financingInterest,
        'Saque Financiamento (Drawdown)': cf.financingDrawdown,
        'Amortização Financiamento': cf.financingAmortization,
        'Saldo Financiamento': cf.financingBalance,
        'Saldo Permuta': cf.permutaBalance,
        'Fluxo de Caixa Equity': cf.equityCashFlow,
        'Top-up Acumulado (Juros)': cf.accumulatedOutOfPocketInterest
      });
    });
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Fluxo de Caixa');
  XLSX.writeFile(wb, 'Output_Fluxo_Caixa_IncorpRisk.xlsx');
}
