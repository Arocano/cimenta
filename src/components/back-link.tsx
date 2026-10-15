"use client";

import { catalogTitle } from "@/lib/catalogs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function parentOf(path: string) {
  const obra = path.match(/^\/obras\/([^/]+)(?:\/(.*))?$/);
  if (obra) {
    const [, id, rest] = obra;
    if (!rest) return { href: "/", label: "Obras" };
    if (rest.startsWith("reportes/")) return { href: `/obras/${id}/reportes`, label: "Reportes" };
    return { href: `/obras/${id}`, label: "Datos de la obra" };
  }
  const maintenance = path.match(/^\/mantenimiento\/([^/]+)(?:\/(.*))?$/);
  if (maintenance) {
    const [, catalog, rest] = maintenance;
    if (!rest) return { href: "/mantenimiento", label: "Mantenimiento" };
    return { href: `/mantenimiento/${catalog}`, label: catalogTitle[catalog] ?? "Catálogo" };
  }
  if (path === "/mantenimiento" || path === "/plataforma" || path === "/organizacion/usuarios") return { href: "/", label: "Obras" };
  return null;
}

export function BackLink() {
  const target = parentOf(usePathname());
  if (!target) return null;
  return (
    <Link href={target.href} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden />
      {target.label}
    </Link>
  );
}
