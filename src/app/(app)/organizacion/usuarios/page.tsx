import { assignAction, memberAction } from "@/app/actions";
import { Field, Notice, Panel, ROLE_LABEL, Submit, TextField } from "@/components/kit";
import { PasswordField } from "@/components/password-field";
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
      <p className="text-sm text-muted-foreground">El administrador crea la clave y asigna las obras. Cada persona entra solo a las obras que tiene asignadas; el administrador las ve todas.</p>
      <Panel title="Equipo">
        {people.map((person) => (
          <form key={person.id} action={assignAction} className="mb-4 border-b border-border pb-3">
            <input type="hidden" name="userId" value={person.user_id} />
            <p className="font-medium">{person.fullName} · {person.email}</p>
            <p className="mb-2 text-xs text-muted-foreground">{ROLE_LABEL[person.role]}</p>
            <div className="flex flex-wrap gap-2 text-sm">
              {projects.map((project) => (
                <label key={project.id} className="inline-flex items-center gap-2 rounded-md border border-border bg-field px-3 py-2">
                  <input className="size-4 accent-primary" type="checkbox" name="projectId" value={project.id} defaultChecked={person.projectIds.includes(project.id)} />
                  {project.name}
                </label>
              ))}
            </div>
            {session.role === "admin" ? <div className="mt-2"><Submit variant="secondary">Guardar obras</Submit></div> : null}
          </form>
        ))}
      </Panel>
      {session.role === "admin" ? (
        <Panel title="Alta">
          <form action={memberAction} className="grid gap-4 md:grid-cols-2">
            <TextField label="Nombre" name="fullName" required autoComplete="name" />
            <TextField label="Correo" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="nombre@empresa.com" />
            <PasswordField label="Clave inicial" name="password" required autoComplete="new-password" hint="Mínimo 6 caracteres. La persona entra con esta clave." />
            <Field label="Rol" required>
              <Select name="role" defaultValue="presupuestador"><option value="presupuestador">Presupuestador</option><option value="bodega">Bodega</option><option value="consulta">Consulta</option><option value="admin">Administrador</option></Select>
            </Field>
            <div className="md:col-span-2 flex flex-wrap gap-2 text-sm">{projects.map((project) => <label key={project.id} className="inline-flex items-center gap-2 rounded-md border border-border bg-field px-3 py-2"><input className="size-4 accent-primary" type="checkbox" name="projectId" value={project.id} /> {project.name}</label>)}</div>
            <Submit pending="Creando usuario…">Crear usuario</Submit>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
