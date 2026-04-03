import React, { useState, useMemo } from 'react';
import { ProjectInput, SimulationParams, ProjectData, MacroInput } from '../types';
import { runSimulation, calculateOptimalCurve } from '../lib/calculations';
import { formatCurrency, formatPercent, formatCurrencyMillions } from '../lib/utils';
import { Building2, AlertTriangle, CheckCircle2, TrendingDown, ArrowRight, Download, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, Save } from 'lucide-react';
import { downloadCashFlows } from '../lib/exportGenerator';
import { exportMemoryCard } from '../lib/exportMemoryCard';
import { format } from 'date-fns';
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  projects: ProjectInput[];
  macros: MacroInput[];
  baseDate: Date;
  onSelectProject: (id: string) => void;
  onUpdateMacros?: (macros: MacroInput[]) => void;
  initialSim?: Partial<SimulationParams>;
}

export type SortKey = 'nome' | 'empresa' | 'status' | 'nav' | 'topup' | 'recursosFinalizar' | 'icFin' | 'icFinEst' | 'icTotal' | 'icTotalEst' | 'terminoObras';

export function Dashboard({ projects, macros, baseDate, onSelectProject, onUpdateMacros, initialSim }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'macro'>('portfolio');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [globalSim, setGlobalSim] = useState<SimulationParams>({
    costOverrun: initialSim?.costOverrun ?? 0,
    delayMonths: initialSim?.delayMonths ?? 0,
    salesSpeedMultiplier: initialSim?.salesSpeedMultiplier ?? 1,
    discountStock: initialSim?.discountStock ?? 0.1,
    brokerageFee: initialSim?.brokerageFee ?? 0.06,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpresa, setSelectedEmpresa] = useState('Todas');

  const projectDataList = useMemo(() => {
    return projects.map(p => runSimulation(p, globalSim, macros, baseDate));
  }, [projects, globalSim, macros, baseDate]);

  const totalNav = projectDataList.reduce((sum, p) => sum + p.metrics.nav, 0);
  const totalOutOfPocket = projectDataList.reduce((sum, p) => sum + p.metrics.totalOutOfPocketInterest, 0);
  const projectsAtRisk = projectDataList.filter(p => p.metrics.statusCurvaOtima === 'Atrasado' || p.metrics.nav < 0).length;

  const companies = useMemo(() => {
    const list = new Set(projects.map(p => p.empresa));
    return ['Todas', ...Array.from(list)];
  }, [projects]);

  const sortedProjects = useMemo(() => {
    let sortable = projectDataList.filter(p => {
      const matchSearch = p.input.nome.toLowerCase().includes(searchQuery.toLowerCase());
      const matchEmpresa = selectedEmpresa === 'Todas' || p.input.empresa === selectedEmpresa;
      return matchSearch && matchEmpresa;
    });

    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let aVal: any = 0;
        let bVal: any = 0;
        
        switch (sortConfig.key) {
          case 'nome': aVal = a.input.nome; bVal = b.input.nome; break;
          case 'empresa': aVal = a.input.empresa; bVal = b.input.empresa; break;
          case 'status': aVal = a.metrics.statusCurvaOtima; bVal = b.metrics.statusCurvaOtima; break;
          case 'nav': aVal = a.metrics.nav; bVal = b.metrics.nav; break;
          case 'topup': aVal = a.metrics.totalOutOfPocketInterest; bVal = b.metrics.totalOutOfPocketInterest; break;
          case 'recursosFinalizar': aVal = a.metrics.resourcesToFinishWorks; bVal = b.metrics.resourcesToFinishWorks; break;
          case 'icFin': aVal = a.metrics.icFinanciamento; bVal = b.metrics.icFinanciamento; break;
          case 'icFinEst': aVal = a.metrics.icFinanciamentoEstoque; bVal = b.metrics.icFinanciamentoEstoque; break;
          case 'icTotal': aVal = a.metrics.icTotal; bVal = b.metrics.icTotal; break;
          case 'icTotalEst': aVal = a.metrics.icTotalEstoque; bVal = b.metrics.icTotalEstoque; break;
          case 'terminoObras': 
            aVal = a.cashFlow.filter(c => c.isConstruction).pop()?.date.getTime() || 0;
            bVal = b.cashFlow.filter(c => c.isConstruction).pop()?.date.getTime() || 0;
            break;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [projectDataList, sortConfig, searchQuery, selectedEmpresa]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const Th = ({ children, sortKey, align = 'left', title }: { children: React.ReactNode, sortKey: SortKey, align?: 'left'|'right'|'center', title?: string }) => {
    const isSorted = sortConfig?.key === sortKey;
    return (
      <th 
        className={`px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none text-${align}`} 
        title={title} 
        onClick={() => requestSort(sortKey)}
      >
        <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
          {children}
          {isSorted ? (
            sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" /> : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-400" />
          )}
        </div>
      </th>
    );
  };

  const optimalCurveData = useMemo(() => {
    return Array.from({ length: 21 }, (_, i) => {
      const vendas = i * 5; // 0, 5, 10, ..., 100
      const obras = calculateOptimalCurve(vendas / 100) * 100;
      return { vendas, obras, isCurve: true };
    });
  }, []);

  const projectPoints = useMemo(() => {
    return projectDataList.map(p => ({
      name: p.input.nome,
      vendas: p.input.percVendas * 100,
      obras: p.input.percObras * 100,
      status: p.metrics.statusCurvaOtima,
      isProject: true
    }));
  }, [projectDataList]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Projeções</h1>
          <p className="text-slate-500 mt-1">Visão geral da saúde financeira das incorporações</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 sticky top-16 z-20">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'portfolio' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Visão Portfólio
          </button>
          <button
            onClick={() => setActiveTab('macro')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'macro' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Premissas Macro
          </button>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportMemoryCard(projects, macros, globalSim, baseDate)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-medium transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar Memory Card (Input)
          </button>
          <button 
            onClick={() => downloadCashFlows(projectDataList)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm text-slate-700"
          >
            <Download className="w-4 h-4" />
            Exportar Série (CVM)
          </button>
        </div>
      </div>

      {activeTab === 'portfolio' && (
      <>
      {/* Global Simulation Controls */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Simulação Global (Estresse)</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Sobrecusto de Obras: {formatPercent(globalSim.costOverrun)}
            </label>
            <input 
              type="range" min="0" max="0.5" step="0.01" 
              value={globalSim.costOverrun}
              onChange={(e) => setGlobalSim({...globalSim, costOverrun: parseFloat(e.target.value)})}
              className="w-full accent-indigo-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Atraso (Meses): {globalSim.delayMonths}
            </label>
            <input 
              type="range" min="0" max="24" step="1" 
              value={globalSim.delayMonths}
              onChange={(e) => setGlobalSim({...globalSim, delayMonths: parseInt(e.target.value)})}
              className="w-full accent-indigo-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Desconto Estoque Final: {formatPercent(globalSim.discountStock)}
            </label>
            <input 
              type="range" min="0" max="0.5" step="0.01" 
              value={globalSim.discountStock}
              onChange={(e) => setGlobalSim({...globalSim, discountStock: parseFloat(e.target.value)})}
              className="w-full accent-indigo-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Corretagem (Vendas): {formatPercent(globalSim.brokerageFee)}
            </label>
            <input 
              type="range" min="0.04" max="0.08" step="0.005" 
              value={globalSim.brokerageFee}
              onChange={(e) => setGlobalSim({...globalSim, brokerageFee: parseFloat(e.target.value)})}
              className="w-full accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">NAV Total Projetado</p>
            <p className={`text-2xl font-bold ${totalNav >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
              {formatCurrency(totalNav)}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Top-up de juros incorporador</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalOutOfPocket)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Projetos em Risco</p>
            <p className="text-2xl font-bold text-slate-900">{projectsAtRisk} / {projects.length}</p>
          </div>
        </div>
      </div>

      {/* Curva Ótima Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-6">Status dos Projetos vs. Curva Ótima</h2>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                dataKey="vendas" 
                name="% Vendas" 
                domain={[0, 100]} 
                allowDataOverflow={true}
                tickFormatter={(v) => `${v}%`} 
                label={{ value: '% Vendas', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="obras" 
                name="% Obras" 
                domain={[0, 100]} 
                allowDataOverflow={true}
                tickFormatter={(v) => `${v}%`} 
                label={{ value: '% Obras', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                shared={false}
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    if (data.isProject) {
                      const expectedObras = calculateOptimalCurve((data.vendas || 0) / 100) * 100;
                      return (
                        <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-lg" style={{ zIndex: 100 }}>
                          <p className="font-medium text-slate-900 mb-1">{data.name}</p>
                          <p className="text-sm text-slate-600">% Vendas (x): {data.vendas?.toFixed(1)}%</p>
                          <p className="text-sm text-slate-600">% Obras (y): {data.obras?.toFixed(1)}%</p>
                          <p className="text-sm text-slate-600 mt-1 pt-1 border-t border-slate-100">
                            Curva Ótima Esperada: {expectedObras.toFixed(1)}%
                          </p>
                        </div>
                      );
                    }
                    if (data.isCurve) {
                      return (
                        <div className="bg-white p-3 border border-slate-200 shadow-sm rounded-lg" style={{ zIndex: 100 }}>
                          <p className="font-medium text-slate-900 mb-1">Curva Ótima</p>
                          <p className="text-sm text-slate-600">% Vendas: {data.vendas?.toFixed(1)}%</p>
                          <p className="text-sm text-slate-600">% Obras Esperado: {data.obras?.toFixed(1)}%</p>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line 
                data={optimalCurveData}
                type="monotone" 
                dataKey="obras" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                dot={false} 
                name="Curva Ótima" 
                isAnimationActive={false}
              />
              <Scatter 
                data={projectPoints.filter(p => p.status === 'OK')}
                name="No Prazo" 
                fill="#10b981"
              />
              <Scatter 
                data={projectPoints.filter(p => p.status === 'Atrasado')}
                name="Atrasado" 
                fill="#ef4444"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projects Table */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-6">
        <h2 className="text-lg font-semibold text-slate-800">Carteira de Projetos ({sortedProjects.length})</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar projeto..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedEmpresa}
              onChange={(e) => setSelectedEmpresa(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-48 appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
            >
              {companies.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap group">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <Th sortKey="nome">Projeto</Th>
                <Th sortKey="empresa">Empresa</Th>
                <Th sortKey="terminoObras" align="center">Fim das Obras</Th>
                <Th sortKey="status" align="center">Status</Th>
                <Th sortKey="nav" align="right">NAV</Th>
                <Th sortKey="recursosFinalizar" align="right" title="Caixa + Pré-chaves a Receber + Saldo a Liberar - Custo a Incorrer - Juros Est.">Recursos (Obras)</Th>
                <Th sortKey="topup" align="right">Top-up Juros Inc.</Th>
                <Th sortKey="icFin" align="right" title="Pós-chaves / Saldo Financiamento">IC Fin.</Th>
                <Th sortKey="icFinEst" align="right" title="(Pós-chaves + 50% Estoque) / Saldo Financiamento">IC Fin. + Est.</Th>
                <Th sortKey="icTotal" align="right" title="Pós-chaves / (Financiamento + Permuta)">IC Total</Th>
                <Th sortKey="icTotalEst" align="right" title="(Pós-chaves + 50% Estoque) / (Financiamento + Permuta)">IC Total + Est.</Th>
                <th className="px-6 py-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedProjects.map((data) => {
                const termObrasDate = data.cashFlow.filter(c => c.isConstruction).pop()?.date;
                const terminoStr = termObrasDate ? format(termObrasDate, 'MM/yyyy') : '-';
                return (
                  <tr key={data.input.id} className={`transition-colors ${data.metrics.nav < 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <button 
                        onClick={() => onSelectProject(data.input.id)}
                        className="text-left font-semibold text-indigo-700 hover:text-indigo-900 hover:underline transition-colors"
                        title="Abrir detalhes do projeto"
                      >
                        {data.input.nome}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{data.input.empresa}</td>
                    <td className="px-6 py-4 text-center text-slate-600 font-medium">{terminoStr}</td>
                    <td className="px-6 py-4 text-center">
                      {data.metrics.statusCurvaOtima === 'OK' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700">
                          <AlertTriangle className="w-3.5 h-3.5" /> Atrasado
                        </span>
                      )}
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${data.metrics.nav >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                      {formatCurrencyMillions(data.metrics.nav)}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${data.metrics.resourcesToFinishWorks >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrencyMillions(data.metrics.resourcesToFinishWorks)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {formatCurrencyMillions(data.metrics.totalOutOfPocketInterest)}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {data.metrics.icFinanciamento.toFixed(2)}x
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {data.metrics.icFinanciamentoEstoque.toFixed(2)}x
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {data.metrics.icTotal.toFixed(2)}x
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {data.metrics.icTotalEstoque.toFixed(2)}x
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => onSelectProject(data.input.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 whitespace-nowrap shadow-sm"
                      >
                        Detalhes <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {activeTab === 'macro' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Projeções Macroeconômicas</h2>
            <p className="text-sm text-slate-500 mt-1">
              Os valores abaixo foram carregados da planilha de Input, mas você pode ajustá-los em tempo real aqui. O Dashboard reagirá instantaneamente a qualquer mudança nessa curva. Tabela interativa. Exportar o Memory Card salvará estes novos valores na próxima aba "Macros".
            </p>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <th className="px-6 py-4">Mês/Ano</th>
                  <th className="px-6 py-4 text-right">INCC (%)</th>
                  <th className="px-6 py-4 text-right">CDI (%)</th>
                  <th className="px-6 py-4 text-right">IPCA (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {macros.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-slate-900 font-medium">{format(m.mesAno, 'MM/yyyy')}</td>
                    <td className="px-6 py-3 text-right">
                      <input 
                        type="number" step="0.001"
                        value={m.incc}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val)) return;
                          if (onUpdateMacros) {
                            const newMacros = [...macros];
                            newMacros[idx] = { ...newMacros[idx], incc: val };
                            onUpdateMacros(newMacros);
                          }
                        }}
                        className="w-24 text-right bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input 
                        type="number" step="0.001"
                        value={m.cdi}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val)) return;
                          if (onUpdateMacros) {
                            const newMacros = [...macros];
                            newMacros[idx] = { ...newMacros[idx], cdi: val };
                            onUpdateMacros(newMacros);
                          }
                        }}
                        className="w-24 text-right bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <input 
                        type="number" step="0.001"
                        value={m.ipca}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (isNaN(val)) return;
                          if (onUpdateMacros) {
                            const newMacros = [...macros];
                            newMacros[idx] = { ...newMacros[idx], ipca: val };
                            onUpdateMacros(newMacros);
                          }
                        }}
                        className="w-24 text-right bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
