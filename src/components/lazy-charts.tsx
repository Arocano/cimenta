"use client";

import dynamic from "next/dynamic";

function waiting() {
  return <p className="text-sm text-muted-foreground">Cargando el gráfico…</p>;
}

export const InvestmentChart = dynamic(() => import("./charts-recharts").then((mod) => mod.InvestmentChart), { ssr: false, loading: waiting });

export const CompareChart = dynamic(() => import("./charts-recharts").then((mod) => mod.CompareChart), { ssr: false, loading: waiting });
