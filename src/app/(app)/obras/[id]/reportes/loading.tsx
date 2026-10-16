import { Loader2 } from "lucide-react";

export default function ReportsLoading() {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <h1 className="font-serif text-3xl">Reportes</h1>
      <section className="flex min-h-48 items-center justify-center rounded-lg border border-border bg-card p-4 text-card-foreground">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
          Preparando el reporte…
        </p>
      </section>
    </div>
  );
}
