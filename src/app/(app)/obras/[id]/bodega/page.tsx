import { movementAction, removeMovementAction } from "@/app/actions";
import { DataTable, Field, Money, Panel, Submit, TextField } from "@/components/kit";
import { SavingForm } from "@/components/saving-form";
import { Select } from "@/components/ui";
import { projectBundle } from "@/lib/domain";
import { dec, formatMoney } from "@/lib/engine/money";

export default async function WarehousePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ desde?: string; hasta?: string; material?: string; rubro?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const data = await projectBundle(id, "bodega");
  const canWrite = data.session.role === "admin" || data.session.role === "bodega";
  const movements = data.movements.filter((move) => {
    if (query.desde && move.movement_date < query.desde) return false;
    if (query.hasta && move.movement_date > query.hasta) return false;
    if (query.material && !move.material_name.toLowerCase().includes(query.material.toLowerCase())) return false;
    if (query.rubro && move.rubro_id !== query.rubro) return false;
    return true;
  });
  const names = [...new Set(data.lines.filter((line) => line.kind === "material").map((line) => line.name))];
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Bodega</h1>
      <form className="no-print flex flex-wrap gap-2">
        <input type="date" name="desde" defaultValue={query.desde} className="h-9 rounded border px-2" />
        <input type="date" name="hasta" defaultValue={query.hasta} className="h-9 rounded border px-2" />
        <input name="material" defaultValue={query.material} placeholder="Material" className="h-9 rounded border px-2" />
        <Select name="rubro" defaultValue={query.rubro}><option value="">Todos los rubros</option>{data.rubros.map((rubro) => <option key={rubro.id} value={rubro.id}>{rubro.name}</option>)}</Select>
        <Submit variant="secondary">Filtrar</Submit>
      </form>
      <Panel title="Presupuestado y real">
        <DataTable headers={["Material", "Presupuestado", "Ingresos", "Salidas", "Saldo"]}>
          {names.map((name) => {
            const budget = data.rubros.filter((rubro) => !rubro.is_auxiliary).reduce((sum, rubro) => {
              const qty = data.lines.filter((line) => line.rubro_id === rubro.id && line.name === name && line.kind === "material").reduce((inner, line) => inner.plus(dec(line.quantity).mul(dec(rubro.quantity))), dec(0));
              return sum.plus(qty);
            }, dec(0));
            const entries = data.movements.filter((move) => move.material_name === name && move.kind === "in").reduce((sum, move) => sum.plus(dec(move.quantity)), dec(0));
            const outs = data.movements.filter((move) => move.material_name === name && move.kind === "out").reduce((sum, move) => sum.plus(dec(move.quantity)), dec(0));
            return <tr key={name} className="border-b border-border"><td className="px-2 py-2">{name}</td><td className="px-2 py-2">{formatMoney(budget, 4)}</td><td className="px-2 py-2">{formatMoney(entries, 4)}</td><td className="px-2 py-2">{formatMoney(outs, 4)}</td><td className="px-2 py-2">{formatMoney(entries.minus(outs), 4)}</td></tr>;
          })}
        </DataTable>
      </Panel>
      <Panel title="Movimientos">
        <DataTable headers={["Fecha", "Tipo", "Material", "Rubro", "Cantidad", "Precio", "Factura", "Proveedor", ""]}>
          {movements.map((move) => (
            <tr key={move.id} className="border-b border-border">
              <td className="px-2 py-2">{move.movement_date}</td>
              <td className="px-2 py-2">{move.kind === "in" ? "Ingreso" : "Salida"}</td>
              <td className="px-2 py-2">{move.material_name}</td>
              <td className="px-2 py-2">{data.rubros.find((rubro) => rubro.id === move.rubro_id)?.name}</td>
              <td className="px-2 py-2">{move.quantity}</td>
              <td className="px-2 py-2"><Money value={move.unit_price} /></td>
              <td className="px-2 py-2">{move.invoice}</td>
              <td className="px-2 py-2">{move.supplier_name}</td>
              <td className="px-2 py-2">{canWrite ? (
                <SavingForm action={removeMovementAction} confirm="¿Quitar este movimiento de bodega?" pending="Quitando…">
                  <input type="hidden" name="projectId" value={id} />
                  <input type="hidden" name="id" value={move.id} />
                  <Submit variant="danger" pending="Quitando…" className="h-9">Quitar</Submit>
                </SavingForm>
              ) : null}</td>
            </tr>
          ))}
        </DataTable>
        {canWrite ? (
          <SavingForm action={movementAction} pending="Registrando…" className="mt-4 space-y-4 border-t border-border pt-4">
            <h3 className="text-sm font-medium">Registrar movimiento</h3>
            <input type="hidden" name="projectId" value={id} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo" required>
                <Select name="kind" defaultValue="in">
                  <option value="in">Ingreso contra el análisis</option>
                  <option value="out">Salida al rubro ejecutado</option>
                </Select>
              </Field>
              <TextField label="Fecha" name="movement_date" type="date" />
              <TextField label="Material" name="material_name" required placeholder="Como figura en el análisis" />
              <Field label="Rubro" required>
                <Select name="rubro_id" required defaultValue="">
                  <option value="">Seleccione</option>
                  {data.rubros.map((rubro) => <option key={rubro.id} value={rubro.id}>{rubro.name}</option>)}
                </Select>
              </Field>
              <TextField label="Cantidad" name="quantity" type="number" required />
              <TextField label="Precio unitario" name="unit_price" type="number" />
              <TextField label="Factura" name="invoice" />
              <TextField label="Proveedor" name="supplier_name" />
            </div>
            <div className="border-t border-border pt-4">
              <Submit pending="Registrando…">Registrar movimiento</Submit>
            </div>
          </SavingForm>
        ) : null}
      </Panel>
    </div>
  );
}
