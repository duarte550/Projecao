import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { ProjectData, ProjectInput, MacroInput, SimulationParams } from '../../types';
import { runSimulation } from '../../lib/calculations';
import { formatCurrency, formatCurrencyMillions, formatPercent } from '../../lib/utils';

// ─── helpers ─────────────────────────────────────────────────────────────────

function getHeatClass(nav: number, companyVGV: number): string {
  if (nav < 0) return nav < -companyVGV * 0.05 ? 'bg-red-100 text-red-900' : 'bg-red-50 text-red-700';
  return nav > companyVGV * 0.05 ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-50 text-emerald-700';
}

// ─── HeatMapMatrix ────────────────────────────────────────────────────────────

interface HeatMapMatrixProps {
  title: string;
  description: string;
  rowAxisLabel: string;
  colAxisLabel: string;
  colHeaders: { key: string; label: string }[];
  rows: { label: string; cells: { key: string; nav: number }[] }[];
  thirdVar: { label: string; display: string; value: number; min: number; max: number; step: number };
  onThirdVarChange: (v: number) => void;
  companyVGV: number;
  navType: 'nominal' | 'vpl';
}

function HeatMapMatrix({
  title, description, rowAxisLabel, colAxisLabel,
  colHeaders, rows, thirdVar, onThirdVarChange, companyVGV,
}: HeatMapMatrixProps) {
  return (
    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="min-w-[200px] bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700">{thirdVar.label}</label>
            <span className="text-xs text-slate-500 font-medium">{thirdVar.display}</span>
          </div>
          <input
            type="range" min={thirdVar.min} max={thirdVar.max} step={thirdVar.step}
            value={thirdVar.value}
            onChange={(e) => onThirdVarChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 h-1.5"
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-center text-sm font-medium whitespace-nowrap">
          <thead className="bg-slate-800 text-slate-100 border-b border-slate-800">
            <tr>
              <th className="px-4 py-4 border-r border-slate-700 bg-slate-900 w-40 text-left pl-6">
                <span className="block text-slate-400 text-xs uppercase tracking-wider mb-1 mt-1">{rowAxisLabel}</span>
                <span className="block text-slate-300">{colAxisLabel}</span>
              </th>
              {colHeaders.map(col => (
                <th key={col.key} className="px-4 py-4 text-center font-semibold text-slate-200">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b last:border-b-0 border-slate-200">
                <td className="px-4 py-4 border-r border-slate-200 bg-white text-slate-800 font-bold shadow-[1px_0_0_0_#e2e8f0] text-left pl-6">
                  {row.label}
                </td>
                {row.cells.map(cell => {
                  const bgClass = getHeatClass(cell.nav, companyVGV);
                  return (
                    <td key={cell.key} className={`px-4 py-4 hover:brightness-95 transition-colors ${bgClass}`}>
                      <span className={cell.nav < 0 ? 'font-bold' : ''}>{formatCurrencyMillions(cell.nav)}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SensitivityCharts ────────────────────────────────────────────────────────

interface SensitivityChartsProps {
  delayData: { val: string; nav: number }[];
  costData:  { val: string; nav: number }[];
  discountData: { val: string; nav: number }[];
  navType: 'nominal' | 'vpl';
}

function SensitivityCharts({ delayData, costData, discountData, navType }: SensitivityChartsProps) {
  const navLabel = navType === 'vpl' ? 'VPL Global' : 'NAV Global';
  const zeroLabel = navType === 'vpl' ? 'VPL Zero' : 'NAV Zero';

  const chartProps = {
    margin: { top: 20, right: 10, left: -20, bottom: 20 },
  };

  const commonAxisProps = {
    yTickFormatter: (val: number) => `R$ ${(val / 1_000_000).toFixed(0)}M`,
    tooltip: (v: number) => formatCurrency(v),
  };

  const renderChart = (
    data: { val: string; nav: number }[],
    color: string,
    labelPrefix: string,
  ) => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} {...chartProps}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <ReferenceLine
          y={0} stroke="#dc2626" strokeWidth={2} strokeDasharray="4 4"
          label={{ position: 'insideTopLeft', value: zeroLabel, fill: '#dc2626', fontSize: 12, fontWeight: 'bold' }}
        />
        <XAxis dataKey="val" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis tickFormatter={commonAxisProps.yTickFormatter} tick={{ fontSize: 12, fill: '#64748b' }} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} labelFormatter={(l) => `${labelPrefix}: ${l}`} />
        <Line
          type="monotone" dataKey="nav" stroke={color} strokeWidth={3}
          dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
          name={navLabel}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const charts = [
    { title: 'Atraso de Obra (Global)', data: delayData, color: '#f59e0b', prefix: 'Atraso' },
    { title: 'Sobrecusto Aplicado (Global)', data: costData, color: '#ef4444', prefix: 'Sobrecusto' },
    { title: 'Desconto Comercial (Global)', data: discountData, color: '#3b82f6', prefix: 'Desconto' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      {charts.map(chart => (
        <div key={chart.title} className="bg-slate-50 p-4 rounded-xl border border-slate-200 h-[300px] flex flex-col">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">{chart.title}</h3>
          <div className="flex-1 min-h-0">
            {renderChart(chart.data, chart.color, chart.prefix)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── AportesTable ─────────────────────────────────────────────────────────────

interface YearTableProps {
  title: string;
  allYears: number[];
  projEmpresa: ProjectData[];
  projectYearValues: Record<string, Record<number, number>>;
  yearTotals: Record<number, number>;
  isPositive: boolean; // true = dividendos, false = aportes
}

function YearTable({ title, allYears, projEmpresa, projectYearValues, yearTotals, isPositive }: YearTableProps) {
  const colorClass = isPositive ? 'text-emerald-600' : 'text-rose-600';
  const totalColorClass = isPositive ? 'text-emerald-700' : 'text-rose-700';
  const totalBgClass = isPositive ? 'bg-emerald-50' : 'bg-rose-50';
  const totalBorderClass = isPositive ? 'border-emerald-200' : 'border-rose-200';
  const totalHeaderClass = isPositive ? 'text-emerald-700 bg-emerald-50/50' : 'text-rose-700 bg-rose-50/50';
  const stickyTotalBg = isPositive ? 'bg-emerald-50' : 'bg-rose-50';
  const stickyTotalShadow = isPositive ? 'shadow-[1px_0_0_0_#34d399]' : 'shadow-[1px_0_0_0_#fda4af]';
  const lastColBg = isPositive ? 'bg-emerald-50/30 bg-emerald-100/50' : 'bg-rose-50/30 bg-rose-100/50';

  if (allYears.length === 0) {
    return (
      <div>
        <h3 className="text-md font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">{title}</h3>
        <p className="text-sm text-slate-500 italic">
          {isPositive ? 'Nenhum dividendo projetado para esta empresa.' : 'Nenhum aporte projetado para esta empresa.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-md font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">{title}</h3>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 shadow-[1px_0_0_0_#e2e8f0] w-64 min-w-[16rem]">Projeto</th>
              {allYears.map(y => <th key={y} className="px-4 py-3 text-right w-32 min-w-[8rem]">{y}</th>)}
              <th className={`px-4 py-3 text-right border-l border-slate-200 w-40 min-w-[10rem] ${totalHeaderClass}`}>Total Acumulado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {projEmpresa.map(p => {
              const projValues = projectYearValues[p.input.id] || {};
              const hasValue = isPositive
                ? Object.values(projValues).some(v => v > 0)
                : Object.values(projValues).some(v => v < 0);
              if (!hasValue) return null;

              const projTotal = allYears.reduce((sum, y) => sum + (projValues[y] || 0), 0);
              return (
                <tr key={p.input.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white shadow-[1px_0_0_0_#e2e8f0] truncate max-w-[200px]" title={p.input.nome}>
                    {p.input.nome}
                  </td>
                  {allYears.map(y => {
                    const val = projValues[y] || 0;
                    const show = isPositive ? val > 0 : val < 0;
                    return (
                      <td key={y} className={`px-4 py-3 text-right w-32 min-w-[8rem] ${show ? `${colorClass} font-medium` : 'text-slate-400'}`}>
                        {show ? formatCurrencyMillions(val) : '-'}
                      </td>
                    );
                  })}
                  <td className={`px-4 py-3 text-right ${totalColorClass} font-bold border-l border-slate-200 ${isPositive ? 'bg-emerald-50/30' : 'bg-rose-50/30'}`}>
                    {formatCurrencyMillions(projTotal)}
                  </td>
                </tr>
              );
            })}
            <tr className={`${totalBgClass} border-t ${totalBorderClass}`}>
              <td className={`px-4 py-3 font-bold text-slate-900 sticky left-0 ${stickyTotalBg} ${stickyTotalShadow}`}>Somatório da Empresa</td>
              {allYears.map(y => {
                const val = yearTotals[y] || 0;
                const show = isPositive ? val > 0 : val < 0;
                return (
                  <td key={y} className={`px-4 py-3 text-right font-bold ${totalColorClass} w-32 min-w-[8rem]`}>
                    {show ? formatCurrencyMillions(val) : '-'}
                  </td>
                );
              })}
              <td className={`px-4 py-3 text-right font-bold ${isPositive ? 'text-emerald-800' : 'text-rose-800'} border-l ${totalBorderClass} ${isPositive ? 'bg-emerald-100/50' : 'bg-rose-100/50'} w-40 min-w-[10rem]`}>
                {formatCurrencyMillions(allYears.reduce((s, y) => s + (yearTotals[y] || 0), 0))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ConsolidatorTab (main) ───────────────────────────────────────────────────

interface Props {
  projectDataList: ProjectData[];
  projects: ProjectInput[];
  navType: 'nominal' | 'vpl';
  setNavType: (v: 'nominal' | 'vpl') => void;
  selectedEmpresa: string;
  setSelectedEmpresa: (v: string) => void;
  companies: string[];
  globalSim: SimulationParams;
  macros: MacroInput[];
  baseDate: Date;
}

export function ConsolidatorTab({
  projectDataList, projects, navType, setNavType,
  selectedEmpresa, setSelectedEmpresa, companies,
  globalSim, macros, baseDate,
}: Props) {
  const [matrix1Discount, setMatrix1Discount] = useState<number | null>(null);
  const [matrix2Cost,     setMatrix2Cost]     = useState<number | null>(null);
  const [matrix3Delay,    setMatrix3Delay]    = useState<number | null>(null);

  // ─── Sensitivity data ───────────────────────────────────────────────────────

  const sensitivityData = useMemo(() => {
    if (selectedEmpresa === 'Todas') return null;
    const projEmpresa = projects.filter(p => p.empresa === selectedEmpresa);
    if (projEmpresa.length === 0) return null;

    const heatDelays    = [0, 3, 6, 9, 12, 18, 24];
    const heatCosts     = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30];
    const heatDiscounts = [0, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30];

    const sumNavs = (overrides: Partial<SimulationParams>) =>
      projEmpresa.reduce((sum, p) => {
        const res = runSimulation(p, { ...globalSim, ...overrides }, macros, baseDate);
        return sum + (navType === 'vpl' ? res.metrics.navDiscounted : res.metrics.nav);
      }, 0);

    const m1 = matrix1Discount ?? globalSim.discountStock;
    const m2 = matrix2Cost     ?? globalSim.costOverrun;
    const m3 = matrix3Delay    ?? globalSim.delayMonths;

    const delayData    = Array.from({ length: 9 },  (_, i) => i * 3).map(d => ({ val: `${d}m`, nav: sumNavs({ delayMonths: d }) }));
    const costData     = Array.from({ length: 11 }, (_, i) => parseFloat((i * 0.05).toFixed(2))).map(c => ({ val: `${(c * 100).toFixed(0)}%`, nav: sumNavs({ costOverrun: c }) }));
    const discountData = Array.from({ length: 11 }, (_, i) => parseFloat((i * 0.05).toFixed(2))).map(d => ({ val: `${(d * 100).toFixed(0)}%`, nav: sumNavs({ discountStock: d }) }));

    const matrix1Rows = heatCosts.map(c => ({
      label: `${(c * 100).toFixed(0)}%`,
      cells: heatDelays.map(d => ({ key: `d${d}`, nav: sumNavs({ costOverrun: c, delayMonths: d, discountStock: m1 }) })),
    }));

    const matrix2Rows = heatDiscounts.map(disc => ({
      label: `${(disc * 100).toFixed(0)}%`,
      cells: heatDelays.map(d => ({ key: `d${d}`, nav: sumNavs({ discountStock: disc, delayMonths: d, costOverrun: m2 }) })),
    }));

    const matrix3Rows = heatDiscounts.map(disc => ({
      label: `${(disc * 100).toFixed(0)}%`,
      cells: heatCosts.map(c => ({ key: `c${c}`, nav: sumNavs({ discountStock: disc, costOverrun: c, delayMonths: m3 }) })),
    }));

    return {
      delayData, costData, discountData,
      heatDelays, heatCosts, heatDiscounts,
      matrix1Rows, matrix2Rows, matrix3Rows,
      companyVGV: projEmpresa.reduce((sum, p) => sum + p.vgvTotal, 0),
      m1, m2, m3,
    };
  }, [projects, selectedEmpresa, globalSim, macros, baseDate, matrix1Discount, matrix2Cost, matrix3Delay, navType]);

  // ─── Year-based cash flow tables ────────────────────────────────────────────

  const projEmpresa = projectDataList.filter(p => p.input.empresa === selectedEmpresa);

  const { yearAportes, yearDividendos, projectYearAportes, projectYearDividendos, allYears } = useMemo(() => {
    const yA: Record<number, number> = {};
    const yD: Record<number, number> = {};
    const pA: Record<string, Record<number, number>> = {};
    const pD: Record<string, Record<number, number>> = {};

    projEmpresa.forEach(p => {
      pA[p.input.id] = {};
      pD[p.input.id] = {};

      p.cashFlow.forEach(cf => {
        const year = cf.date.getFullYear();
        const val  = navType === 'vpl' ? cf.discountedEquityCashFlow : cf.equityCashFlow;

        if (val < 0) {
          yA[year]               = (yA[year] || 0) + val;
          pA[p.input.id][year]   = (pA[p.input.id][year] || 0) + val;
        } else if (val > 0) {
          yD[year]               = (yD[year] || 0) + val;
          pD[p.input.id][year]   = (pD[p.input.id][year] || 0) + val;
        }
      });
    });

    const years = Array.from(new Set([...Object.keys(yA), ...Object.keys(yD)].map(Number))).sort((a, b) => a - b);
    return { yearAportes: yA, yearDividendos: yD, projectYearAportes: pA, projectYearDividendos: pD, allYears: years };
  }, [projEmpresa, navType]);

  const navLabel = navType === 'vpl' ? 'Descontado' : 'Nominal';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Consolidador por Empresa</h2>
          <p className="text-sm text-slate-500">Visualização de aportes e análise de sensibilidade.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setNavType('vpl')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${navType === 'vpl' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              VPL Descontado
            </button>
            <button
              onClick={() => setNavType('nominal')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${navType === 'nominal' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              NAV Nominal
            </button>
          </div>
          <div className="flex items-center">
            <label className="text-sm font-medium text-slate-700 mr-2 whitespace-nowrap">Comparar:</label>
            <select
              value={selectedEmpresa} onChange={(e) => setSelectedEmpresa(e.target.value)}
              className="pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {companies.map(emp => <option key={emp} value={emp}>{emp}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedEmpresa === 'Todas' ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
          Selecione uma empresa específica no filtro acima para visualizar a consolidação de aportes.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Aportes */}
          <YearTable
            title="Valores Faltantes de Aporte Opex/Capex por Projeto e Ano (R$)"
            allYears={allYears}
            projEmpresa={projEmpresa}
            projectYearValues={projectYearAportes}
            yearTotals={yearAportes}
            isPositive={false}
          />

          {/* Dividendos */}
          <YearTable
            title="Distribuição de Dividendos/Caixa por Projeto e Ano (R$)"
            allYears={allYears}
            projEmpresa={projEmpresa}
            projectYearValues={projectYearDividendos}
            yearTotals={yearDividendos}
            isPositive={true}
          />

          {/* NAV Composition */}
          <div>
            <h3 className="text-md font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">Composição do NAV (R$)</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                  <tr>
                    <th className="px-4 py-3">Projeto</th>
                    <th className="px-4 py-3 text-right">Geração de Caixa</th>
                    <th className="px-4 py-3 text-right border-l border-slate-200">NAV {navLabel}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {projEmpresa.map(p => {
                    const nav = navType === 'vpl' ? p.metrics.navDiscounted : p.metrics.nav;
                    const geração = p.cashFlow
                      .filter(cf => (navType === 'vpl' ? cf.discountedEquityCashFlow : cf.equityCashFlow) > 0)
                      .reduce((s, cf) => s + (navType === 'vpl' ? cf.discountedEquityCashFlow : cf.equityCashFlow), 0);
                    return (
                      <tr key={p.input.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{p.input.nome}</td>
                        <td className="px-4 py-3 text-right text-emerald-600">{formatCurrencyMillions(geração)}</td>
                        <td className={`px-4 py-3 text-right font-bold border-l border-slate-200 ${nav >= 0 ? 'text-emerald-700 bg-emerald-50/30' : 'text-rose-700 bg-rose-50/30'}`}>
                          {formatCurrencyMillions(nav)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900 text-right">Somatório (Consolidado)</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {formatCurrencyMillions(
                        projEmpresa.reduce((sum, p) =>
                          sum + p.cashFlow
                            .filter(cf => (navType === 'vpl' ? cf.discountedEquityCashFlow : cf.equityCashFlow) > 0)
                            .reduce((s, cf) => s + (navType === 'vpl' ? cf.discountedEquityCashFlow : cf.equityCashFlow), 0),
                          0,
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 border-l border-slate-200 bg-slate-100">
                      {formatCurrencyMillions(projEmpresa.reduce((sum, p) => sum + (navType === 'vpl' ? p.metrics.navDiscounted : p.metrics.nav), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Sensitivity analysis */}
          {sensitivityData && (
            <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800">Sensibilidade Consolidada (Global NAV)</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Soma do reflexo do NAV de TODOS os projetos da {selectedEmpresa} sob estresse agregado.
                </p>
              </div>
              <div className="p-6">
                <SensitivityCharts
                  delayData={sensitivityData.delayData}
                  costData={sensitivityData.costData}
                  discountData={sensitivityData.discountData}
                  navType={navType}
                />

                <div className="space-y-6">
                  <HeatMapMatrix
                    title={`Matriz 1: Sobrecusto x Atraso de Obra (${navType === 'vpl' ? 'VPL' : 'NAV'} Global)`}
                    description={`Impactos cruzados sobre o ${navType === 'vpl' ? 'VPL' : 'NAV'} consolidado do portfólio.`}
                    rowAxisLabel="Sobrecusto↓"
                    colAxisLabel="Atraso Obra →"
                    colHeaders={sensitivityData.heatDelays.map(d => ({ key: String(d), label: `${d} Meses` }))}
                    rows={sensitivityData.matrix1Rows}
                    thirdVar={{ label: 'Desconto Estoque (3ª Variável)', display: formatPercent(sensitivityData.m1), value: sensitivityData.m1, min: 0, max: 0.5, step: 0.01 }}
                    onThirdVarChange={(v) => setMatrix1Discount(v)}
                    companyVGV={sensitivityData.companyVGV}
                    navType={navType}
                  />

                  <HeatMapMatrix
                    title={`Matriz 2: Desconto Comercial x Atraso de Obra (${navType === 'vpl' ? 'VPL' : 'NAV'} Global)`}
                    description={`Consolidado de impacto comercial vs cronograma sobre o ${navType === 'vpl' ? 'VPL' : 'NAV'}.`}
                    rowAxisLabel="Desconto↓"
                    colAxisLabel="Atraso Obra →"
                    colHeaders={sensitivityData.heatDelays.map(d => ({ key: String(d), label: `${d} Meses` }))}
                    rows={sensitivityData.matrix2Rows}
                    thirdVar={{ label: 'Sobrecusto (3ª Variável)', display: formatPercent(sensitivityData.m2), value: sensitivityData.m2, min: 0, max: 0.5, step: 0.01 }}
                    onThirdVarChange={(v) => setMatrix2Cost(v)}
                    companyVGV={sensitivityData.companyVGV}
                    navType={navType}
                  />

                  <HeatMapMatrix
                    title={`Matriz 3: Desconto Comercial x Sobrecusto Aplicado (${navType === 'vpl' ? 'VPL' : 'NAV'} Global)`}
                    description={`Impacto simultâneo de erro orçamentário e dificuldade comercial no ${navType === 'vpl' ? 'VPL' : 'NAV'}.`}
                    rowAxisLabel="Desconto↓"
                    colAxisLabel="Sobrecusto →"
                    colHeaders={sensitivityData.heatCosts.map(c => ({ key: String(c), label: `${(c * 100).toFixed(0)}%` }))}
                    rows={sensitivityData.matrix3Rows}
                    thirdVar={{ label: 'Atraso Obra (3ª Variável)', display: `${sensitivityData.m3} meses`, value: sensitivityData.m3, min: 0, max: 24, step: 1 }}
                    onThirdVarChange={(v) => setMatrix3Delay(v)}
                    companyVGV={sensitivityData.companyVGV}
                    navType={navType}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
