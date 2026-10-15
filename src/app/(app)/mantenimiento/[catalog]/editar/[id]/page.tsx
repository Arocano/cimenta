import { RecordForm, catalogRows } from "@/components/catalog-record";
import { Notice, Panel } from "@/components/kit";
import { catalogs } from "@/lib/catalogs";
import { orgCatalog } from "@/lib/domain";
import { notFound, redirect } from "next/navigation";

export default async function EditCatalogPage({ params, searchParams }: { params: Promise<{ catalog: string; id: string }>; searchParams: Promise<{ aviso?: string }> }) {
  const { catalog, id } = await params;
  const query = await searchParams;
  const config = catalogs[catalog];
  if (!config) notFound();
  const data = await orgCatalog();
  const back = `/mantenimiento/${catalog}`;
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  if (!editable) redirect(back);
  const row = catalogRows(data, catalog).find((item) => String(item.id) === id);
  if (!row) redirect(`${back}?aviso=${encodeURIComponent("Ese registro ya no está en la base.")}`);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Editar · {config.title}</h1>
      <Notice message={query.aviso} />
      <Panel title="Datos del registro">
        <RecordForm config={config} data={data} row={row} back={back} submitLabel="Guardar cambios" pending="Guardando…" />
      </Panel>
    </div>
  );
}
