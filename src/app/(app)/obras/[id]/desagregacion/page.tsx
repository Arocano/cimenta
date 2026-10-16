import { updateLineAction } from "@/app/actions";
import { DataTable, Money, Panel, Submit } from "@/components/kit";
import { SavingForm } from "@/components/saving-form";
import { Select } from "@/components/ui";
import { projectBundle } from "@/lib/domain";
import { formatMoney } from "@/lib/engine/money";

export default async function DisaggregationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await projectBundle(id, "desagregacion");
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Desagregación tecnológica</h1>
      <p className="text-sm">VAE de la obra: {formatMoney(data.priced.vaePercent)}%. EP aporta 100 %, ND 40 % y NP 0 %. {data.threshold ? `Umbral ${data.threshold.name}: ${data.threshold.percent}%. ${data.vaeOk ? "La obra alcanza el umbral de trabajo." : "La obra no alcanza el umbral. Revise origen o composición."}` : "No hay umbral cargado."}</p>
      <p className="text-sm text-muted-foreground">{data.threshold?.note} Cimenta calcula y reporta; no declara el VAE ante el SERCOP.</p>
      <Panel title="Componentes">
        <DataTable headers={["Rubro", "Insumo", "Origen", "CPC", "Costo", ""]}>
          {data.rubros.filter((rubro) => !rubro.is_auxiliary).flatMap((rubro) => data.lines.filter((line) => line.rubro_id === rubro.id).map((line) => {
            const cost = data.priced.rubros.find((item) => item.id === rubro.id)?.lines.find((item) => item.id === line.id);
            return (
              <tr key={line.id} className="border-b border-border">
                <td className="px-2 py-2">{rubro.name}</td>
                <td className="px-2 py-2">{line.name}</td>
                <td className="px-2 py-2" colSpan={4}>
                  <SavingForm action={updateLineAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="projectId" value={id} /><input type="hidden" name="id" value={line.id} /><input type="hidden" name="section" value="desagregacion" /><input type="hidden" name="quantity" value={line.quantity} /><input type="hidden" name="unit_price" value={line.unit_price} /><input type="hidden" name="rubroId" value={rubro.id} />
                    <Select name="origin" defaultValue={line.origin} className="w-24" disabled={!editable}><option>EP</option><option>ND</option><option>NP</option></Select>
                    <input name="cpc_code" defaultValue={line.cpc_code} list="cpcs" className="h-9 w-36 rounded-md border px-2 text-sm" />
                    <span className="w-24 text-right"><Money value={cost?.cost ?? 0} /></span>
                    {editable ? <Submit variant="secondary">Guardar</Submit> : null}
                  </SavingForm>
                </td>
              </tr>
            );
          }))}
        </DataTable>
        <datalist id="cpcs">{data.cpc.map((item) => <option key={item.id} value={String(item.code)}>{String(item.description)}</option>)}</datalist>
      </Panel>
    </div>
  );
}
