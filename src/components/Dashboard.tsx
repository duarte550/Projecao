import React, { useState, useMemo } from 'react';
import { Download, Save } from 'lucide-react';
import { ProjectInput, SimulationParams, MacroInput } from '../types';
import { runSimulation, calculateOptimalCurve } from '../lib/calculations';
import { downloadCashFlows } from '../lib/exportGenerator';
import { exportMemoryCard } from '../lib/exportMemoryCard';
import { SimulationControls } from './dashboard/SimulationControls';
import { KPICards } from './dashboard/KPICards';
import { OptimalCurveChart } from './dashboard/OptimalCurveChart';
import { ProjectsTable } from './dashboard/ProjectsTable';
import { MacroTab } from './dashboard/MacroTab';
import { ConsolidatorTab } from './dashboard/ConsolidatorTab';

interface DashboardProps {
  projects: ProjectInput[];
  macros: MacroInput[];
  baseDate: Date;
  onSelectProject: (id: string) => void;
  onUpdateMacros?: (macros: MacroInput[]) => void;
  initialSim?: Partial<SimulationParams>;
}

type ActiveTab = 'portfolio' | 'macro' | 'consolidador';

export function Dashboard({ projects, macros, baseDate, onSelectProject, onUpdateMacros, initialSim }: DashboardProps) {
  const [activeTab, setActiveTab]     = useState<ActiveTab>('portfolio');
  const [navType, setNavType]         = useState<'nominal' | 'vpl'>('vpl');
  const [selectedEmpresa, setSelectedEmpresa] = useState('Todas');
  const [globalSim, setGlobalSim]     = useState<SimulationParams>({
    costOverrun:          initialSim?.costOverrun          ?? 0,
    delayMonths:          initialSim?.delayMonths          ?? 0,
    salesSpeedMultiplier: initialSim?.salesSpeedMultiplier ?? 1,
    discountStock:        initialSim?.discountStock        ?? 0.1,
    brokerageFee:         initialSim?.brokerageFee         ?? 0.06,
  });

  const projectDataList = useMemo(
    () => projects.map(p => runSimulation(p, globalSim, macros, baseDate)),
    [projects, globalSim, macros, baseDate],
  );

  const companies = useMemo(() => {
    const unique = new Set(projects.map(p => p.empresa));
    return ['Todas', ...Array.from(unique)];
  }, [projects]);

  const totalNav           = projectDataList.reduce((s, p) => s + p.metrics.nav, 0);
  const totalNavDiscounted = projectDataList.reduce((s, p) => s + p.metrics.navDiscounted, 0);
  const totalOutOfPocket   = projectDataList.reduce((s, p) => s + p.metrics.totalOutOfPocketInterest, 0);
  const projectsAtRisk     = projectDataList.filter(p => p.metrics.statusCurvaOtima === 'Atrasado' || p.metrics.nav < 0).length;

  const optimalCurveData = useMemo(
    () => Array.from({ length: 21 }, (_, i) => {
      const vendas = i * 5;
      return { vendas, obras: calculateOptimalCurve(vendas / 100) * 100, isCurve: true };
    }),
    [],
  );

  const projectPoints = useMemo(
    () => projectDataList.map(p => ({
      name:      p.input.nome,
      vendas:    p.input.percVendas * 100,
      obras:     p.input.percObras  * 100,
      status:    p.metrics.statusCurvaOtima,
      isProject: true,
    })),
    [projectDataList],
  );

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: 'portfolio',    label: 'Visão Portfólio'       },
    { key: 'macro',        label: 'Premissas Macro'        },
    { key: 'consolidador', label: 'Consolidador Empresa'   },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Projeções</h1>
          <p className="text-slate-500 mt-1">Visão geral da saúde financeira das incorporações</p>
        </div>
      </div>

      {/* Tab bar + actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 sticky top-16 z-20">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.key ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => exportMemoryCard(projects, macros, globalSim, baseDate)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm font-medium transition-colors">
            <Save className="w-4 h-4" />
            Salvar Memory Card (Input)
          </button>
          <button onClick={() => downloadCashFlows(projectDataList)} className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm text-slate-700">
            <Download className="w-4 h-4" />
            Exportar Série (CVM)
          </button>
        </div>
      </div>

      {/* Portfolio tab */}
      {activeTab === 'portfolio' && (
        <>
          <SimulationControls sim={globalSim} onChange={setGlobalSim} />
          <KPICards
            totalNav={totalNav}
            totalNavDiscounted={totalNavDiscounted}
            totalOutOfPocket={totalOutOfPocket}
            projectsAtRisk={projectsAtRisk}
            totalProjects={projects.length}
          />
          <OptimalCurveChart optimalCurveData={optimalCurveData} projectPoints={projectPoints} />
          <ProjectsTable
            projectDataList={projectDataList}
            onSelectProject={onSelectProject}
            selectedEmpresa={selectedEmpresa}
            setSelectedEmpresa={setSelectedEmpresa}
            companies={companies}
          />
        </>
      )}

      {/* Macro tab */}
      {activeTab === 'macro' && (
        <MacroTab macros={macros} onUpdateMacros={onUpdateMacros} />
      )}

      {/* Consolidador tab */}
      {activeTab === 'consolidador' && (
        <ConsolidatorTab
          projectDataList={projectDataList}
          projects={projects}
          navType={navType}
          setNavType={setNavType}
          selectedEmpresa={selectedEmpresa}
          setSelectedEmpresa={setSelectedEmpresa}
          companies={companies}
          globalSim={globalSim}
          macros={macros}
          baseDate={baseDate}
        />
      )}
    </div>
  );
}
