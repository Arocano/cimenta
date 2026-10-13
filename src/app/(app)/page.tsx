import { copyProjectAction, createProjectAction, deleteProjectAction, importExcelAction } from "@/app/actions";
import { DateText, Notice, Panel, Submit, TextField } from "@/components/kit";
import { listVisibleProjects } from "@/lib/domain";
import { todayIso } from "@/lib/engine/money";
import Link from "next/link";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ aviso?: string; q?: string }> }) {
  const query = await searchParams;
  const { projects, session } = await listVisibleProjects(query.q ?? "");
  const canEdit = session.role === "admin" || session.role === "presupuestador";
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-serif text-3xl">Obras</h1>
        <p className="text-sm text-stone-600">Cada obra concentra el presupuesto, el tiempo y el control de ejecución.</p>
      </header>
      <Notice message={query.aviso} />
      <form className="no-print flex gap-2">
        <input name="q" defaultValue={query.q} placeholder="Buscar por nombre o fecha" className="h-9 flex-1 rounded-md border border-input bg-card px-3 text-sm" />
        <Submit variant="secondary">Buscar</Submit>
      </form>
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Panel title="Listado">
          <div className="divide-y divide-border">
            {projects.length === 0 ? <p className="text-sm text-stone-500">Todavía no hay obras.</p> : null}
            {projects.map((project) => (
              <div key={project.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <Link href={`/obras/${project.id}`} className="font-medium hover:underline">{project.name}</Link>
                  <p className="text-xs text-stone-500"><DateText value={project.proposed_date} /></p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/obras/${project.id}/presupuesto`} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">Abrir</Link>
                  {canEdit ? (
                    <form action={copyProjectAction}><input type="hidden" name="id" value={project.id} /><Submit variant="secondary">Copiar</Submit></form>
                  ) : null}
                  {session.role === "admin" ? (
                    <form action={deleteProjectAction}><input type="hidden" name="id" value={project.id} /><Submit variant="danger">Eliminar</Submit></form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Panel>
        {canEdit ? (
          <div className="space-y-4">
            <Panel title="Nueva obra">
              <form action={createProjectAction} className="space-y-3">
                <TextField label="Nombre" name="name" required hint="El nombre es obligatorio." />
                <TextField label="Fecha propuesta" name="proposed_date" type="date" defaultValue={todayIso()} />
                <Submit>Crear obra</Submit>
              </form>
            </Panel>
            <Panel title="Presupuesto desde Excel">
              <form action={importExcelAction} className="space-y-3">
                <TextField label="Nombre de la obra" name="name" />
                <input name="file" type="file" accept=".xlsx" required className="text-sm" />
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="includeCatalog" value="si" /> Incluir rubros en el catálogo general</label>
                <a className="block text-sm text-primary underline" href="/api/plantilla">Descargar plantilla</a>
                <Submit variant="secondary">Importar</Submit>
              </form>
            </Panel>
          </div>
        ) : null}
      </div>
    </div>
  );
}
