import React from 'react';
import { SimulationParams } from '../../types';
import { formatPercent } from '../../lib/utils';

interface Props {
  sim: SimulationParams;
  onChange: (sim: SimulationParams) => void;
}

export function SimulationControls({ sim, onChange }: Props) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Simulação Global (Estresse)</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Sobrecusto de Obras: {formatPercent(sim.costOverrun)}
          </label>
          <input
            type="range" min="0" max="0.5" step="0.01"
            value={sim.costOverrun}
            onChange={(e) => onChange({ ...sim, costOverrun: parseFloat(e.target.value) })}
            className="w-full accent-indigo-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Atraso (Meses): {sim.delayMonths}
          </label>
          <input
            type="range" min="0" max="24" step="1"
            value={sim.delayMonths}
            onChange={(e) => onChange({ ...sim, delayMonths: parseInt(e.target.value) })}
            className="w-full accent-indigo-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Desconto Estoque Final: {formatPercent(sim.discountStock)}
          </label>
          <input
            type="range" min="0" max="0.5" step="0.01"
            value={sim.discountStock}
            onChange={(e) => onChange({ ...sim, discountStock: parseFloat(e.target.value) })}
            className="w-full accent-indigo-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Corretagem (Vendas): {formatPercent(sim.brokerageFee)}
          </label>
          <input
            type="range" min="0.04" max="0.08" step="0.005"
            value={sim.brokerageFee}
            onChange={(e) => onChange({ ...sim, brokerageFee: parseFloat(e.target.value) })}
            className="w-full accent-indigo-600"
          />
        </div>
      </div>
    </div>
  );
}
