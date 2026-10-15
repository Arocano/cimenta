"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const path = usePathname();
  return (
    <nav className="no-print flex flex-wrap gap-2">
      {items.map(([href, label]) => {
        const target = href ? `/obras/${id}/${href}` : `/obras/${id}`;
        const active = href ? path === target || path.startsWith(`${target}/`) : path === target;
        return (
          <Link
            key={label}
            href={target}
            prefetch={true}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              active ? "border-transparent bg-accent font-medium text-accent-foreground" : "border-border bg-card hover:bg-accent",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
