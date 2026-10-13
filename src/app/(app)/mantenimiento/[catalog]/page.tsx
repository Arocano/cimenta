import { catalogAction, deleteCatalogAction, linkSupplierAction, purgeAction, recalculateAction, snapshotAction } from "@/app/actions";
import { DataTable, Field, Notice, Panel, Submit, TextField } from "@/components/kit";
import { Select } from "@/components/ui";
import { orgCatalog } from "@/lib/domain";
import type { TableName } from "@/lib/types";

type FieldDef = { name: string; label: string; kind?: "text" | "select" | "check" };

const catalogs: Record<string, { title: string; table: TableName; key: keyof Awaited<ReturnType<typeof orgCatalog>>; fields: FieldDef[]; family?: "material" | "labor" | "equipment" | "transport" }> = {
  unidades: { title: "Unidades", table: "units", key: "units", fields: [{ name: "code", label: "Código" }, { name: "name", label: "Nombre" }] },
  equivalencias: { title: "Equivalencias", table: "unit_conversions", key: "conversions", fields: [{ name: "from_qty", label: "Cantidad origen" }, { name: "from_unit", label: "Unidad origen" }, { name: "to_qty", label: "Cantidad destino" }, { name: "to_unit", label: "Unidad destino" }] },
  capitulos: { title: "Capítulos", table: "catalog_chapters", key: "chapters", fields: [{ name: "code", label: "Código" }, { name: "name", label: "Nombre" }, { name: "sort_order", label: "Orden" }] },
  tipos: { title: "Tipos", table: "rubro_types", key: "types", fields: [{ name: "name", label: "Nombre" }] },
  rubros: { title: "Rubros", table: "catalog_rubros", key: "rubros", fields: [{ name: "code", label: "Código" }, { name: "name", label: "Nombre" }, { name: "unit", label: "Unidad" }, { name: "yield_rate", label: "Rendimiento" }, { name: "chapter_id", label: "Capítulo" }, { name: "type_id", label: "Tipo" }] },
  equipos: { title: "Equipos", table: "equipment", key: "equipment", family: "equipment", fields: [{ name: "code", label: "Código" }, { name: "name", label: "Nombre" }, { name: "hourly_chamber", label: "Costo hora cámara" }, { name: "hourly_personal", label: "Costo hora personal" }, { name: "yield_rate", label: "Rendimiento" }, { name: "power", label: "Potencia" }, { name: "brand", label: "Marca" }, { name: "machine_type", label: "Tipo" }, { name: "uses_gasoline", label: "Gasolina", kind: "check" }, { name: "chamber_code", label: "Código de cámara" }] },
  ciudades: { title: "Ciudades", table: "cities", key: "cities", fields: [{ name: "name", label: "Ciudad" }] },
  proveedores: { title: "Proveedores", table: "suppliers", key: "suppliers", fields: [{ name: "name", label: "Nombre" }, { name: "address", label: "Dirección" }, { name: "city_id", label: "Ciudad" }] },
  materiales: { title: "Materiales", table: "materials", key: "materials", family: "material", fields: [{ name: "code", label: "Código" }, { name: "name", label: "Descripción" }, { name: "unit", label: "Unidad" }, { name: "chamber_price", label: "Precio cámara" }, { name: "personal_price", label: "Precio personal" }] },
  "mano-obra": { title: "Mano de obra", table: "labor_categories", key: "labor", family: "labor", fields: [{ name: "code", label: "Código" }, { name: "name", label: "Categoría" }, { name: "hourly_chamber", label: "Salario hora cámara" }, { name: "hourly_personal", label: "Salario hora personal" }] },
  transporte: { title: "Transporte", table: "transport_rates", key: "transport", family: "transport", fields: [{ name: "code", label: "Código" }, { name: "name", label: "Nombre" }, { name: "unit", label: "Unidad" }, { name: "rate_chamber", label: "Tarifa cámara" }, { name: "rate_personal", label: "Tarifa personal" }] },
  cpc: { title: "CPC", table: "cpc_codes", key: "cpc", fields: [{ name: "code", label: "Código de 9 dígitos" }, { name: "description", label: "Descripción" }] },
  umbrales: { title: "Umbrales VAE", table: "vae_thresholds", key: "thresholds", fields: [{ name: "name", label: "Nombre" }, { name: "percent", label: "Porcentaje" }, { name: "note", label: "Nota" }] },
};

