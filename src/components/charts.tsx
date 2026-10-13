"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function InvestmentChart({ points }: { points: { label: string; amount: number; cumulative: number }[] }) {
  if (!points.length) return <p className="text-sm text-stone-500">Genere períodos para ver la curva de inversión.</p>;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={points}>
          <CartesianGrid stroke="#e6dccb" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="amount" name="Periodo" fill="#9a3412" />
          <Line dataKey="cumulative" name="Acumulado" stroke="#1c1917" strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompareChart({ points }: { points: { name: string; total: number }[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={points}>
          <CartesianGrid stroke="#e6dccb" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} height={70} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="total" name="Total" fill="#9a3412" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GanttChart({
  tasks,
  scale,
}: {
  tasks: { name: string; start: string; end: string }[];
  scale: string;
}) {
  if (!tasks.length) return <p className="text-sm text-stone-500">No hay rubros en el cronograma.</p>;
  const starts = tasks.map((task) => new Date(`${task.start}T12:00:00Z`).getTime());
  const ends = tasks.map((task) => new Date(`${task.end}T12:00:00Z`).getTime());
  const min = Math.min(...starts);
  const max = Math.max(...ends, min + 86400000);
  const day = 86400000;
  const width = scale === "dia" ? 26 : scale === "semana" ? 14 : scale === "mes" ? 5 : scale === "trimestre" ? 2.4 : 1;
  const totalDays = Math.max(1, Math.round((max - min) / day) + 1);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-max space-y-2">
        {tasks.map((task) => {
          const left = Math.round((new Date(`${task.start}T12:00:00Z`).getTime() - min) / day);
          const span = Math.max(1, Math.round((new Date(`${task.end}T12:00:00Z`).getTime() - new Date(`${task.start}T12:00:00Z`).getTime()) / day) + 1);
          return (
            <div key={task.name + task.start} className="grid grid-cols-[14rem_1fr] items-center gap-3 text-sm">
              <span className="truncate">{task.name}</span>
              <div className="relative h-7" style={{ width: totalDays * width }}>
                <div className="absolute top-1 h-5 rounded bg-orange-800" style={{ left: left * width, width: span * width }} title={`${task.start} → ${task.end}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
