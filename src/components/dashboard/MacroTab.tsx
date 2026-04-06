import React from 'react';
import { format } from 'date-fns';
import { MacroInput, SimulationParams } from '../../types';

const MACRO_FIELDS: { key: keyof MacroInput; label: string }[] = [
  { key: 'incc', label: 'INCC (%)' },
  { key: 'cdi',  label: 'CDI (%)'  },
  { key: 'ipca', label: 'IPCA (%)' },
  { key: 'tr',   label: 'TR (%)'   },
];

interface Props {
  macros: MacroInput[];
  onUpdateMacros?: (macros: MacroInput[]) => void;
  sim?: SimulationParams;
  onChangeSim?: (sim: SimulationParams) => void;
}

export function MacroTab({ macros, onUpdateMacros, sim, onChangeSim }: Props) {
  const updateField = (idx: number, field: keyof MacroInput, raw: string) => {
    const val = parseFloat(raw);
    if (isNaN(val) || !onUpdateMacros) return;
    const next = [...macros];
    next[idx] = { ...next[idx], [field]: val };
    onUpdateMacros(next);
  };

  const updateSimField = (field: keyof SimulationParams, val: number) => {
    if (sim && onChangeSim) {
      onChangeSim({ ...sim, [field]: val });
    }
  };

  return (
    <div className="space-y-6">
      {sim && onChangeSim && (
        <div className="bg-slate-100 rounded-xl shadow-sm border border-slate-300 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="p-6 border-b border-slate-300">
            <h2 className="text-lg font-semibold text-slate-800">Parâmetros Globais de Negócio</h2>
            <p className="text-sm text-slate-500 mt-1">
              Ajuste custos mensais de carrego por m² e travas macro de projeção comercial.
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 bg-white">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Padrão Baixo (R$/m²)</label>
              <input
                type="number"
                value={sim.carregoBaixo}
                onChange={(e) => updateSimField('carregoBaixo', Number(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Padrão Médio (R$/m²)</label>
              <input
                type="number"
                value={sim.carregoMedio}
                onChange={(e) => updateSimField('carregoMedio', Number(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Padrão Alto (R$/m²)</label>
              <input
                type="number"
                value={sim.carregoAlto}
                onChange={(e) => updateSimField('carregoAlto', Number(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cap de Vendas Mensal (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={sim.capVendasMensal !== undefined && sim.capVendasMensal !== null ? Number((sim.capVendasMensal * 100).toFixed(2)) : ''}
                onChange={(e) => updateSimField('capVendasMensal', e.target.value !== '' ? Number(e.target.value) / 100 : undefined)}
                placeholder="Ex: 10 (para 10%)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-100 rounded-xl shadow-sm border border-slate-300 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="p-6 border-b border-slate-300">
          <h2 className="text-lg font-semibold text-slate-800">Projeções Macroeconômicas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Os valores abaixo foram carregados da planilha de Input, mas você pode ajustá-los em tempo real aqui.
            O Dashboard reagirá instantaneamente a qualquer mudança nessa curva. Tabela interativa.
            Exportar o Memory Card salvará estes novos valores na próxima aba "Macros".
          </p>
        </div>
      <div className="overflow-x-auto max-h-[600px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-200 border-b border-slate-300 text-slate-600 font-medium sticky top-0 z-10 shadow-[0_1px_0_0_#cbd5e1]">
            <tr>
              <th className="px-6 py-4">Mês/Ano</th>
              {MACRO_FIELDS.map(f => (
                <th key={String(f.key)} className="px-6 py-4 text-right">{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {macros.map((m, idx) => (
              <tr key={idx} className="hover:bg-slate-200 transition-colors">
                <td className="px-6 py-3 text-slate-900 font-medium">{format(m.mesAno, 'MM/yyyy')}</td>
                {MACRO_FIELDS.map(f => (
                  <td key={String(f.key)} className="px-6 py-3 text-right">
                    <input
                      type="number" step="0.001"
                      value={(m[f.key] as number | undefined) ?? 0}
                      onChange={(e) => updateField(idx, f.key, e.target.value)}
                      className="w-24 text-right bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
