import React, { useState, useMemo } from 'react';
import { ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Search, Filter, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ProjectData } from '../../types';
import { formatCurrencyMillions, formatPercent } from '../../lib/utils';

export type SortKey =
  | 'nome' | 'empresa' | 'status' | 'nav' | 'navDiscounted' | 'topup'
  | 'recursosFinalizar' | 'percGap' | 'icFin' | 'icFinEst' | 'icTotal'
  | 'icTotalEst' | 'terminoObras';

type SortConfig = { key: SortKey; direction: 'asc' | 'desc' } | null;

interface ThProps {
  children: React.ReactNode;
  sortKey: SortKey;
  align?: 'left' | 'right' | 'center';
  title?: string;
  sortConfig: SortConfig;
  onSort: (key: SortKey) => void;
}

function Th({ children, sortKey, align = 'left', title, sortConfig, onSort }: ThProps) {
  const isSorted = sortConfig?.key === sortKey;
  return (
    <th
      className={`px-6 py-4 cursor-pointer hover:bg-slate-300 transition-colors select-none text-${align}`}
      title={title}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        {children}
        {isSorted ? (
          sortConfig.direction === 'asc'
            ? <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
            : <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-slate-400" />
        )}
      </div>
    </th>
  );
}

function getSortValue(data: ProjectData, key: SortKey): any {
  switch (key) {
    case 'nome': return data.input.nome;
    case 'empresa': return data.input.empresa;
    case 'status': return data.metrics.statusCurvaOtima;
    case 'nav': return data.metrics.nav;
    case 'navDiscounted': return data.metrics.navDiscounted;
    case 'topup': return data.metrics.totalOutOfPocketInterest;
    case 'recursosFinalizar': return data.metrics.resourcesToFinishWorks;
    case 'percGap': return data.metrics.percVendasParaGap;
    case 'icFin': return data.metrics.icFinanciamento;
    case 'icFinEst': return data.metrics.icFinanciamentoEstoque;
    case 'icTotal': return data.metrics.icTotal;
    case 'icTotalEst': return data.metrics.icTotalEstoque;
    case 'terminoObras': return data.cashFlow.filter(c => c.isConstruction).pop()?.date.getTime() || 0;
    default: return 0;
  }
}

interface Props {
  projectDataList: ProjectData[];
  onSelectProject: (id: string) => void;
  selectedEmpresa: string;
  setSelectedEmpresa: (v: string) => void;
  companies: string[];
}

export function ProjectsTable({ projectDataList, onSelectProject, selectedEmpresa, setSelectedEmpresa, companies }: Props) {
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const requestSort = (key: SortKey) => {
    const direction: 'asc' | 'desc' = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const sortedProjects = useMemo(() => {
    const filtered = projectDataList.filter(p => {
      const matchSearch = p.input.nome.toLowerCase().includes(searchQuery.toLowerCase());
      const matchEmpresa = selectedEmpresa === 'Todas' || p.input.empresa === selectedEmpresa;
      return matchSearch && matchEmpresa;
    });

    if (!sortConfig) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = getSortValue(a, sortConfig.key);
      const bVal = getSortValue(b, sortConfig.key);
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projectDataList, sortConfig, searchQuery, selectedEmpresa]);

  const thProps = { sortConfig, onSort: requestSort };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-100 p-4 rounded-xl shadow-sm border border-slate-300 mt-6">
        <h2 className="text-lg font-semibold text-slate-800">Carteira de Projetos ({sortedProjects.length})</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Buscar projeto..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-400 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedEmpresa} onChange={(e) => setSelectedEmpresa(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-400 rounded-lg text-sm w-full sm:w-48 appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-white"
            >
              {companies.map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-100 rounded-xl shadow-sm border border-slate-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap group">
            <thead className="bg-slate-200 border-b border-slate-300 text-slate-600 font-medium">
              <tr>
                <Th sortKey="nome" {...thProps}>Projeto</Th>
                <Th sortKey="empresa" {...thProps}>Empresa</Th>
                <Th sortKey="terminoObras" align="center" {...thProps}>Fim das Obras</Th>
                <Th sortKey="status" align="center" {...thProps}>Status</Th>
                <Th sortKey="nav" align="right" {...thProps}>NAV (Nominal)</Th>
                <Th sortKey="navDiscounted" align="right" {...thProps}>NAV (VPL)</Th>
                <Th sortKey="recursosFinalizar" align="right" title="Caixa + Pré-chaves a Receber + Saldo a Liberar - Custo a Incorrer - Juros Est." {...thProps}>Recursos (Obras)</Th>
                <Th sortKey="percGap" align="right" title="% de Vendas necessário para cobrir o Gap de Obras" {...thProps}>% Vendas p/ Gap</Th>
                <Th sortKey="topup" align="right" {...thProps}>Top-up Juros Inc.</Th>
                <Th sortKey="icFin" align="right" title="Pós-chaves / Saldo Financiamento" {...thProps}>IC Fin.</Th>
                <Th sortKey="icFinEst" align="right" title="(Pós-chaves + 50% Estoque) / Saldo Financiamento" {...thProps}>IC Fin. + Est.</Th>
                <Th sortKey="icTotal" align="right" title="Pós-chaves / (Financiamento + Permuta)" {...thProps}>IC Total</Th>
                <Th sortKey="icTotalEst" align="right" title="(Pós-chaves + 50% Estoque) / (Financiamento + Permuta)" {...thProps}>IC Total + Est.</Th>
                <th className="px-6 py-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedProjects.map((data) => {
                const termObrasDate = data.cashFlow.filter(c => c.isConstruction).pop()?.date;
                const terminoStr = termObrasDate ? format(termObrasDate, 'MM/yyyy') : '-';
                return (
                  <tr
                    key={data.input.id}
                    className={`transition-colors ${data.metrics.nav < 0 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-200'}`}
                  >
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
                    <td className={`px-6 py-4 text-right font-medium ${data.metrics.navDiscounted >= 0 ? 'text-slate-600' : 'text-red-500'}`}>
                      {formatCurrencyMillions(data.metrics.navDiscounted)}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${data.metrics.resourcesToFinishWorks >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatCurrencyMillions(data.metrics.resourcesToFinishWorks)}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${data.metrics.percVendasParaGap > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {data.metrics.percVendasParaGap > 0 ? formatPercent(data.metrics.percVendasParaGap) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{formatCurrencyMillions(data.metrics.totalOutOfPocketInterest)}</td>
                    <td className="px-6 py-4 text-right text-slate-600">{data.metrics.icFinanciamento.toFixed(2)}x</td>
                    <td className="px-6 py-4 text-right text-slate-600">{data.metrics.icFinanciamentoEstoque.toFixed(2)}x</td>
                    <td className="px-6 py-4 text-right text-slate-600">{data.metrics.icTotal.toFixed(2)}x</td>
                    <td className="px-6 py-4 text-right text-slate-600">{data.metrics.icTotalEstoque.toFixed(2)}x</td>
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
  );
}
