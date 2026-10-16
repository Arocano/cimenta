import { saveMemoAction, saveSymbolAction } from "@/app/actions";
import { DataTable, Notice, Panel, Submit } from "@/components/kit";
import { SavingForm } from "@/components/saving-form";
import { Textarea } from "@/components/ui";
import { projectBundle } from "@/lib/domain";
import { formatMoney } from "@/lib/engine/money";

export default async function AdjustmentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aviso?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const data = await projectBundle(id, "reajuste");
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Reajuste</h1>
      <Notice message={query.aviso} />
      <p className="text-sm">Los coeficientes {data.polynomial.valid ? "suman uno" : `suman ${data.polynomial.coefficientsSum} y deben sumar uno`}. Factor de referencia {data.polynomial.factor}. Un valor de 1.000 se reajusta a {formatMoney(data.adjustedValue("1000", data.polynomial.factor))}.</p>
      <Panel title="Símbolos y fórmula">
        <DataTable headers={["Símbolo", "Peso", "Coeficiente", "Índice base", "Índice del período", ""]}>
          {data.symbols.map((symbol) => (
            <tr key={symbol.id} className="border-b border-border">
              <td className="px-2 py-2" colSpan={6}>
                <SavingForm action={saveSymbolAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="projectId" value={id} /><input type="hidden" name="symbolId" value={symbol.id} />
                  <span className="w-40">{symbol.code} · {symbol.name}</span>
                  <span className="w-24 tabular-nums">{data.weights.find((item) => item.id === symbol.id)?.weight}</span>
                  <input name="coefficient" defaultValue={data.terms.find((item) => item.symbol_id === symbol.id)?.coefficient} className="h-8 w-24 rounded border px-2" />
                  <input name="base" defaultValue={data.indices.find((item) => item.symbol_id === symbol.id && item.kind === "base")?.value} className="h-8 w-24 rounded border px-2" />
                  <input name="period" defaultValue={data.indices.find((item) => item.symbol_id === symbol.id && item.kind === "period")?.value} className="h-8 w-24 rounded border px-2" />
                  {editable ? <Submit variant="secondary">Guardar</Submit> : null}
                </SavingForm>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Panel title="Cuadrilla tipo">
        <ul className="text-sm">{data.crew.map((row) => <li key={row.id}>{row.id}: peso {row.weight}</li>)}</ul>
        {data.crew.length === 0 ? <p className="text-sm text-muted-foreground">Agregue mano de obra al presupuesto para calcular la cuadrilla.</p> : null}
      </Panel>
      <Panel title="Informe técnico">
        <SavingForm action={saveMemoAction} className="space-y-3">
          <input type="hidden" name="projectId" value={id} />
          <Textarea name="body" defaultValue={String(data.memo?.body ?? "")} placeholder="Datos del informe asociado al reajuste" />
          {editable ? <Submit>Guardar informe y cuadrilla</Submit> : null}
        </SavingForm>
      </Panel>
    </div>
  );
}
