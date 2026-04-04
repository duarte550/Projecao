import React from 'react';
import {
  ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { calculateOptimalCurve } from '../../lib/calculations';

interface CurvePoint {
  vendas: number;
  obras: number;
  isCurve: boolean;
}

interface ProjectPoint {
  name: string;
  vendas: number;
  obras: number;
  status: 'OK' | 'Atrasado';
  isProject: boolean;
}

interface Props {
  optimalCurveData: CurvePoint[];
  projectPoints: ProjectPoint[];
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
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

  return null;
}

export function OptimalCurveChart({ optimalCurveData, projectPoints }: Props) {
  return (
    <div className="bg-slate-100 p-6 rounded-xl shadow-sm border border-slate-300">
      <h2 className="text-lg font-semibold text-slate-800 mb-6">Status dos Projetos vs. Curva Ótima</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number" dataKey="vendas" name="% Vendas"
              domain={[0, 100]} allowDataOverflow={true}
              tickFormatter={(v) => `${v}%`}
              label={{ value: '% Vendas', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number" dataKey="obras" name="% Obras"
              domain={[0, 100]} allowDataOverflow={true}
              tickFormatter={(v) => `${v}%`}
              label={{ value: '% Obras', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip shared={false} cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Line
              data={optimalCurveData} type="monotone" dataKey="obras"
              stroke="#94a3b8" strokeWidth={2} dot={false}
              name="Curva Ótima" isAnimationActive={false}
            />
            <Scatter data={projectPoints.filter(p => p.status === 'OK')} name="No Prazo" fill="#10b981" />
            <Scatter data={projectPoints.filter(p => p.status === 'Atrasado')} name="Atrasado" fill="#ef4444" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
