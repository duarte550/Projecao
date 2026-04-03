import React, { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { ProjectInput, MacroInput, SimulationParams } from '../types';
import { UploadCloud, Download } from 'lucide-react';
import { downloadTemplate } from '../lib/templateGenerator';

interface FileUploadProps {
  onDataLoaded: (projects: ProjectInput[], macros: MacroInput[], baseDate: Date, parsedSim: Partial<SimulationParams>) => void;
}

export function FileUpload({ onDataLoaded }: FileUploadProps) {
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      
      const wsProjects = wb.Sheets['Projetos'] || wb.Sheets[wb.SheetNames[0]];
      const wsMacros = wb.Sheets['Macros'] || (wb.SheetNames.length > 1 ? wb.Sheets[wb.SheetNames[1]] : null);
      const wsPremissas = wb.Sheets['Premissas'] || (wb.SheetNames.length > 2 ? wb.Sheets[wb.SheetNames[2]] : null);
      
      let rawProjects = XLSX.utils.sheet_to_json(wsProjects) as any[];
      // Filtra a linha 2, que agora contém instruções (ex: "Texto", "R$", "DD/MM/AAAA")
      rawProjects = rawProjects.filter(r => r['Empresa'] !== 'Texto' && r['Nome do projeto'] !== 'Texto');

      const parseNum = (val: any, fallback = 0): number => {
        if (typeof val === 'number') return isNaN(val) ? fallback : val;
        if (typeof val === 'string') {
          // Remove tudo que não seja número, vírgula, ponto ou sinal de menos
          let clean = val.replace(/[^\d,\.-]/g, '');
          // Se tiver múltiplos pontos, pode ser divisor de milhar
          if (clean.includes(',') && clean.includes('.')) {
            clean = clean.replace(/\./g, '').replace(',', '.');
          } else if (clean.includes(',')) {
            // "0,5" -> "0.5"
            clean = clean.replace(',', '.');
          }
          const num = parseFloat(clean);
          return isNaN(num) ? fallback : num;
        }
        return fallback;
      };

      const optionalNum = (val: any): number | undefined => {
        if (val === undefined || val === null || val === '') return undefined;
        const num = parseNum(val, NaN);
        return isNaN(num) ? undefined : num;
      };

      const parseDate = (val: any): Date => {
        if (val instanceof Date && !isNaN(val.getTime())) return val;
        if (typeof val === 'number') {
          if (val > 1900 && val < 2200) {
            // Usuário digitou apenas o ano inteiro
            return new Date(val, 0, 1);
          }
          // Excel serial date formula
          const utc = Math.round((val - 25569) * 86400 * 1000);
          return new Date(utc + (new Date().getTimezoneOffset() * 60000));
        }
        if (typeof val === 'string') {
          // Tenta ler DD/MM/YYYY
          const parts = val.split('/');
          if (parts.length === 3) {
            let year = Number(parts[2]);
            if (year < 100) year += 2000;
            const date = new Date(year, Number(parts[1]) - 1, Number(parts[0]));
            if (!isNaN(date.getTime())) return date;
          }
          // Tenta ler YYYY-MM-DD ou outros formatos válidos String
          const dt = new Date(val);
          if (!isNaN(dt.getTime())) return dt;
        }
        return new Date();
      };
      
      const projects: ProjectInput[] = rawProjects.map((row, index) => {
        const nomeProjeto = row['Nome do projeto'] || `Projeto ${index + 1}`;

        return {
          id: String(index + 1),
          empresa: row['Empresa'] || 'Desconhecida',
          nome: nomeProjeto,
          padrao: row['Padrão'] === 'Alto' ? 'Alto' : 'Médio',
          dataLancamento: parseDate(row['Data de lançamento']),
          percVendas: parseNum(row['% vendas']),
          vgvTotal: parseNum(row['VGV Total']),
          percObras: parseNum(row['% de obras']),
          custoAIncorrer: parseNum(row['Custo a incorrer']),
          custoIncorrido: parseNum(row['Custo incorrido']),
          preChavesRecebido: parseNum(row['Pré-chaves recebido']),
          preChavesAReceberAtual: parseNum(row['Pré-chaves a receber atual']),
          posChavesAReceberAtual: parseNum(row['Pós-chaves a receber atual']),
          estoqueAtual: parseNum(row['Estoque Atual']),
          numeroUnidades: parseNum(row['Numero de unidades']),
          metragemMedia: parseNum(row['Metragem média das unidades']),
          posicaoCaixa: parseNum(row['Posição de Caixa da SPE']),
          saldoFinanciamentoLiberado: parseNum(row['Saldo do Financiamento atual liberado'] || row['Saldo do financiamento atual liberado']),
          saldoFinanciamentoTotal: parseNum(row['Saldo do financiamento total']),
          dataEstimadaEntrega: parseDate(row['Data estimada de entrega']),
          dataInicioObras: parseDate(row['Data de início das obras'] || row['Data de inicio das obras'] || row['Data de lançamento']),
          
          finTaxaAnual: parseNum(row['Taxa anual (Fin)'] || row['Financiamento - Taxa anual'], 0.12),
          finIndexador: row['Indexador (Fin)'] || row['Financiamento - Indexador'] || 'CDI',
          finPercFinanciamento: parseNum(row['% de financiamento do projeto'] || row['Financiamento - % do projeto'], 0.7),
          
          permutaTaxaAnual: parseNum(row['Taxa Anual (Permuta)'] || row['Permuta - Taxa Anual']),
          permutaIndexador: row['Indexador (Permuta)'] || row['Permuta - Indexador'] || 'INCC',
          permutaSaldoInicio: parseNum(row['Saldo no inicio (Permuta)'] || row['Permuta - Saldo inicio']),
          permutaPercRecebiveis: parseNum(row['% de permuta dos recebíveis'] || row['Permuta - % recebíveis']),

          vendasPercSinal: parseNum(row['% recebido de sinal'] || row['% de sinal']),
          vendasPercPreChaves: parseNum(row['% pré-chaves']),
          vendasPercPosChaves: parseNum(row['% pós-chaves']),

          salesProjectionMode: (row['Modo Projeção Vendas (linear/target/historical)'] || row['Modo Projeção Vendas'] || 'linear') as 'linear' | 'target' | 'historical',
          targetPercVendasObra: parseNum(row['Alvo % Vendas Fim Obra'], 0.8),
          histVendasMensal: parseNum(row['Média Histórica Vendas Mensal'], 0.05),

          customSim: {
            costOverrun: optionalNum(row['Override Sim - Sobrecusto']),
            delayMonths: optionalNum(row['Override Sim - Atraso']),
            discountStock: optionalNum(row['Override Sim - Desconto']),
          },
          sensMatrix1_Discount: optionalNum(row['Matriz Sens 1 - Desconto']),
          sensMatrix2_Cost: optionalNum(row['Matriz Sens 2 - Sobrecusto']),
          sensMatrix3_Delay: optionalNum(row['Matriz Sens 3 - Atraso']),
        };
      });

      // Parse Macros if available
      let macros: MacroInput[] = [];
      if (wsMacros) {
        let rawMacros = XLSX.utils.sheet_to_json(wsMacros) as any[];
        // Filtra a linha 2, que contém instruções
        rawMacros = rawMacros.filter(r => r['Mês/Ano'] !== 'DD/MM/AAAA');
        macros = rawMacros.map(row => ({
          mesAno: parseDate(row['Mês/Ano']),
          incc: parseNum(row['INCC']),
          cdi: parseNum(row['CDI']),
          ipca: parseNum(row['IPCA']),
          tr: parseNum(row['TR']),
        }));
      }

      let baseDate = new Date();
      let parsedSim: Partial<SimulationParams> = {};

      if (wsPremissas) {
        const rawPremissas = XLSX.utils.sheet_to_json(wsPremissas) as any[];
        
        const dbRow = rawPremissas.find(r => r['Parâmetro'] === 'Data Base da Projeção' || r['Parâmetro'] === 'Data Base');
        if (dbRow && dbRow['Valor']) {
          baseDate = parseDate(dbRow['Valor']);
        } else if (macros.length > 0) {
          baseDate = macros[0].mesAno;
        }

        const discRow = rawPremissas.find(r => r['Parâmetro'] === 'Desconto Estoque Pronto');
        if (discRow && discRow['Valor'] !== undefined) parsedSim.discountStock = parseNum(discRow['Valor']);

        const speedRow = rawPremissas.find(r => r['Parâmetro'] === 'Velocidade de Vendas (Multiplicador)');
        if (speedRow && speedRow['Valor'] !== undefined) parsedSim.salesSpeedMultiplier = parseNum(speedRow['Valor']);

        const brokRow = rawPremissas.find(r => r['Parâmetro'] === 'Corretagem');
        if (brokRow && brokRow['Valor'] !== undefined) parsedSim.brokerageFee = parseNum(brokRow['Valor']);

      } else if (macros.length > 0) {
        baseDate = macros[0].mesAno;
      }

      onDataLoaded(projects, macros, baseDate, parsedSim);
    };
    reader.readAsBinaryString(file);
  }, [onDataLoaded]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-12">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Importar Dados dos Projetos</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          Faça o upload da planilha contendo a aba de projetos e a aba de variáveis macroeconômicas.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <label className="relative inline-flex items-center justify-center px-8 py-3.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition-colors shadow-sm hover:shadow-md">
            <span>Selecionar Arquivo Excel</span>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
          </label>

          <button 
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Baixar Template
          </button>
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100 text-left">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Formato esperado das Abas (Tudo agrupado):</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">Aba 1: Projetos</h4>
              <ul className="text-xs text-slate-500 grid grid-cols-2 gap-2">
                <li>• Empresa</li>
                <li>• Nome do projeto</li>
                <li>• Padrão</li>
                <li>• Numero de unidades</li>
                <li>• Metragem média das unidades</li>
                <li>• Data de lançamento</li>
                <li>• Data de início das obras</li>
                <li>• Data estimada de entrega</li>
                <li>• VGV Total</li>
                <li>• % vendas</li>
                <li>• % recebido de sinal</li>
                <li>• % pré-chaves</li>
                <li>• % pós-chaves</li>
                <li>• % de obras</li>
                <li>• Custo incorrido</li>
                <li>• Custo a incorrer</li>
                <li>• Modo Projeção Vendas (linear/target/historical)</li>
                <li>• Alvo % Vendas Fim Obra</li>
                <li>• Média Histórica Vendas Mensal</li>
                <li>• Estoque Atual</li>
                <li>• Pré-chaves recebido</li>
                <li>• Pré-chaves a receber atual</li>
                <li>• Pós-chaves a receber atual</li>
                <li>• Posição de Caixa da SPE</li>
                <li>• Saldo do Financiamento atual liberado</li>
                <li>• Saldo do financiamento total</li>
                <li>• Taxa anual (Fin)</li>
                <li>• Indexador (Fin)</li>
                <li>• % de financiamento do projeto</li>
                <li>• Saldo no inicio (Permuta)</li>
                <li>• Taxa Anual (Permuta)</li>
                <li>• Indexador (Permuta)</li>
                <li>• % de permuta dos recebíveis</li>
                <li>• Override Sim - Sobrecusto (Adicional)</li>
                <li>• Override Sim - Atraso (Adicional)</li>
                <li>• Override Sim - Desconto (Adicional)</li>
                <li>• Matriz Sens 1 - Desconto (Adicional)</li>
                <li>• Matriz Sens 2 - Sobrecusto (Adicional)</li>
                <li>• Matriz Sens 3 - Atraso (Adicional)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">Aba 2: Macros</h4>
              <ul className="text-xs text-slate-500 grid grid-cols-2 gap-2">
                <li>• Mês/Ano</li>
                <li>• INCC</li>
                <li>• CDI</li>
                <li>• IPCA</li>
                <li>• TR</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">Aba 3: Premissas</h4>
              <ul className="text-xs text-slate-500 grid grid-cols-2 gap-2">
                <li>• Parâmetro (Ex: Data Base da Projeção)</li>
                <li>• Valor (Ex: 01/05/2026)</li>
                <li>• Desconto Estoque Pronto</li>
                <li>• Velocidade de Vendas (Multiplicador)</li>
                <li>• Corretagem</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
