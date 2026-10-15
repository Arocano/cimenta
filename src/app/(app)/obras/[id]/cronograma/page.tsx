import { allocationAction, calendarAction, periodsAction, regroupAction, saveTaskAction } from "@/app/actions";
import { GanttChart, InvestmentChart } from "@/components/charts";
import { DataTable, Panel, Submit, TextField } from "@/components/kit";
import { ensureSchedule, projectBundle } from "@/lib/domain";
import { addWorkingDays } from "@/lib/engine/budget";
import { dec, formatMoney } from "@/lib/engine/money";

export default async function SchedulePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ escala?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  await ensureSchedule(id);
  const data = await projectBundle(id);
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  const scale = query.escala || "semana";
  const tasks = data.tasks.map((task) => {
    const rubro = data.rubros.find((item) => item.id === task.rubro_id);
    return { ...task, name: rubro?.name ?? "Rubro", end: addWorkingDays(task.start_date, Number(task.duration_days) || 1, data.hours) };
  });
  const offer = data.rubros.filter((rubro) => !rubro.is_auxiliary);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Cronograma</h1>
      <p className="text-sm">La fecha de inicio de la obra manda a los diagramas. La escala solo cambia la lectura del Gantt.</p>
      <div className="no-print flex gap-2 text-sm">
        {["dia", "semana", "mes", "trimestre", "año"].map((item) => <a key={item} className={item === scale ? "font-semibold text-primary" : ""} href={`?escala=${item}`}>{item}</a>)}
      </div>
      <Panel title="Calendario laboral">
        {data.calendars.map((calendar) => (
          <form key={calendar.id} action={calendarAction} className="mb-4 space-y-4">
            <input type="hidden" name="projectId" value={id} /><input type="hidden" name="calendarId" value={calendar.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Nombre" name="name" defaultValue={calendar.name} />
              <TextField label="Inicio de obra" name="work_start" type="date" defaultValue={data.project.work_start} />
            </div>
            <div>
              <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Horas por día</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {([
                  ["mon", "Lunes"],
                  ["tue", "Martes"],
                  ["wed", "Miércoles"],
                  ["thu", "Jueves"],
                  ["fri", "Viernes"],
                  ["sat", "Sábado"],
                  ["sun", "Domingo"],
                ] as const).map(([day, label]) => <TextField key={day} label={label} name={day} type="number" defaultValue={calendar[day]} />)}
              </div>
            </div>
            {editable ? <div className="border-t border-border pt-4"><Submit pending="Guardando…">Guardar calendario</Submit></div> : null}
          </form>
        ))}
        {editable ? (
          <div className="flex gap-2">
            <form action={regroupAction}><input type="hidden" name="projectId" value={id} /><input type="hidden" name="manual" value="no" /><Submit variant="secondary">Agrupar por capítulo</Submit></form>
            <form action={regroupAction}><input type="hidden" name="projectId" value={id} /><input type="hidden" name="manual" value="si" /><Submit variant="secondary">Rearmar a mano</Submit></form>
          </div>
        ) : null}
      </Panel>
      <Panel title="Gantt">
        <GanttChart tasks={tasks.map((task) => ({ name: task.name, start: task.start_date, end: task.end }))} scale={scale} />
        <DataTable headers={["Rubro", "Grupo", "Inicio", "Días", "Fin", "Responsable", ""]}>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b border-border">
              <td className="px-2 py-2" colSpan={7}>
                <form action={saveTaskAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="projectId" value={id} /><input type="hidden" name="id" value={task.id} /><input type="hidden" name="escala" value={scale} />
                  <span className="w-48">{task.name}</span>
                  <select name="group_id" defaultValue={task.group_id} className="h-8 rounded border px-2 text-sm">{data.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select>
                  <input type="date" name="start_date" defaultValue={task.start_date} className="h-8 rounded border px-2" />
                  <input name="duration_days" defaultValue={task.duration_days} className="h-8 w-16 rounded border px-2" />
                  <span className="w-28 text-xs">{task.end}</span>
                  <input name="responsible" defaultValue={task.responsible} className="h-8 w-36 rounded border px-2" />
                  {editable ? <Submit variant="secondary">Guardar</Submit> : null}
                </form>
              </td>
            </tr>
          ))}
        </DataTable>
      </Panel>
      <Panel title="Cronograma valorado">
        {editable ? (
          <form action={periodsAction} className="mb-3 flex flex-wrap gap-2">
            <input type="hidden" name="projectId" value={id} />
            <TextField label="Días del período" name="days" defaultValue="7" />
            <TextField label="Cantidad" name="count" defaultValue="4" />
            <Submit>Generar períodos</Submit>
          </form>
        ) : null}
        {offer.map((rubro) => {
          const percents = data.allocations.filter((item) => item.rubro_id === rubro.id).map((item) => item.percent);
          const total = data.priced.rubros.find((item) => item.id === rubro.id)?.total ?? "0";
          const programmed = percents.reduce((sum, value) => sum.plus(dec(value)), dec(0));
          return (
            <div key={rubro.id} className="mb-3 border-b border-border pb-3">
              <p className="text-sm font-medium">{rubro.name} · oferta {formatMoney(total)} · programado {formatMoney(programmed)}% {programmed.eq(100) ? "· cierra" : "· debe cerrar en 100 %"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.periods.map((period) => {
                  const allocation = data.allocations.find((item) => item.period_id === period.id && item.rubro_id === rubro.id && !item.is_subperiod);
                  return (
                    <form key={period.id} action={allocationAction} className="flex items-center gap-1 text-xs">
                      <input type="hidden" name="projectId" value={id} /><input type="hidden" name="periodId" value={period.id} /><input type="hidden" name="rubroId" value={rubro.id} />
                      <span>{period.name}</span>
                      <input name="percent" defaultValue={allocation?.percent ?? "0"} className="h-8 w-16 rounded border px-2" />
                      {editable ? <button className="underline">%</button> : null}
                    </form>
                  );
                })}
                {editable ? <form action={allocationAction}><input type="hidden" name="projectId" value={id} /><input type="hidden" name="rubroId" value={rubro.id} /><input type="hidden" name="full" value="si" /><button className="text-xs underline">Cargar 100 % entre inicio y fin</button></form> : null}
              </div>
            </div>
          );
        })}
        <p className="mb-2 text-sm text-muted-foreground">Consulta por componente: cada insumo permanece en su rubro o grupo, sin edición en esta vista.</p>
        <ul className="mb-4 text-sm">{data.lines.slice(0, 12).map((line) => <li key={line.id}>{line.name} · {data.rubros.find((rubro) => rubro.id === line.rubro_id)?.name}</li>)}</ul>
        <InvestmentChart points={data.curve.map((point) => ({ label: point.label, amount: Number(point.amount), cumulative: Number(point.cumulative) }))} />
      </Panel>
    </div>
  );
}
