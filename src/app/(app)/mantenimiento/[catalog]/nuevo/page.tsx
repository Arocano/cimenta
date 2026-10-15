import { AnalysisLineForm, RecordForm, SnapshotForm } from "@/components/catalog-record";
import { Notice, Panel } from "@/components/kit";
import { catalogs } from "@/lib/catalogs";
import { orgCatalog } from "@/lib/domain";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function NewCatalogPage({ params, searchParams }: { params: Promise<{ catalog: string }>; searchParams: Promise<{ aviso?: string; rubro?: string }> }) {
  const { catalog } = await params;
  const query = await searchParams;
  const data = await orgCatalog();
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  const back = `/mantenimiento/${catalog}`;
  if (!editable) redirect(back);

  if (catalog === "historicos") {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">Nueva foto de precios</h1>
        <Notice message={query.aviso} />
        <Panel title="Datos de la foto">
          <SnapshotForm />
        </Panel>
      </div>
    );
  }

  if (catalog === "analisis") {
    const rubro = data.rubros.find((item) => String(item.id) === query.rubro);
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">Agregar línea</h1>
        <Notice message={query.aviso} />
        {rubro ? (
          <Panel title={`${String(rubro.code)} ${String(rubro.name)}`}>
            <AnalysisLineForm data={data} rubroId={String(rubro.id)} />
          </Panel>
        ) : (
          <Panel title="Elija el rubro">
            {data.rubros.length ? (
              <ul className="space-y-2 text-sm">
                {data.rubros.map((item) => (
                  <li key={String(item.id)}>
                    <Link className="text-primary underline" href={`/mantenimiento/analisis/nuevo?rubro=${item.id}`}>{String(item.code)} {String(item.name)}</Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">Primero cree un rubro en el catálogo.</p>}
          </Panel>
        )}
      </div>
    );
  }

  const config = catalogs[catalog];
  if (!config) notFound();
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Agregar · {config.title}</h1>
      <Notice message={query.aviso} />
      <Panel title="Nuevo registro">
        <RecordForm config={config} data={data} back={back} submitLabel="Agregar" pending="Agregando…" />
      </Panel>
    </div>
  );
}
