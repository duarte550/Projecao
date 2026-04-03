import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { ProjectDetail } from './components/ProjectDetail';
import { ProjectInput, MacroInput, SimulationParams } from './types';
import { dummyProjects } from './lib/dummyData';
import { LayoutDashboard, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [projects, setProjects] = useState<ProjectInput[]>(dummyProjects); // Start with dummy data for preview
  const [macros, setMacros] = useState<MacroInput[]>([]);
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [initialSim, setInitialSim] = useState<Partial<SimulationParams>>({});
  const [view, setView] = useState<'dashboard' | 'upload'>('dashboard');

  const handleDataLoaded = (loadedProjects: ProjectInput[], loadedMacros: MacroInput[], loadedBaseDate: Date, parsedSim: Partial<SimulationParams>) => {
    setProjects(loadedProjects);
    setMacros(loadedMacros);
    setBaseDate(loadedBaseDate);
    setInitialSim(parsedSim);
    setView('dashboard');
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[95%] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">IncorpRisk</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setView('dashboard'); setSelectedProjectId(null); }}
                className={`text-sm font-medium transition-colors ${view === 'dashboard' && !selectedProjectId ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => { setView('upload'); setSelectedProjectId(null); }}
                className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${view === 'upload' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Importar Dados
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[95%] 2xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'upload' && (
          <FileUpload onDataLoaded={handleDataLoaded} />
        )}
        
        {view === 'dashboard' && !selectedProjectId && (
          <Dashboard 
            projects={projects} 
            macros={macros} 
            baseDate={baseDate} 
            initialSim={initialSim}
            onSelectProject={setSelectedProjectId} 
            onUpdateMacros={setMacros} 
          />
        )}

        {view === 'dashboard' && selectedProjectId && selectedProject && (
          <ProjectDetail 
            project={selectedProject} 
            macros={macros} 
            baseDate={baseDate} 
            onBack={() => setSelectedProjectId(null)} 
            onUpdateProject={(updated) => {
              setProjects(projects.map(p => p.id === updated.id ? updated : p));
            }}
          />
        )}
      </main>
    </div>
  );
}
