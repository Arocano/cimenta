import { setOrganizationActiveAction } from "@/app/actions";
import { DateText, Notice, Panel, Submit } from "@/components/kit";
import { listPlatformOrganizations } from "@/lib/session";

export default async function PlatformPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const query = await searchParams;
  const organizations = await listPlatformOrganizations();
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-serif text-3xl">Plataforma</h1>
        <p className="text-sm text-stone-600">Activa o desactiva las organizaciones. Una organización inactiva no entra a obras, catálogo ni planillas.</p>
      </header>
      <Notice message={query.aviso} />
      <Panel title="Organizaciones">
        <div className="divide-y divide-border">
          {organizations.length === 0 ? <p className="text-sm text-stone-500">Todavía no hay organizaciones.</p> : null}
          {organizations.map((org) => (
            <div key={org.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{org.name}</p>
                <p className="text-xs text-stone-500"><DateText value={org.created_at} /> · {org.admins.join(", ") || "Sin administrador"}</p>
              </div>
              <form action={setOrganizationActiveAction} className="flex items-center gap-2">
                <input type="hidden" name="orgId" value={org.id} />
                <input type="hidden" name="active" value={org.active ? "false" : "true"} />
                <span className={`text-sm ${org.active ? "text-emerald-800" : "text-stone-500"}`}>{org.active ? "Activa" : "Inactiva"}</span>
                <Submit variant={org.active ? "danger" : "secondary"}>{org.active ? "Desactivar" : "Activar"}</Submit>
              </form>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
