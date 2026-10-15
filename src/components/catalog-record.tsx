import { catalogAction, snapshotAction } from "@/app/actions";
import { CheckChip, Field, Submit, TextField } from "@/components/kit";
import { fieldClass, Select } from "@/components/ui";
import { catalogs, priceFamilies, type CatalogConfig, type FieldDef } from "@/lib/catalogs";
import { orgCatalog } from "@/lib/domain";
import Link from "next/link";

export type CatalogData = Awaited<ReturnType<typeof orgCatalog>>;

export const primaryLink = "inline-flex h-10 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover";
export const secondaryLink = "inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-accent";

function groupsOf(fields: FieldDef[]) {
  const groups: { title: string | null; fields: FieldDef[] }[] = [];
  for (const field of fields) {
    const title = field.group ?? null;
    const last = groups.at(-1);
    if (!last || last.title !== title) groups.push({ title, fields: [field] });
    else last.fields.push(field);
  }
  return groups;
}

function optionsFor(name: string, data: CatalogData) {
  if (name === "city_id") return data.cities.map((item) => ({ id: String(item.id), label: String(item.name) }));
  if (name === "chapter_id") return data.chapters.map((item) => ({ id: String(item.id), label: `${String(item.code ?? "")} ${String(item.name ?? "")}`.trim() }));
  if (name === "type_id") return data.types.map((item) => ({ id: String(item.id), label: String(item.name) }));
  return [];
}

export function displayValue(field: FieldDef, row: Record<string, unknown>, data: CatalogData) {
  if (field.kind === "check") return row[field.name] ? "Sí" : "No";
  if (field.name.endsWith("_id")) return optionsFor(field.name, data).find((item) => item.id === String(row[field.name] ?? ""))?.label || "—";
  const value = String(row[field.name] ?? "").trim();
  return value || "—";
}

export function catalogRows(data: CatalogData, catalog: string) {
  const config = catalogs[catalog];
  if (!config) return [];
  return data[config.key] as Record<string, unknown>[];
}

function CatalogField({ field, row, data, listId }: { field: FieldDef; row?: Record<string, unknown>; data: CatalogData; listId: string }) {
  const value = row ? String(row[field.name] ?? "") : "";
  if (field.kind === "check") return <CheckChip name={field.name} label={field.label} defaultChecked={Boolean(row?.[field.name])} />;
  if (field.name.endsWith("_id")) {
    const options = optionsFor(field.name, data);
    return (
      <Field label={field.label} hint={options.length ? field.hint : "Cree primero las opciones en su catálogo."}>
        <Select name={field.name} defaultValue={value}>
          <option value="">{field.name === "city_id" ? "Sin ciudad" : "Seleccione"}</option>
          {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
        </Select>
      </Field>
    );
  }
  if (field.kind === "unit") {
    return (
      <Field label={field.label} hint={data.units.length ? "Puede elegir una unidad de la base o escribir otra." : field.hint}>
        <input className={fieldClass} name={field.name} defaultValue={value} list={listId} autoComplete="off" />
      </Field>
    );
  }
  return <TextField label={field.label} name={field.name} defaultValue={value} type={field.kind === "number" ? "number" : "text"} hint={field.hint} />;
}

export function RecordForm({
  config,
  data,
  row,
  back,
  submitLabel,
  pending,
}: {
  config: CatalogConfig;
  data: CatalogData;
  row?: Record<string, unknown>;
  back: string;
  submitLabel: string;
  pending: string;
}) {
  const listId = row ? `unidades-${row.id}` : "unidades-nuevo";
  return (
    <form action={catalogAction} className="space-y-5">
      <input type="hidden" name="table" value={config.table} />
      <input type="hidden" name="back" value={back} />
      {row ? <input type="hidden" name="id" value={String(row.id)} /> : null}
      {data.units.length ? (
        <datalist id={listId}>
          {data.units.map((unit) => <option key={String(unit.id)} value={String(unit.code)}>{String(unit.name)}</option>)}
        </datalist>
      ) : null}
      {groupsOf(config.fields).map((group) => (
        <div key={group.title ?? "campos"}>
          {group.title ? <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.title}</h3> : null}
          <div className="grid gap-4 md:grid-cols-2">
            {group.fields.map((field) => <CatalogField key={field.name} field={field} row={row} data={data} listId={listId} />)}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Submit pending={pending}>{submitLabel}</Submit>
        <Link href={back} className={secondaryLink}>Cancelar</Link>
      </div>
    </form>
  );
}

export function SnapshotForm() {
  return (
    <form action={snapshotAction} className="space-y-4">
      <TextField label="Nota" name="note" placeholder="Ejemplo: precios de octubre" hint="Sirve para reconocer esta foto al actualizar una obra." />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Familias que entran en la foto</legend>
        <div className="flex flex-wrap gap-2">
          {priceFamilies.map(([value, label]) => <CheckChip key={value} name="family" value={value} label={label} defaultChecked />)}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Submit pending="Guardando foto…">Guardar foto de precios</Submit>
        <Link href="/mantenimiento/historicos" className={secondaryLink}>Cancelar</Link>
      </div>
    </form>
  );
}

export function AnalysisLineForm({ data, rubroId }: { data: CatalogData; rubroId: string }) {
  return (
    <form action={catalogAction} className="space-y-4">
      <input type="hidden" name="table" value="catalog_apu_lines" />
      <input type="hidden" name="back" value="/mantenimiento/analisis" />
      <input type="hidden" name="rubro_id" value={rubroId} />
      <input type="hidden" name="org_id" value={data.session.orgId} />
      <input type="hidden" name="ref_id" value="" />
      <input type="hidden" name="sort_order" value="1" />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tipo">
          <Select name="kind" defaultValue="material">
            <option value="material">Material</option>
            <option value="labor">Mano de obra</option>
            <option value="equipment">Equipo</option>
            <option value="transport">Transporte</option>
            <option value="auxiliary">Auxiliar</option>
          </Select>
        </Field>
        <TextField label="Nombre" name="name" />
        <TextField label="Cantidad" name="quantity" type="number" defaultValue="1" />
        <Field label="Unidad" hint={data.units.length ? "Puede elegir una unidad de la base o escribir otra." : undefined}>
          <input className={fieldClass} name="unit" list="unidades-linea" autoComplete="off" />
        </Field>
        <TextField label="Código" name="code" />
        <Field label="Origen" hint="En el VAE, EP cuenta 100 %, ND 40 % y NP 0 %.">
          <Select name="origin" defaultValue="ND">
            <option value="EP">EP</option>
            <option value="ND">ND</option>
            <option value="NP">NP</option>
          </Select>
        </Field>
        <TextField label="CPC" name="cpc_code" hint="Nueve dígitos." />
      </div>
      {data.units.length ? (
        <datalist id="unidades-linea">
          {data.units.map((unit) => <option key={String(unit.id)} value={String(unit.code)}>{String(unit.name)}</option>)}
        </datalist>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Submit pending="Agregando línea…">Agregar línea</Submit>
        <Link href="/mantenimiento/analisis" className={secondaryLink}>Cancelar</Link>
      </div>
    </form>
  );
}
