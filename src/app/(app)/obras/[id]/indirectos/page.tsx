import { addIndirectAction, saveIndirectAction } from "@/app/actions";
import { Money, Notice, Panel, Submit, TextField } from "@/components/kit";
import { Select } from "@/components/ui";
import { projectBundle } from "@/lib/domain";
import { formatMoney } from "@/lib/engine/money";

const modes = [
  ["monthly", "Costo mensual por meses"],
  ["total", "Total directo"],
  ["percent_contract", "Porcentaje del contrato"],
  ["percent_readjustment", "Porcentaje del reajuste"],
  ["percent_capital", "Porcentaje del capital"],
  ["percent_subtotal", "Porcentaje del directo más operación"],
  ["financial", "Anticipo, prima y garantías"],
];

export default async function IndirectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aviso?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const data = await projectBundle(id);
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Costos indirectos</h1>
      <Notice message={query.aviso} />
      <p className="text-sm">Porcentaje escrito en la obra: {data.project.indirect_percent}% · Desglose: {formatMoney(data.indirectResult.percent)}% · Total del desglose <Money value={data.indirectResult.total} /></p>
      {!data.indirectsMatch ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm">El desglose no coincide con el porcentaje general. Elija cuál debe quedar en cada concepto, con el botón correspondiente.</p> : null}
      {data.indirects.map((item) => (
        <Panel key={item.id} title={item.name}>
          <form action={saveIndirectAction} className="grid gap-3 md:grid-cols-4">
            <input type="hidden" name="projectId" value={id} /><input type="hidden" name="id" value={item.id} />
            <TextField label="Nombre" name="name" defaultValue={item.name} />
            <label className="text-sm">Activo<Select name="enabled" defaultValue={item.enabled ? "si" : "no"}><option value="si">Sí</option><option value="no">No</option></Select></label>
            <label className="text-sm md:col-span-2">Cálculo<Select name="mode" defaultValue={item.mode}>{modes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></label>
            <TextField label="Costo por mes" name="monthly_cost" defaultValue={item.monthly_cost} />
            <TextField label="Meses" name="months" defaultValue={item.months} />
            <TextField label="Total directo" name="direct_total" defaultValue={item.direct_total} />
            <TextField label="Porcentaje" name="percent" defaultValue={item.percent} />
            <TextField label="Anticipo %" name="advance_percent" defaultValue={item.advance_percent} />
            <TextField label="Prima %" name="premium_percent" defaultValue={item.premium_percent} />
            <TextField label="Garantías %" name="guarantee_percent" defaultValue={item.guarantee_percent} />
            <p className="text-sm md:col-span-4">Valor: <Money value={data.indirectResult.rows.find((row) => row.id === item.id)?.amount ?? 0} /></p>
            {editable ? (
              <div className="flex flex-wrap gap-2 md:col-span-4">
                <Submit>Guardar concepto</Submit>
                <button name="choice" value="general" className="h-9 rounded-md border px-3 text-sm">Usar el porcentaje general</button>
                <button name="choice" value="breakdown" className="h-9 rounded-md border px-3 text-sm">Usar el desglose</button>
              </div>
            ) : null}
          </form>
        </Panel>
      ))}
      {editable ? (
        <form action={addIndirectAction} className="flex gap-2"><input type="hidden" name="projectId" value={id} /><TextField label="Nuevo concepto" name="name" /><Submit>Agregar</Submit></form>
      ) : null}
    </div>
  );
}
