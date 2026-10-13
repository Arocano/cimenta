import { CompareChart } from "@/components/charts";
import { Panel } from "@/components/kit";
import { projectBundle } from "@/lib/domain";
import { dec } from "@/lib/engine/money";
import Link from "next/link";

const reports = [
  ["general", "Presupuesto general"],
  ["numerado", "Presupuesto numerado"],
  ["detallado", "Presupuesto detallado"],
  ["directos", "Costos directos"],
  ["capitulos", "Solo capítulos"],
  ["insumos", "Listado de insumos"],
  ["apu", "Análisis de precios unitarios"],
  ["indirectos", "Costos indirectos"],
  ["desagregacion", "Desagregación tecnológica"],
  ["simbolos", "Símbolos, fórmula y cuadrilla"],
  ["bodega", "Bodega y materiales"],
  ["planilla", "Planillas"],
  ["cronograma", "Cronograma"],
];

export default async function ReportsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await projectBundle(id);
  const points = data.chapters.map((chapter) => ({ name: chapter.name, total: Number(data.priced.chapters.find((item) => item.chapterId === chapter.id)?.total ?? 0) }));
  const direct = dec(data.priced.direct);
  const total = dec(data.priced.total);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Reportes</h1>
      <Panel title="Salidas">
        <ul className="grid gap-2 md:grid-cols-2">
          {reports.map(([tipo, label]) => (
            <li key={tipo} className="flex flex-wrap gap-3 text-sm">
              <Link className="underline" href={`/obras/${id}/reportes/${tipo}`}>{label}</Link>
              <a href={`/api/obras/${id}/excel?tipo=${tipo}`}>Excel</a>
              <a href={`/api/obras/${id}/word?tipo=${tipo}`}>Word</a>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a className="underline" href={`/api/obras/${id}/respaldo`}>Respaldo JSON de la obra</a>
          <a className="underline" href="/api/organizacion/respaldo">Respaldo de la organización</a>
          <a className="underline" href={`/api/obras/${id}/project`}>Exportar cronograma a Project</a>
        </div>
      </Panel>
      <Panel title="Gráfico comparativo">
        <CompareChart points={points} />
        <p className="text-sm">Directo {direct.toFixed(2)} · Oferta {total.toFixed(2)}</p>
      </Panel>
    </div>
  );
}
