import React, { useState, useMemo } from 'react';
import { ProjectInput, SimulationParams, MacroInput } from '../types';
import { runSimulation } from '../lib/calculations';
import { formatCurrency, formatPercent } from '../lib/utils';
import { exportProjectCashFlowToExcel } from '../lib/exportExcel';
import { ArrowLeft, TrendingUp, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, BarChart, Bar } from 'recharts';

interface ProjectDetailProps {
  project: ProjectInput;
  macros: MacroInput[];
  baseDate: Date;
  onBack: () => void;
  onUpdateProject?: (project: ProjectInput) => void;
}

export function ProjectDetail({ project, macros, baseDate, onBack, onUpdateProject }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState<'dados' | 'premissas' | 'graficos' | 'tabela'>('premissas');
  const [sim, setSim] = useState<SimulationParams>({
    costOverrun: 0,
    delayMonths: 0,
    salesSpeedMultiplier: 1,
    discountStock: 0.1,
    brokerageFee: 0.06,
  });

  const data = useMemo(() => runSimulation(project, sim, macros, baseDate), [project, sim, macros, baseDate]);

  const chartData = data.cashFlow.map(cf => ({
    name: `Mês ${cf.month}`,
    Recebíveis: cf.receivables,
    'Custo Obra': -cf.constructionCost,
    'Juros Financiamento': -cf.financingInterest,
    'Pagamento Permuta': -cf.permutaPayment,
    'Fluxo Equity': cf.equityCashFlow,
    'Saldo Financiamento': cf.financingBalance,
    'Saldo Permuta': cf.permutaBalance,
  }));

  const curveData = [
    { name: 'Atual', 'Vendas': project.percVendas * 100, 'Obras': project.percObras * 100, 'Obras Esperado': data.metrics.expectedPercObras * 100 }
  ];

  const repasseData = data.cashFlow
    .filter(cf => cf.receivablesRepasse > 0)
    .map(cf => ({
      name: format(cf.date, 'MMM/yy', { locale: ptBR }).toLowerCase(),
      'Permuta': cf.permutaPayment,
      'Juros Financiamento': cf.financingInterestPaid,
      'Amortização Financiamento': cf.financingAmortization,
      'Equity': cf.equityCashFlow,
    }));

  const updateField = (field: keyof ProjectInput, value: any) => {
    if (onUpdateProject) {
      onUpdateProject({ ...project, [field]: value });
    }
  };

  const renderInput = (label: string, field: keyof ProjectInput, type: 'text' | 'number' | 'date' | 'percent', step?: string) => {
    let val: any = project[field];
    if (type === 'date') val = format(val, 'yyyy-MM-dd');
    if (type === 'percent') val = (val * 100).toFixed(2);

    const isCurrency = type === 'number' && label.includes('(R$)');

    return (
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
        <div className="relative">
          {isCurrency && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">R$</span>
            </div>
          )}
          <input 
            type={type === 'percent' ? 'number' : type}
            step={step}
            className={`w-full bg-slate-50 border border-slate-200 rounded-lg py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none
              ${isCurrency ? 'pl-9 pr-3' : 'px-3'}
              ${type === 'percent' ? 'pr-8 pl-3' : ''}
            `}
            value={val}
            onChange={(e) => {
              let newValue: any = e.target.value;
              if (type === 'number') newValue = Number(newValue) || 0;
              if (type === 'percent') newValue = (Number(newValue) || 0) / 100;
              if (type === 'date') { 
                const [y, m, d] = String(newValue).split('-');
                newValue = d ? new Date(Number(y), Number(m) - 1, Number(d)) : new Date();
                if (isNaN(newValue.getTime())) newValue = new Date(); 
              }
              updateField(field, newValue);
            }}
          />
          {type === 'percent' && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-slate-400 sm:text-sm">%</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar ao Dashboard
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{project.nome}</h1>
          <p className="text-slate-500 mt-1">{project.empresa} • Padrão {project.padrao}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportProjectCashFlowToExcel(data)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Exportar Modelo (Excel)
          </button>
          
          {data.metrics.statusCurvaOtima === 'OK' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" /> Curva Obras/Vendas OK
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <AlertCircle className="w-4 h-4" /> Atrasado na Curva
            </span>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('premissas')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'premissas' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Simulação de Riscos
          </button>
          <button
            onClick={() => setActiveTab('graficos')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'graficos' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Visão Gráfica
          </button>
          <button
            onClick={() => setActiveTab('tabela')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tabela' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Tabela de Fluxo de Caixa (Mensal)
          </button>
          <button
            onClick={() => setActiveTab('dados')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'dados' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            Dados do Projeto (Edição)
          </button>
        </nav>
      </div>

      {activeTab === 'dados' && (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Editar Dados Cadastrais e Financeiros</h2>
        <div className="space-y-8">
          
          <div>
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-4">Identificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {renderInput('Empresa', 'empresa', 'text')}
              {renderInput('Nome do Projeto', 'nome', 'text')}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Padrão</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={project.padrao}
                  onChange={(e) => updateField('padrao', e.target.value)}
                >
                  <option value="Médio">Médio</option>
                  <option value="Alto">Alto</option>
                </select>
              </div>
              {renderInput('Número de Unidades', 'numeroUnidades', 'number', '1')}
              {renderInput('Metragem Média (m²)', 'metragemMedia', 'number', '1')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-4">Cronograma</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderInput('Data de Lançamento', 'dataLancamento', 'date')}
              {renderInput('Data Início das Obras', 'dataInicioObras', 'date')}
              {renderInput('Estimativa de Entrega', 'dataEstimadaEntrega', 'date')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-4">Comercial</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {renderInput('VGV Total (R$)', 'vgvTotal', 'number', '1000')}
              {renderInput('% Vendas Atual', 'percVendas', 'percent', '0.01')}
              {renderInput('% Recebido no Sinal', 'vendasPercSinal', 'percent', '0.01')}
              {renderInput('% Pré-chaves', 'vendasPercPreChaves', 'percent', '0.01')}
              {renderInput('% Pós-chaves', 'vendasPercPosChaves', 'percent', '0.01')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-4">Engenharia e Caixa</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {renderInput('% de Obras Atual', 'percObras', 'percent', '0.01')}
              {renderInput('Custo Incorrido (R$)', 'custoIncorrido', 'number', '1000')}
              {renderInput('Custo a Incorrer (R$)', 'custoAIncorrer', 'number', '1000')}
              {renderInput('Posição de Caixa SPE (R$)', 'posicaoCaixa', 'number', '100')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-4">Estoque e Recebíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {renderInput('Estoque Atual (R$)', 'estoqueAtual', 'number', '1000')}
              {renderInput('Pré-chaves Recebido (R$)', 'preChavesRecebido', 'number', '100')}
              {renderInput('Pré-chaves a Receber (R$)', 'preChavesAReceberAtual', 'number', '100')}
              {renderInput('Pós-chaves a Receber (R$)', 'posChavesAReceberAtual', 'number', '100')}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-4">Financiamento à Construção</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {renderInput('Saldo Já Liberado (R$)', 'saldoFinanciamentoLiberado', 'number', '1000')}
              {renderInput('Financiamento Total Previsto (R$)', 'saldoFinanciamentoTotal', 'number', '1000')}
              {renderInput('% Financiado do Custo', 'finPercFinanciamento', 'percent', '0.01')}
              {renderInput('Taxa Anual Fin', 'finTaxaAnual', 'percent', '0.01')}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Indexador</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={project.finIndexador}
                  onChange={(e) => updateField('finIndexador', e.target.value)}
                >
                  <option value="CDI">CDI</option>
                  <option value="INCC">INCC</option>
                  <option value="IPCA">IPCA</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2 mb-4">Permuta</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {renderInput('Saldo Inicial Permuta (R$)', 'permutaSaldoInicio', 'number', '1000')}
              {renderInput('Taxa Anual Permuta', 'permutaTaxaAnual', 'percent', '0.01')}
              {renderInput('% dos Recebíveis (Permuta)', 'permutaPercRecebiveis', 'percent', '0.01')}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Indexador</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={project.permutaIndexador}
                  onChange={(e) => updateField('permutaIndexador', e.target.value)}
                >
                  <option value="INCC">INCC</option>
                  <option value="CDI">CDI</option>
                  <option value="IPCA">IPCA</option>
                </select>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      )}

      {activeTab === 'premissas' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Premissas Base do Projeto</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">VGV Total</p>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(project.vgvTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Estoque (Hoje)</p>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(project.estoqueAtual)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Caixa da SPE</p>
                <p className="text-sm font-semibold text-slate-900">{formatCurrency(project.posicaoCaixa)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Custo Restante Obras</p>
                <p className="text-sm font-semibold text-rose-600">{formatCurrency(project.custoAIncorrer)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Início das Obras</p>
                <p className="text-sm font-medium text-slate-700">{format(project.dataInicioObras, 'MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Entrega Estimada (Habite-se)</p>
                <p className="text-sm font-medium text-slate-700">{format(project.dataEstimadaEntrega, 'MM/yyyy')}</p>
              </div>
              <div className="col-span-2 md:col-span-3 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-slate-500 font-medium text-indigo-600 mb-1">Financiamento (% {formatPercent(project.finPercFinanciamento)})</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(project.saldoFinanciamentoTotal)} max.</p>
                  <p className="text-xs text-slate-500 mt-1">Taxa Efetiva: {formatPercent(project.finTaxaAnual)} a.a + {project.finIndexador}</p>
                  <p className="text-xs text-slate-500">Já Sacado: {formatCurrency(project.saldoFinanciamentoLiberado)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium text-fuchsia-600 mb-1">Permuta Fís/Fin.</p>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(project.permutaSaldoInicio)}</p>
                  <p className="text-xs text-slate-500 mt-1">Taxa: {formatPercent(project.permutaTaxaAnual)} a.a + {project.permutaIndexador}</p>
                  <p className="text-xs text-slate-500">Retenção de Pós-chaves: {formatPercent(project.permutaPercRecebiveis)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls & Metrics */}
        <div className="space-y-6 h-fit sticky top-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Métricas de Risco</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">NAV (Net Asset Value)</p>
                <p className={`text-2xl font-bold ${data.metrics.nav >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  {formatCurrency(data.metrics.nav)}
                </p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-sm text-slate-500">Top-up de juros incorporador</p>
                <p className="text-xl font-semibold text-slate-800">
                  {formatCurrency(data.metrics.totalOutOfPocketInterest)}
                </p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-sm text-slate-500">Índice de Cobertura Final</p>
                <p className="text-xl font-semibold text-slate-800">
                  {data.metrics.finalCoverageRatio.toFixed(2)}x
                </p>
              </div>
              <div className="h-px bg-slate-100" />
              <div>
                <p className="text-sm text-slate-500">Desconto Máx. antes de NAV Negativo</p>
                <p className="text-xl font-semibold text-slate-800">
                  {formatPercent(data.metrics.maxDiscountBeforeNegativeNav)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Simulação Específica</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">Sobrecusto de Obras</label>
                  <span className="text-sm text-slate-500">{formatPercent(sim.costOverrun)}</span>
                </div>
                <input 
                  type="range" min="0" max="0.5" step="0.01" 
                  value={sim.costOverrun}
                  onChange={(e) => setSim({...sim, costOverrun: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">Atraso de Obra</label>
                  <span className="text-sm text-slate-500">{sim.delayMonths} meses</span>
                </div>
                <input 
                  type="range" min="0" max="24" step="1" 
                  value={sim.delayMonths}
                  onChange={(e) => setSim({...sim, delayMonths: parseInt(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">Desconto Estoque Final</label>
                  <span className="text-sm text-slate-500">{formatPercent(sim.discountStock)}</span>
                </div>
                <input 
                  type="range" min="0" max="0.5" step="0.01" 
                  value={sim.discountStock}
                  onChange={(e) => setSim({...sim, discountStock: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium text-slate-700">Despesas Corretagem (Vendas)</label>
                  <span className="text-sm text-slate-500">{formatPercent(sim.brokerageFee)}</span>
                </div>
                <input 
                  type="range" min="0.04" max="0.08" step="0.005" 
                  value={sim.brokerageFee}
                  onChange={(e) => setSim({...sim, brokerageFee: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'graficos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Fluxo de Caixa Mensal Projetado</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRecebiveis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCusto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `R$ ${(val/1000000).toFixed(1)}M`} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="Recebíveis" stroke="#10b981" fillOpacity={1} fill="url(#colorRecebiveis)" />
                  <Area type="monotone" dataKey="Custo Obra" stroke="#ef4444" fillOpacity={1} fill="url(#colorCusto)" />
                  <Line type="monotone" dataKey="Fluxo Equity" stroke="#6366f1" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Evolução do Saldo Financiamento</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaldoFin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `R$ ${(val/1000000).toFixed(1)}M`} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="Saldo Financiamento" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSaldoFin)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Evolução do Saldo Permuta</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaldoPerm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d946ef" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(val) => `R$ ${(val/1000000).toFixed(1)}M`} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="Saldo Permuta" stroke="#d946ef" fillOpacity={1} fill="url(#colorSaldoPerm)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {repasseData.length > 0 && (
            <div className="col-span-1 lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 mb-2">Waterfall de Pagamentos no Repasse</h2>
              <p className="text-sm text-slate-500 mb-6">Distribuição do caixa gerado durante os meses de repasse</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={repasseData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(val) => `R$ ${(val/1000000).toFixed(1)}M`} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="Permuta" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Juros Financiamento" stackId="a" fill="#ef4444" />
                    <Bar dataKey="Amortização Financiamento" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Equity" stackId="a" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tabela' && (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Fluxo de Caixa Detalhado</h2>
        <div className="overflow-auto max-h-[70vh] rounded-lg border border-slate-200 bg-white shadow-inner">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="py-3 px-4 font-semibold text-slate-900 bg-slate-50 sticky left-0 z-40 w-64 border-b border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">Mês / Item</th>
                {data.cashFlow.map(cf => (
                  <th key={cf.month} className={`py-3 px-4 font-bold text-slate-700 min-w-[120px] text-right border-b border-slate-200 ${cf.isConstruction ? 'bg-slate-50' : 'bg-indigo-50'}`}>
                    {format(cf.date, 'MMM/yy', { locale: ptBR }).toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Vendas */}
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-20 shadow-[1px_0_0_0_#e2e8f0]">% Vendas inicial</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatPercent(cf.percVendasInicial)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10">Vendas do mês</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatPercent(cf.vendasMes)}</td>)}
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2 px-4 font-medium text-slate-900 sticky left-0 bg-slate-50/50 z-20 shadow-[1px_0_0_0_#e2e8f0]">% Vendas Final</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right font-medium ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatPercent(cf.percVendasFinal)}</td>)}
              </tr>
              
              {/* Obras */}
              <tr><td colSpan={data.cashFlow.length + 1} className="h-4 bg-white"></td></tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10">% Obras inicial</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatPercent(cf.percObrasInicial)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10">Obras do mês</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatPercent(cf.obrasMes)}</td>)}
              </tr>
              <tr className="bg-slate-50/50">
                <td className="py-2 px-4 font-medium text-slate-900 sticky left-0 bg-slate-50/50 z-20 shadow-[1px_0_0_0_#e2e8f0]">% Obra Final</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right font-medium ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatPercent(cf.percObrasFinal)}</td>)}
              </tr>

              {/* Estoque */}
              <tr><td colSpan={data.cashFlow.length + 1} className="h-4 bg-white"></td></tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10">Estoque Remanescente</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatPercent(cf.estoqueRemanescentePerc)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10">Estoque (em R$)</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.estoqueRemanescenteRs)}</td>)}
              </tr>

              {/* Início de Tabela de Fluxo de Caixa */}
              <tr><td colSpan={data.cashFlow.length + 1} className="h-6 bg-white"></td></tr>
              
              <tr className="border-b-2 border-slate-200">
                <td className="py-2 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10">Carteira de Recebíveis (Vendido)</td>
                <td colSpan={data.cashFlow.length} className="bg-white"></td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6 text-sm">Saldo a Receber - Pré-Chaves</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-slate-500 text-sm ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.saldoReceberPreChaves)}</td>)}
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6 text-sm">Saldo a Receber - Repasse</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-slate-500 text-sm ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.saldoReceberPosChaves)}</td>)}
              </tr>

              <tr><td colSpan={data.cashFlow.length + 1} className="h-6 bg-white"></td></tr>
              
              <tr className="bg-slate-100">
                <td className="py-2 px-4 font-bold text-slate-900 sticky left-0 bg-slate-100 z-20 shadow-[1px_0_0_0_#e2e8f0] border-t border-b border-slate-300">Caixa Inicial (Início do Mês)</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right font-bold border-t border-b border-slate-300 ${cf.isConstruction ? '' : 'bg-indigo-100/30'}`}>{formatCurrency(cf.caixaInicial)}</td>)}
              </tr>

              {/* Fluxo Operacional */}
              <tr><td colSpan={data.cashFlow.length + 1} className="h-2 bg-white"></td></tr>
              <tr className="border-b-2 border-slate-200">
                <td className="py-2 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10">I. Fluxo de Caixa Operacional</td>
                <td colSpan={data.cashFlow.length} className="bg-white"></td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Recebimentos Brutos (Vendas)</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.receivables)}</td>)}
              </tr>
              <tr>
                <td className="py-1 px-4 text-slate-400 sticky left-0 bg-white z-10 pl-10 text-xs">Pré-chaves</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-1 px-4 text-right text-xs text-slate-400 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.receivablesPreChaves)}</td>)}
              </tr>
              <tr>
                <td className="py-1 px-4 text-slate-400 sticky left-0 bg-white z-10 pl-10 text-xs">Repasse</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-1 px-4 text-right text-xs text-slate-400 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.receivablesRepasse)}</td>)}
              </tr>
              <tr>
                <td className="py-1 px-4 text-slate-400 sticky left-0 bg-white z-10 pl-10 text-xs">Venda de Estoque</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-1 px-4 text-right text-xs text-slate-400 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.receivablesEstoque)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Rendimentos sobre Caixa</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.rendimentoCaixa)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Imposto RET</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-rose-600 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(-cf.retPayment)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Despesas Corretagem (Vendas)</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-rose-600 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(-cf.brokeragePayment)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Custo de Obras</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-rose-600 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(-cf.constructionCost)}</td>)}
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2 px-4 font-semibold text-slate-900 sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_#e2e8f0] border-b border-slate-200">Resultado Operacional (A)</td>
                {data.cashFlow.map(cf => {
                   const resOp = cf.receivables + cf.rendimentoCaixa - cf.retPayment - cf.brokeragePayment - cf.constructionCost;
                   return <td key={cf.month} className={`py-2 px-4 text-right font-semibold border-b border-slate-200 ${cf.isConstruction ? '' : 'bg-indigo-50/50'} ${resOp >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(resOp)}</td>
                })}
              </tr>

              {/* Fluxo Financeiro e Permuta */}
              <tr><td colSpan={data.cashFlow.length + 1} className="h-4 bg-white"></td></tr>
              <tr className="border-b-2 border-slate-200">
                <td className="py-2 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10">II. Serviço das Dívidas e Transações</td>
                <td colSpan={data.cashFlow.length} className="bg-white"></td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Liberação Financiamento (Saque)</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-emerald-600 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.financingDrawdown)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Pagamento Juros do Financiamento</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-rose-600 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(-cf.financingInterestPaid)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Amortização Principal Financiamento</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-rose-600 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(-cf.financingAmortization)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Pagamento Permuta</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-rose-600 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(-cf.permutaPayment)}</td>)}
              </tr>
              <tr className="bg-slate-50">
                <td className="py-2 px-4 font-semibold text-slate-900 sticky left-0 bg-slate-50 z-10 border-b border-slate-200">Resultado Financeiro (B)</td>
                {data.cashFlow.map(cf => {
                  const resFin = cf.financingDrawdown - cf.financingInterestPaid - cf.financingAmortization - cf.permutaPayment;
                  return <td key={cf.month} className={`py-2 px-4 text-right font-semibold border-b border-slate-200 ${cf.isConstruction ? '' : 'bg-indigo-50/50'} ${resFin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(resFin)}</td>
                })}
              </tr>

              {/* Fluxo de Sócios */}
              <tr><td colSpan={data.cashFlow.length + 1} className="h-4 bg-white"></td></tr>
              <tr className="border-b-2 border-slate-200">
                <td className="py-2 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10">III. Fluxo de Capital (Sócios)</td>
                <td colSpan={data.cashFlow.length} className="bg-white"></td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-10 pl-6">Aporte (-) ou Distribuição Dív (-) (+)</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right font-semibold ${cf.equityCashFlow > 0 ? 'text-emerald-600' : cf.equityCashFlow < 0 ? 'text-rose-600' : 'text-slate-400'} ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.equityCashFlow)}</td>)}
              </tr>

              {/* Caixa Final */}
              <tr><td colSpan={data.cashFlow.length + 1} className="h-6 bg-white"></td></tr>
              <tr className="bg-indigo-100">
                <td className="py-3 px-4 font-bold text-indigo-900 sticky left-0 bg-indigo-100 z-20 shadow-[1px_0_0_0_#e2e8f0] border-t border-indigo-200">Saldo Final de Caixa (Mês)</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-3 px-4 text-right font-bold text-indigo-900 border-t border-indigo-200 ${cf.isConstruction ? '' : 'bg-indigo-200/50'}`}>{formatCurrency(cf.caixaAposFinanciamento)}</td>)}
              </tr>

              {/* Controle de Saldos Restantes */}
              <tr><td colSpan={data.cashFlow.length + 1} className="h-8 bg-white"></td></tr>
              <tr className="border-b-2 border-slate-200">
                <td className="py-2 px-4 font-bold text-slate-900 sticky left-0 bg-white z-20 shadow-[1px_0_0_0_#e2e8f0]">Controle de Endividamento</td>
                <td colSpan={data.cashFlow.length} className="bg-white"></td>
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-20 shadow-[1px_0_0_0_#e2e8f0]">Saldo Devedor Financiamento</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-slate-500 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.financingBalance)}</td>)}
              </tr>
              <tr>
                <td className="py-2 px-4 text-slate-600 sticky left-0 bg-white z-20 shadow-[1px_0_0_0_#e2e8f0]">Saldo Devedor Permuta</td>
                {data.cashFlow.map(cf => <td key={cf.month} className={`py-2 px-4 text-right text-slate-500 ${cf.isConstruction ? '' : 'bg-indigo-50/30'}`}>{formatCurrency(cf.permutaBalance)}</td>)}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
