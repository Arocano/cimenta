import { deleteCatalogAction, purgeAction } from "@/app/actions";
import { catalogRows, displayValue, primaryLink, secondaryLink } from "@/components/catalog-record";
import { ConfirmForm } from "@/components/confirm-form";
import { CheckChip, DataTable, DateText, Notice, Panel, Submit, TextField } from "@/components/kit";
import { catalogs, kindLabel, purgeOptions } from "@/lib/catalogs";
import { orgCatalog } from "@/lib/domain";
import Link from "next/link";

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ catalog: string }>; searchParams: Promise<{ aviso?: string }> }) {
  const { catalog } = await params;
  const query = await searchParams;
  const data = await orgCatalog();
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  const back = `/mantenimiento/${catalog}`;

  if (catalog === "historicos") {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-serif text-3xl">Históricos</h1>
          {editable ? <Link href="/mantenimiento/historicos/nuevo" className={primaryLink}>Nueva foto</Link> : null}
        </div>
        <Notice message={query.aviso} />
        <Panel title="Fotos guardadas">
          {data.snapshots.length ? (
            <ul className="divide-y divide-border">
              {data.snapshots.map((item) => (
                <li key={String(item.id)}>
                  <Link href={`/mantenimiento/historicos/foto/${item.id}`} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-primary">
                    <span><DateText value={String(item.captured_on)} /> · {String(item.note || "Sin nota")}</span>
                    <span>Ver detalle</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Todavía no hay fotos. La primera se crea con Nueva foto.</p>}
        </Panel>
      </div>
    );
  }

  if (catalog === "depurar") {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">Eliminar información</h1>
        <Notice message={query.aviso} />
        <p className="max-w-2xl text-sm text-muted-foreground">El borrado afecta la base de la organización. Las obras ya copiadas conservan sus precios. Marcar todas las opciones deja la base en blanco.</p>
        {data.session.role === "admin" ? (
          <Panel title="Qué eliminar">
            <form action={purgeAction} className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {purgeOptions.map(([value, label]) => <CheckChip key={value} name="family" value={value} label={label} />)}
              </div>
              <TextField label="Confirmación" name="confirmation" placeholder={data.session.orgName} hint={`Escriba ${data.session.orgName} para confirmar.`} />
              <div className="border-t border-border pt-4">
                <Submit variant="danger" pending="Eliminando…">Eliminar lo marcado</Submit>
              </div>
            </form>
          </Panel>
        ) : <p className="text-sm">Solo el administrador depura la base.</p>}
      </div>
    );
  }

  if (catalog === "analisis") {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">Análisis de la base</h1>
        <Notice message={query.aviso} />
        {data.rubros.length ? null : <p className="text-sm text-muted-foreground">Primero cree rubros. Después puede agregar sus insumos.</p>}
        {data.rubros.map((rubro) => {
          const lines = data.analysis.filter((line) => line.rubro_id === rubro.id);
          return (
            <Panel
              key={String(rubro.id)}
              title={`${String(rubro.code)} ${String(rubro.name)}`}
              action={editable ? <Link href={`/mantenimiento/analisis/nuevo?rubro=${rubro.id}`} className={secondaryLink}>Agregar línea</Link> : null}
            >
              {lines.length ? (
                <DataTable headers={["Tipo", "Nombre", "Cantidad", "Unidad", "Origen", "CPC"]}>
                  {lines.map((line) => (
                    <tr key={String(line.id)} className="border-b border-border">
                      <td className="px-2 py-2">{kindLabel[String(line.kind)] ?? String(line.kind)}</td>
                      <td className="px-2 py-2">{String(line.name)}</td>
                      <td className="px-2 py-2 tabular-nums">{String(line.quantity)}</td>
                      <td className="px-2 py-2">{String(line.unit)}</td>
                      <td className="px-2 py-2">{String(line.origin)}</td>
                      <td className="px-2 py-2">{String(line.cpc_code)}</td>
                    </tr>
                  ))}
                </DataTable>
              ) : <p className="text-sm text-muted-foreground">Este rubro todavía no tiene insumos.</p>}
            </Panel>
          );
        })}
      </div>
    );
  }

  const config = catalogs[catalog];
  if (!config) return <p>Ese catálogo no existe.</p>;
  const rows = catalogRows(data, catalog);
  const columns = config.fields.filter((field) => config.columns.includes(field.name));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-serif text-3xl">{config.title}</h1>
        {editable ? (
          <div className="flex flex-wrap gap-2">
            {config.family ? <Link href={`${back}/recalcular`} className={secondaryLink}>Recalcular obras</Link> : null}
            {catalog === "materiales" ? <Link href={`${back}/relacion`} className={secondaryLink}>Relacionar proveedor</Link> : null}
            <Link href={`${back}/nuevo`} className={primaryLink}>Agregar</Link>
          </div>
        ) : null}
      </div>
      <Notice message={query.aviso} />
      <Panel title="Registros">
        {rows.length ? (
          <DataTable headers={[...columns.map((field) => field.label), "Acciones"]}>
            {rows.map((row) => (
              <tr key={String(row.id)} className="border-b border-border">
                {columns.map((field) => <td key={field.name} className="px-2 py-2">{displayValue(field, row, data)}</td>)}
                <td className="px-2 py-2">
                  {editable ? (
                    <div className="flex flex-wrap gap-2">
                      <Link href={`${back}/editar/${row.id}`} className={secondaryLink}>Editar</Link>
                      <ConfirmForm action={deleteCatalogAction} message="¿Eliminar este registro? Si está en uso, no se borra.">
                        <input type="hidden" name="table" value={config.table} />
                        <input type="hidden" name="id" value={String(row.id)} />
                        <input type="hidden" name="back" value={back} />
                        <Submit variant="danger" pending="Eliminando…" className="h-10">Eliminar</Submit>
                      </ConfirmForm>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
          </DataTable>
        ) : <p className="text-sm text-muted-foreground">Todavía no hay registros. Use Agregar para crear el primero.</p>}
      </Panel>
    </div>
  );
}
