import Link from "next/link";

const items = [
  ["", "Datos"],
  ["presupuesto", "Presupuesto"],
  ["indirectos", "Indirectos"],
  ["desagregacion", "Desagregación"],
  ["reajuste", "Reajuste"],
  ["cronograma", "Cronograma"],
  ["bodega", "Bodega"],
  ["planillas", "Planillas"],
  ["reportes", "Reportes"],
];

export function ProjectNav({ id }: { id: string }) {
  return (
    <nav className="no-print flex flex-wrap gap-2">
      {items.map(([href, label]) => (
        <Link key={href} href={`/obras/${id}/${href}`} className="rounded-full border border-border bg-card px-3 py-1 text-sm hover:bg-accent">
          {label}
        </Link>
      ))}
    </nav>
  );
}
