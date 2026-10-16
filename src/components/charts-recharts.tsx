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
