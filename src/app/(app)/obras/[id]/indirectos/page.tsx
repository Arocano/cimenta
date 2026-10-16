import { addIndirectAction, saveIndirectAction } from "@/app/actions";
import { IndirectFields } from "@/components/indirect-fields";
import { Money, Notice, Panel, Submit, TextField } from "@/components/kit";
import { SavingForm } from "@/components/saving-form";
import { Button } from "@/components/ui";
import { projectBundle } from "@/lib/domain";
import { formatMoney } from "@/lib/engine/money";

export default async function IndirectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aviso?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const data = await projectBundle(id, "indirectos");
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Costos indirectos</h1>
      <Notice message={query.aviso} />
      <p className="text-sm">Porcentaje escrito en la obra: {data.project.indirect_percent}% · Desglose: {formatMoney(data.indirectResult.percent)}% · Total del desglose <Money value={data.indirectResult.total} /></p>
      {!data.indirectsMatch ? <p className="rounded-md border border-warning-border bg-warning px-3 py-2 text-sm text-warning-foreground">El desglose no coincide con el porcentaje general. Elija cuál debe quedar en cada concepto, con el botón correspondiente.</p> : null}
      {data.indirects.map((item) => (
        <Panel key={item.id} title={item.name}>
          <SavingForm action={saveIndirectAction} className="space-y-4">
            <input type="hidden" name="projectId" value={id} /><input type="hidden" name="id" value={item.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Nombre" name="name" defaultValue={item.name} />
              <IndirectFields
                mode={item.mode}
                enabled={item.enabled}
                values={{
                  monthly_cost: item.monthly_cost,
                  months: item.months,
                  direct_total: item.direct_total,
                  percent: item.percent,
                  advance_percent: item.advance_percent,
                  premium_percent: item.premium_percent,
                  guarantee_percent: item.guarantee_percent,
                }}
              />
            </div>
            <p className="text-sm">Valor calculado: <Money value={data.indirectResult.rows.find((row) => row.id === item.id)?.amount ?? 0} /></p>
            {editable ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Submit pending="Guardando…">Guardar concepto</Submit>
                <Button type="submit" name="choice" value="general" variant="secondary">Dejar el porcentaje general</Button>
                <Button type="submit" name="choice" value="breakdown" variant="secondary">Adoptar este desglose</Button>
              </div>
            ) : null}
          </SavingForm>
        </Panel>
      ))}
      {editable ? (
        <Panel title="Nuevo concepto">
          <SavingForm action={addIndirectAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="projectId" value={id} />
            <div className="min-w-64 flex-1"><TextField label="Nombre" name="name" required placeholder="Ejemplo: residente de obra" /></div>
            <Submit pending="Agregando…">Agregar concepto</Submit>
          </SavingForm>
        </Panel>
      ) : null}
    </div>
  );
}