export default async function CatalogPage({ params, searchParams }: { params: Promise<{ catalog: string }>; searchParams: Promise<{ aviso?: string; foto?: string }> }) {
  const { catalog } = await params;
  const query = await searchParams;
  const data = await orgCatalog();
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  if (catalog === "historicos") {
    const foto = data.snapshotLines.filter((line) => line.snapshot_id === query.foto);
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">Históricos</h1>
        <Notice message={query.aviso} />
        {editable ? (
          <form action={snapshotAction} className="space-y-2">
            <TextField label="Nota" name="note" />
            {["material", "labor", "equipment", "transport"].map((family) => <label key={family} className="mr-3 text-sm"><input type="checkbox" name="family" value={family} defaultChecked /> {family}</label>)}
            <Submit>Guardar foto de precios</Submit>
          </form>
        ) : null}
        <ul className="text-sm">{data.snapshots.map((item) => <li key={String(item.id)}><a className="underline" href={`?foto=${item.id}`}>{String(item.captured_on)} · {String(item.note)}</a></li>)}</ul>
        <DataTable headers={["Familia", "Código", "Nombre", "Cámara", "Personal"]}>
          {foto.map((line) => <tr key={String(line.id)}><td className="px-2 py-1">{String(line.family)}</td><td>{String(line.code)}</td><td>{String(line.name)}</td><td>{String(line.chamber_price)}</td><td>{String(line.personal_price)}</td></tr>)}
        </DataTable>
      </div>
    );
  }
  if (catalog === "depurar") {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">Eliminar información</h1>
        <Notice message={query.aviso} />
        <p className="text-sm">El borrado afecta la base de la organización, no las obras ya copiadas. Escriba <strong>{data.session.orgName}</strong> para confirmar. Marcar todas las opciones deja la base en blanco.</p>
        {data.session.role === "admin" ? (
          <form action={purgeAction} className="space-y-2">
            {["unidades", "equivalencias", "capitulos", "rubros", "analisis", "equipos", "materiales", "mano", "transporte", "proveedores", "ciudades", "historicos", "cpc", "umbrales"].map((family) => <label key={family} className="mr-3 text-sm"><input type="checkbox" name="family" value={family} /> {family}</label>)}
            <TextField label="Confirmación" name="confirmation" />
            <Submit variant="danger">Depurar</Submit>
          </form>
        ) : <p>Solo el administrador depura la base.</p>}
      </div>
    );
  }
  if (catalog === "analisis") {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl">Análisis de la base</h1>
        {data.rubros.map((rubro) => (
          <Panel key={String(rubro.id)} title={`${String(rubro.code)} ${String(rubro.name)}`}>
            <ul className="text-sm">{data.analysis.filter((line) => line.rubro_id === rubro.id).map((line) => <li key={String(line.id)}>{String(line.kind)} · {String(line.name)} · {String(line.quantity)} {String(line.unit)} · {String(line.origin)} · {String(line.cpc_code)}</li>)}</ul>
            {editable ? (
              <form action={catalogAction} className="mt-3 grid gap-2 md:grid-cols-4">
                <input type="hidden" name="table" value="catalog_apu_lines" /><input type="hidden" name="back" value="/mantenimiento/analisis" /><input type="hidden" name="rubro_id" value={String(rubro.id)} /><input type="hidden" name="org_id" value={data.session.orgId} />
                <TextField label="Tipo" name="kind" defaultValue="material" />
                <TextField label="Nombre" name="name" />
                <TextField label="Cantidad" name="quantity" defaultValue="1" />
                <TextField label="Unidad" name="unit" />
                <TextField label="Código" name="code" />
                <TextField label="Origen" name="origin" defaultValue="ND" />
                <TextField label="CPC" name="cpc_code" />
                <input type="hidden" name="ref_id" value="" /><input type="hidden" name="sort_order" value="1" />
                <Submit>Agregar línea</Submit>
              </form>
            ) : null}
          </Panel>
        ))}
      </div>
    );
  }
  const config = catalogs[catalog];
  if (!config) return <p>Ese catálogo no existe.</p>;
  const rows = data[config.key] as Record<string, unknown>[];
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">{config.title}</h1>
      <Notice message={query.aviso} />
      {config.family && editable ? (
        <form action={recalculateAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="family" value={config.family} /><input type="hidden" name="back" value={`/mantenimiento/${catalog}`} />
          <Field label="Recalcular obras"><Select name="scheme"><option value="chamber">Precio de cámara</option><option value="personal">Precio personal</option></Select></Field>
          <Submit variant="secondary">Recalcular</Submit>
        </form>
      ) : null}
      <DataTable headers={[...config.fields.map((field) => field.label), ""]}>
        {rows.map((row) => (
          <tr key={String(row.id)} className="border-b border-border align-top">
            <td colSpan={config.fields.length + 1} className="px-2 py-2">
              <form action={catalogAction} className="grid gap-2 md:grid-cols-4">
                <input type="hidden" name="table" value={config.table} /><input type="hidden" name="id" value={String(row.id)} /><input type="hidden" name="back" value={`/mantenimiento/${catalog}`} />
                {config.fields.map((field) => field.kind === "check" ? (
                  <label key={field.name} className="text-sm"><input type="checkbox" name={field.name} defaultChecked={Boolean(row[field.name])} /> {field.label}</label>
                ) : field.name.endsWith("_id") ? (
                  <Field key={field.name} label={field.label}>
                    <Select name={field.name} defaultValue={String(row[field.name] ?? "")}>
                      <option value="">—</option>
                      {(field.name === "city_id" ? data.cities : field.name === "chapter_id" ? data.chapters : data.types).map((option) => <option key={String(option.id)} value={String(option.id)}>{String(option.name)}</option>)}
                    </Select>
                  </Field>
                ) : <TextField key={field.name} label={field.label} name={field.name} defaultValue={String(row[field.name] ?? "")} />)}
                {editable ? <Submit variant="secondary">Guardar</Submit> : null}
              </form>
              {editable ? <form action={deleteCatalogAction}><input type="hidden" name="table" value={config.table} /><input type="hidden" name="id" value={String(row.id)} /><input type="hidden" name="back" value={`/mantenimiento/${catalog}`} /><button className="text-xs text-red-800">Eliminar</button></form> : null}
            </td>
          </tr>
        ))}
      </DataTable>
      {editable ? (
        <Panel title="Nuevo registro">
          <form action={catalogAction} className="grid gap-2 md:grid-cols-4">
            <input type="hidden" name="table" value={config.table} /><input type="hidden" name="back" value={`/mantenimiento/${catalog}`} />
            {config.fields.map((field) => field.kind === "check" ? <label key={field.name} className="text-sm"><input type="checkbox" name={field.name} /> {field.label}</label> : <TextField key={field.name} label={field.label} name={field.name} />)}
            <Submit>Agregar</Submit>
          </form>
        </Panel>
      ) : null}
      {catalog === "materiales" && editable ? (
        <Panel title="Material y proveedor">
          <form action={linkSupplierAction} className="grid gap-2 md:grid-cols-3">
            <Field label="Material"><Select name="material_id">{data.materials.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</Select></Field>
            <Field label="Proveedor"><Select name="supplier_id">{data.suppliers.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}</Select></Field>
            <Submit>Relacionar</Submit>
          </form>
          <ul className="mt-3 text-sm">{data.links.map((link) => <li key={String(link.id)}>{String(data.materials.find((item) => item.id === link.material_id)?.name)} · {String(data.suppliers.find((item) => item.id === link.supplier_id)?.name)}</li>)}</ul>
        </Panel>
      ) : null}
    </div>
  );
}
