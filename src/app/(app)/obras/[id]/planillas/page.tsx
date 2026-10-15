import { advanceAction, certificateAction, certificateLineAction, deductionAction, removeExecutionAction } from "@/app/actions";
import { Field, Money, Notice, Panel, Submit, TextField } from "@/components/kit";
import { Button, Select } from "@/components/ui";
import { projectBundle } from "@/lib/domain";
import { adjustedValue } from "@/lib/engine/budget";
import { dec, formatMoney } from "@/lib/engine/money";

export default async function CertificatesPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aviso?: string; planilla?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const data = await projectBundle(id);
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  const certificate = data.certificates.find((item) => item.id === query.planilla) ?? data.certificates[0];
  const lines = data.certificateLines.filter((line) => line.certificate_id === certificate?.id);
  const progress = lines.reduce((sum, line) => {
    const price = data.priced.rubros.find((item) => item.id === line.rubro_id)?.unitPrice ?? "0";
    return sum.plus(dec(line.quantity_period).mul(dec(price)));
  }, dec(0));
  const factor = data.polynomial.valid ? data.polynomial.factor : "1";
  const readjusted = dec(adjustedValue(progress.toFixed(6), factor));
  const amortization = progress.mul(dec(certificate?.amortization_percent ?? 0)).div(100);
  const deductions = data.deductions.reduce((sum, item) => sum.plus(item.mode === "percent" ? progress.mul(dec(item.amount)).div(100) : dec(item.amount)), dec(0));
  const payable = readjusted.minus(amortization).minus(deductions);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Planillas</h1>
      <Notice message={query.aviso} />
      <Panel title="Anticipo y deducibles">
        <ul className="mb-3 text-sm">
          {data.advances.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-2">
              <span>{item.advance_date}: <Money value={item.amount} /> reajustado <Money value={adjustedValue(item.amount, factor)} /> · {item.note}</span>
              {editable ? (
                <form action={removeExecutionAction}>
                  <input type="hidden" name="projectId" value={id} />
                  <input type="hidden" name="table" value="contract_advances" />
                  <input type="hidden" name="id" value={item.id} />
                  <Button type="submit" variant="danger" className="h-8">Quitar anticipo</Button>
                </form>
              ) : null}
            </li>
          ))}
          {data.deductions.map((item) => <li key={item.id}>{item.name}: {item.amount} {item.mode === "percent" ? "%" : "USD"}</li>)}
        </ul>
        {editable ? (
          <div className="grid gap-4 md:grid-cols-2">
            <form action={advanceAction} className="space-y-4">
              <input type="hidden" name="projectId" value={id} />
              <TextField label="Anticipo (USD)" name="amount" type="number" required />
              <TextField label="Fecha" name="advance_date" type="date" />
              <TextField label="Nota" name="note" placeholder="Ejemplo: anticipo contractual" />
              <Submit pending="Registrando…">Registrar anticipo</Submit>
            </form>
            <form action={deductionAction} className="space-y-4">
              <input type="hidden" name="projectId" value={id} />
              <TextField label="Deducible" name="name" required placeholder="Ejemplo: retención" />
              <Field label="Forma" required>
                <Select name="mode" defaultValue="amount">
                  <option value="amount">Valor fijo en USD</option>
                  <option value="percent">Porcentaje del avance</option>
                </Select>
              </Field>
              <TextField label="Valor" name="amount" type="number" required />
              <Submit pending="Registrando…">Registrar deducible</Submit>
            </form>
          </div>
        ) : null}
      </Panel>
      <Panel title="Avance">
        {editable ? <form action={certificateAction} className="mb-4 flex gap-2"><input type="hidden" name="projectId" value={id} /><TextField label="Período" name="period_label" /><Submit>Nueva planilla</Submit></form> : null}
        <div className="mb-3 flex flex-wrap gap-2 text-sm">{data.certificates.map((item) => <a key={item.id} className={item.id === certificate?.id ? "font-semibold text-primary" : ""} href={`?planilla=${item.id}`}>Planilla {item.number}</a>)}</div>
        {certificate ? (
          <div className="space-y-3">
            {lines.map((line) => {
              const rubro = data.rubros.find((item) => item.id === line.rubro_id);
              const price = data.priced.rubros.find((item) => item.id === line.rubro_id)?.unitPrice ?? "0";
              return (
                <form key={line.id} action={certificateLineAction} className="flex flex-wrap items-end gap-2 text-sm">
                  <input type="hidden" name="projectId" value={id} /><input type="hidden" name="id" value={line.id} /><input type="hidden" name="certificateId" value={certificate.id} />
                  <span className="w-64">{rubro?.name}</span>
                  <span>Anterior {line.quantity_previous}</span>
                  <TextField label="Cantidad del período" name="quantity" defaultValue={line.quantity_period} />
                  <span><Money value={dec(line.quantity_period).mul(dec(price)).toFixed(6)} /></span>
                  {editable ? <Submit variant="secondary">Guardar</Submit> : null}
                </form>
              );
            })}
            {editable ? (
              <form action={certificateLineAction} className="flex items-end gap-2">
                <input type="hidden" name="projectId" value={id} /><input type="hidden" name="certificateId" value={certificate.id} /><input type="hidden" name="id" value={lines[0]?.id ?? ""} /><input type="hidden" name="quantity" value={lines[0]?.quantity_period ?? "0"} />
                <TextField label="Amortización del anticipo (%)" name="amortization" defaultValue={certificate.amortization_percent} />
                <Submit variant="secondary">Guardar amortización</Submit>
              </form>
            ) : null}
            <p className="text-sm">Avance {formatMoney(progress)} · Reajuste {formatMoney(readjusted.minus(progress))} · Amortización {formatMoney(amortization)} · Deducibles {formatMoney(deductions)} · A pagar {formatMoney(payable)}</p>
            {!data.polynomial.valid ? <p className="text-sm text-warning-foreground">La fórmula no suma uno, así que el reajuste de esta planilla queda en cero hasta corregir los coeficientes.</p> : null}
          </div>
        ) : <p className="text-sm text-muted-foreground">Todavía no hay planillas.</p>}
      </Panel>
    </div>
  );
}
