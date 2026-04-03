import React from 'react';
import { Building2, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface Props {
  totalNav: number;
  totalNavDiscounted: number;
  totalOutOfPocket: number;
  projectsAtRisk: number;
  totalProjects: number;
}

export function KPICards({ totalNav, totalNavDiscounted, totalOutOfPocket, projectsAtRisk, totalProjects }: Props) {
  return (
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
          <p className={`text-xs mt-1 ${totalNavDiscounted >= 0 ? 'text-slate-500' : 'text-red-500 font-medium'}`}>
            Descontado (VPL): {formatCurrency(totalNavDiscounted)}
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
          <p className="text-2xl font-bold text-slate-900">{projectsAtRisk} / {totalProjects}</p>
        </div>
      </div>
    </div>
  );
}
