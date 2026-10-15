"use client";

import { useEffect, useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ChartColors = { grid: string; bar: string; line: string; tick: string; card: string; foreground: string };

const fallback: ChartColors = {
  grid: "#d0c6b8",
  bar: "#7a4e36",
  line: "#2c2824",
  tick: "#5c564e",
  card: "#f3eee6",
  foreground: "#2c2824",
};

function readColors(): ChartColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, or: string) => styles.getPropertyValue(name).trim() || or;
  return {
    grid: read("--border", fallback.grid),
    bar: read("--primary", fallback.bar),
    line: read("--foreground", fallback.line),
    tick: read("--muted-foreground", fallback.tick),
    card: read("--card", fallback.card),
    foreground: read("--foreground", fallback.foreground),
  };
}

function useChartColors() {
  const [colors, setColors] = useState<ChartColors>(fallback);
  useEffect(() => {
    const update = () => setColors(readColors());
    update();
    document.addEventListener("cimenta-theme", update);
    return () => document.removeEventListener("cimenta-theme", update);
  }, []);
  return colors;
}

export function InvestmentChart({ points }: { points: { label: string; amount: number; cumulative: number }[] }) {
  const colors = useChartColors();
  if (!points.length) return <p className="text-sm text-muted-foreground">Genere períodos para ver la curva de inversión.</p>;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={points}>
          <CartesianGrid stroke={colors.grid} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: colors.tick }} />
          <YAxis tick={{ fontSize: 12, fill: colors.tick }} />
          <Tooltip contentStyle={{ background: colors.card, borderColor: colors.grid, color: colors.foreground }} />
          <Bar dataKey="amount" name="Periodo" fill={colors.bar} />
          <Line dataKey="cumulative" name="Acumulado" stroke={colors.line} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompareChart({ points }: { points: { name: string; total: number }[] }) {
  const colors = useChartColors();
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={points}>
          <CartesianGrid stroke={colors.grid} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: colors.tick }} interval={0} angle={-20} height={70} />
          <YAxis tick={{ fontSize: 12, fill: colors.tick }} />
          <Tooltip contentStyle={{ background: colors.card, borderColor: colors.grid, color: colors.foreground }} />
          <Bar dataKey="total" name="Total" fill={colors.bar} />
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
  if (!tasks.length) return <p className="text-sm text-muted-foreground">No hay rubros en el cronograma.</p>;
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
              <div className="relative h-7 rounded bg-muted" style={{ width: totalDays * width }}>
                <div className="absolute top-1 h-5 rounded bg-primary" style={{ left: left * width, width: span * width }} title={`${task.start} → ${task.end}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
