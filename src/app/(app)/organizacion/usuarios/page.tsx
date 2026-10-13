import { assignAction, memberAction } from "@/app/actions";
import { Notice, Panel, ROLE_LABEL, Submit, TextField } from "@/components/kit";
import { Select } from "@/components/ui";
import { listVisibleProjects } from "@/lib/domain";
import { listPeople, requireSession } from "@/lib/session";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const query = await searchParams;
  const session = await requireSession();
  const people = await listPeople(session);
  const { projects } = await listVisibleProjects();
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Usuarios</h1>
      <Notice message={query.aviso} />
      <p className="text-sm text-stone-600">El administrador crea la clave y asigna las obras. Cada persona entra solo a las obras que tiene asignadas; el administrador las ve todas.</p>
      <Panel title="Equipo">
        {people.map((person) => (
          <form key={person.id} action={assignAction} className="mb-4 border-b border-border pb-3">
            <input type="hidden" name="userId" value={person.user_id} />
            <p className="font-medium">{person.fullName} · {person.email}</p>
            <p className="mb-2 text-xs text-stone-500">{ROLE_LABEL[person.role]}</p>
            <div className="flex flex-wrap gap-3 text-sm">
              {projects.map((project) => <label key={project.id}><input type="checkbox" name="projectId" value={project.id} defaultChecked={person.projectIds.includes(project.id)} /> {project.name}</label>)}
            </div>
            {session.role === "admin" ? <div className="mt-2"><Submit variant="secondary">Guardar obras</Submit></div> : null}
          </form>
        ))}
      </Panel>
      {session.role === "admin" ? (
        <Panel title="Alta">
          <form action={memberAction} className="grid gap-3 md:grid-cols-2">
            <TextField label="Nombre" name="fullName" required />
            <TextField label="Correo" name="email" type="email" required />
            <TextField label="Clave" name="password" type="password" required />
            <label className="text-sm">Rol<Select name="role"><option value="presupuestador">Presupuestador</option><option value="bodega">Bodega</option><option value="consulta">Consulta</option><option value="admin">Administrador</option></Select></label>
            <div className="md:col-span-2 flex flex-wrap gap-3 text-sm">{projects.map((project) => <label key={project.id}><input type="checkbox" name="projectId" value={project.id} /> {project.name}</label>)}</div>
            <Submit>Crear usuario</Submit>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
