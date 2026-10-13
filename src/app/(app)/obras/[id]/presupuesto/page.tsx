import { addChapterAction, addLineAction, addRubroAction, moveAction, priceToolsAction, removeBudgetAction, updateLineAction, updateRubroAction } from "@/app/actions";
import { DataTable, Field, Money, Notice, Panel, Submit, TextField } from "@/components/kit";
import { Select } from "@/components/ui";
import { projectBundle } from "@/lib/domain";
import { formatMoney } from "@/lib/engine/money";

export default async function BudgetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aviso?: string; capitulo?: string; rubro?: string; q?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const data = await projectBundle(id);
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  const needle = (query.q ?? "").trim().toLowerCase();
  const chapter = data.chapters.find((item) => item.id === query.capitulo) ?? data.chapters[0];
  const rubros = data.rubros.filter((rubro) => rubro.chapter_id === chapter?.id).filter((rubro) => !needle || rubro.name.toLowerCase().includes(needle) || rubro.code.toLowerCase().includes(needle));
  const rubro = rubros.find((item) => item.id === query.rubro) ?? rubros[0];
  const priced = data.priced.rubros.find((item) => item.id === rubro?.id);
  const lines = data.lines.filter((line) => line.rubro_id === rubro?.id).sort((a, b) => a.sort_order - b.sort_order);
  const options = [
    ...data.materials.map((item) => ({ value: `material|${item.id}`, label: `Material · ${item.name}` })),
    ...data.labor.map((item) => ({ value: `labor|${item.id}`, label: `Mano de obra · ${item.name}` })),
    ...data.equipment.map((item) => ({ value: `equipment|${item.id}`, label: `Equipo · ${item.name}` })),
    ...data.transport.map((item) => ({ value: `transport|${item.id}`, label: `Transporte · ${item.name}` })),
    ...data.rubros.filter((item) => item.is_auxiliary && item.id !== rubro?.id).map((item) => ({ value: `auxiliary|${item.id}`, label: `Auxiliar · ${item.name}` })),
  ];
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-serif text-3xl">Presupuesto</h1>
        <p className="text-sm text-stone-600">Directo {formatMoney(data.priced.direct)} · Indirecto {formatMoney(data.priced.indirect)} · Total {formatMoney(data.priced.total)}. Los auxiliares no se suman: entran en el rubro que los consume.</p>
      </header>
      <Notice message={query.aviso} />
      <div className="grid gap-4 xl:grid-cols-[16rem_1fr]">
        <Panel title="Capítulos">
          <div className="space-y-2">
            {data.chapters.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <a className={item.id === chapter?.id ? "font-semibold text-primary" : ""} href={`/obras/${id}/presupuesto?capitulo=${item.id}`}>{item.name}</a>
                <span className="text-xs tabular-nums">{formatMoney(data.priced.chapters.find((row) => row.chapterId === item.id)?.total ?? 0)}</span>
              </div>
            ))}
          </div>
          {editable ? (
            <form action={addChapterAction} className="mt-4 space-y-2">
              <input type="hidden" name="projectId" value={id} />
              <TextField label="Nuevo capítulo" name="name" required />
              <Submit>Agregar</Submit>
            </form>
          ) : null}
        </Panel>
        <div className="space-y-4">
          <Panel title={chapter?.name ?? "Sin capítulos"} action={<form><input name="q" defaultValue={query.q} placeholder="Buscar rubro" className="h-9 rounded-md border px-3 text-sm" /><input type="hidden" name="capitulo" value={chapter?.id ?? ""} /></form>}>
            <DataTable headers={["Código", "Rubro", "Unidad", "Cantidad", "P. unitario", "Total", ""]}>
              {rubros.map((item) => {
                const price = data.priced.rubros.find((row) => row.id === item.id);
                return (
                  <tr key={item.id} className="border-b border-border">
                    <td className="px-2 py-2">{item.code}</td>
                    <td className="px-2 py-2"><a href={`?capitulo=${chapter?.id}&rubro=${item.id}`}>{item.name}</a>{item.is_auxiliary ? " · auxiliar" : ""}{item.is_subcontract ? " · subcontrato" : ""}</td>
                    <td className="px-2 py-2">{item.unit}</td>
                    <td className="px-2 py-2 tabular-nums">{item.quantity}</td>
                    <td className="px-2 py-2"><Money value={price?.unitPrice ?? 0} /></td>
                    <td className="px-2 py-2"><Money value={price?.total ?? 0} /></td>
                    <td className="px-2 py-2">
                      {editable ? (
                        <form action={moveAction} className="flex gap-1">
                          <input type="hidden" name="projectId" value={id} /><input type="hidden" name="table" value="project_rubros" /><input type="hidden" name="id" value={item.id} /><input type="hidden" name="parent" value="chapter_id" />
                          <button name="direction" value="-1" className="text-xs">Subir</button>
                          <button name="direction" value="1" className="text-xs">Bajar</button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </DataTable>
            {editable && chapter ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <form action={addRubroAction} className="space-y-2">
                  <input type="hidden" name="projectId" value={id} /><input type="hidden" name="chapterId" value={chapter.id} />
                  <Field label="Desde el catálogo"><Select name="catalogId"><option value="">Crear en blanco</option>{data.catalogRubros.map((item) => <option key={item.id} value={item.id}>{item.code} {item.name}</option>)}</Select></Field>
                  <TextField label="Nombre, si no usa catálogo" name="name" />
                  <TextField label="Unidad" name="unit" defaultValue="m3" />
                  <Submit>Agregar rubro</Submit>
                </form>
              </div>
            ) : null}
          </Panel>
          {rubro ? (
            <Panel title={`APU · ${rubro.name}`}>
              <p className="mb-3 text-sm">Equipo <Money value={priced?.components.equipment ?? 0} /> · Mano de obra <Money value={priced?.components.labor ?? 0} /> · Material <Money value={priced?.components.material ?? 0} /> · Transporte <Money value={priced?.components.transport ?? 0} /> · Herramienta menor <Money value={priced?.components.minorTool ?? 0} /></p>
              <p className="mb-3 text-sm">Costo directo <Money value={priced?.direct ?? 0} /> · Indirecto <Money value={priced?.indirect ?? 0} /> · Precio unitario <Money value={priced?.unitPrice ?? 0} /> · Total <Money value={priced?.total ?? 0} /></p>
              {editable ? (
                <form action={updateRubroAction} className="mb-4 grid gap-3 md:grid-cols-4">
                  <input type="hidden" name="projectId" value={id} /><input type="hidden" name="id" value={rubro.id} /><input type="hidden" name="chapterId" value={chapter?.id} />
                  <TextField label="Código" name="code" defaultValue={rubro.code} />
                  <TextField label="Nombre" name="name" defaultValue={rubro.name} required />
                  <TextField label="Unidad" name="unit" defaultValue={rubro.unit} />
                  <TextField label="Cantidad" name="quantity" defaultValue={rubro.quantity} hint="Volumen de obra." />
                  <TextField label="Rendimiento" name="yield_rate" defaultValue={rubro.yield_rate} hint="Unidad por hora. Las horas son 1 / rendimiento." />
                  <TextField label="Herramienta menor del rubro (%)" name="minor_tool_percent" defaultValue={rubro.minor_tool_percent} />
                  <Field label="Subcontrato"><Select name="is_subcontract" defaultValue={rubro.is_subcontract ? "si" : "no"}><option value="no">No</option><option value="si">Sí, usar valor propuesto</option></Select></Field>
                  <TextField label="Valor propuesto" name="proposed_value" defaultValue={rubro.proposed_value} />
                  <Field label="Auxiliar"><Select name="is_auxiliary" defaultValue={rubro.is_auxiliary ? "si" : "no"}><option value="no">No</option><option value="si">Sí, un solo nivel</option></Select></Field>
                  <Field label="Origen si es subcontrato"><Select name="origin" defaultValue={rubro.origin}><option>EP</option><option>NP</option><option>ND</option></Select></Field>
                  <div className="flex items-end gap-2"><Submit>Guardar rubro</Submit></div>
                </form>
              ) : null}
              <DataTable headers={["Tipo", "Insumo", "Cantidad", "Precio", "Costo", "Origen", "CPC", ""]}>
                {lines.map((line) => {
                  const cost = priced?.lines.find((item) => item.id === line.id);
                  return (
                    <tr key={line.id} className="border-b border-border">
                      <td className="px-2 py-2">{line.kind}</td>
                      <td className="px-2 py-2">{line.name}</td>
                      <td className="px-2 py-2" colSpan={6}>
                        {editable ? (
                          <form action={updateLineAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="projectId" value={id} /><input type="hidden" name="id" value={line.id} /><input type="hidden" name="chapterId" value={chapter?.id} /><input type="hidden" name="rubroId" value={rubro.id} />
                            <input name="quantity" defaultValue={line.quantity} className="h-8 w-24 rounded border px-2 text-sm" />
                            <input name="unit_price" defaultValue={line.unit_price} className="h-8 w-24 rounded border px-2 text-sm" />
                            <span className="w-20 text-right"><Money value={cost?.cost ?? 0} /></span>
                            <Select name="origin" defaultValue={line.origin} className="w-20"><option>EP</option><option>NP</option><option>ND</option></Select>
                            <input name="cpc_code" defaultValue={line.cpc_code} className="h-8 w-28 rounded border px-2 text-sm" />
                            <Submit variant="secondary">Actualizar</Submit>
                          </form>
                        ) : <span><Money value={cost?.cost ?? 0} /></span>}
                      </td>
                    </tr>
                  );
                })}
              </DataTable>
              {editable ? (
                <form action={addLineAction} className="mt-4 grid gap-3 md:grid-cols-4">
                  <input type="hidden" name="projectId" value={id} /><input type="hidden" name="chapterId" value={chapter?.id} /><input type="hidden" name="rubroId" value={rubro.id} />
                  <Field label="Insumo del catálogo o auxiliar"><Select name="ref"><option value="">Escribir uno nuevo</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></Field>
                  <TextField label="Nombre manual" name="name" />
                  <TextField label="Cantidad o rendimiento" name="quantity" defaultValue="1" />
                  <TextField label="Precio, si es manual" name="unit_price" />
                  <Field label="Tipo manual"><Select name="kind"><option value="material">Material</option><option value="labor">Mano de obra</option><option value="equipment">Equipo</option><option value="transport">Transporte</option></Select></Field>
                  <Field label="Origen"><Select name="origin"><option>EP</option><option>ND</option><option>NP</option></Select></Field>
                  <TextField label="CPC" name="cpc_code" />
                  <div className="flex items-end"><Submit>Agregar insumo</Submit></div>
                </form>
              ) : null}
              {editable ? (
                <form action={removeBudgetAction} className="mt-3"><input type="hidden" name="projectId" value={id} /><input type="hidden" name="table" value="project_rubros" /><input type="hidden" name="id" value={rubro.id} /><Submit variant="danger">Eliminar rubro</Submit></form>
              ) : null}
            </Panel>
          ) : null}
          {editable ? (
            <Panel title="Actualizar insumos">
              <form action={priceToolsAction} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="projectId" value={id} />
                <Field label="Operación">
                  <Select name="tool">
                    <option value="refresh">Actualizar desde mantenimiento, personal o histórico</option>
                    <option value="bump">Incrementar un porcentaje</option>
                    <option value="replace">Reemplazar por código o nombre</option>
                    <option value="import">Traer capítulos de otra obra</option>
                  </Select>
                </Field>
                <Field label="Origen de precios"><Select name="source"><option value="maintenance">Precios actuales del esquema</option><option value="personal">Precios personales</option><option value="snapshot">Histórico</option></Select></Field>
                <Field label="Histórico"><Select name="snapshotId"><option value="">Ninguno</option>{data.snapshots.map((item) => <option key={item.id} value={item.id}>{item.captured_on} · {item.note}</option>)}</Select></Field>
                <TextField label="Porcentaje de incremento" name="percent" defaultValue="0" />
                <TextField label="Familia del incremento" name="family" hint="material, labor, equipment o transport. Vacío aplica a todos." />
                <TextField label="Buscar insumo" name="query" />
                <Field label="Reemplazo"><Select name="catalogId"><option value="">Elegir</option>{data.materials.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
                <input type="hidden" name="kind" value="material" />
                <Field label="Obra de origen"><Select name="sourceId"><option value="">Elegir</option>{data.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="includeCatalog" value="si" /> Volcar rubros importados al catálogo</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="family" value="material" defaultChecked /> Material</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="family" value="labor" defaultChecked /> Mano de obra</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="family" value="equipment" defaultChecked /> Equipo</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="family" value="transport" defaultChecked /> Transporte</label>
                <Submit>Aplicar</Submit>
              </form>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
