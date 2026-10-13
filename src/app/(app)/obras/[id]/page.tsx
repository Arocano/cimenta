import { contributorAction, deleteProjectAction, saveProjectAction } from "@/app/actions";
import { DateText, Field, Money, Notice, Panel, Submit, TextField } from "@/components/kit";
import { Select, Textarea } from "@/components/ui";
import { projectBundle } from "@/lib/domain";
import { formatMoney } from "@/lib/engine/money";

export default async function ProjectDataPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aviso?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const data = await projectBundle(id);
  const project = data.project;
  const editable = data.session.role === "admin" || data.session.role === "presupuestador";
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">{project.name}</h1>
          <p className="text-sm text-stone-600">Propuesta <DateText value={project.proposed_date} /> · Total <Money value={data.priced.total} /></p>
        </div>
        {data.session.role === "admin" ? (
          <form action={deleteProjectAction}><input type="hidden" name="id" value={id} /><Submit variant="danger">Eliminar obra</Submit></form>
        ) : null}
      </header>
      <Notice message={query.aviso} />
      <Panel title="Datos generales">
        <form action={saveProjectAction} className="grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={id} />
          <TextField label="Nombre" name="name" defaultValue={project.name} required />
          <TextField label="Fecha propuesta" name="proposed_date" type="date" defaultValue={project.proposed_date} />
          <TextField label="Proponente" name="proponent" defaultValue={project.proponent} />
          <TextField label="Propietario" name="owner_name" defaultValue={project.owner_name} />
          <TextField label="Calculado por" name="calculated_by" defaultValue={project.calculated_by} />
          <TextField label="Revisado por" name="reviewed_by" defaultValue={project.reviewed_by} />
          <TextField label="Provincia" name="province" defaultValue={project.province} />
          <TextField label="Cantón" name="canton" defaultValue={project.canton} />
          <TextField label="Parroquia" name="parish" defaultValue={project.parish} />
          <TextField label="Sector" name="sector" defaultValue={project.sector} />
          <TextField label="Dirección" name="address" defaultValue={project.address} />
          <TextField label="Inicio de obra" name="work_start" type="date" defaultValue={project.work_start} />
          <Field label="Rendimiento" hint="Por rubro usa un rendimiento común. Por insumo, cada mano de obra y equipo trae el suyo.">
            <Select name="yield_mode" defaultValue={project.yield_mode}><option value="rubro">Por rubro</option><option value="insumo">Por insumo</option></Select>
          </Field>
          <Field label="Herramienta menor">
            <Select name="minor_tool_mode" defaultValue={project.minor_tool_mode}><option value="global">Porcentaje global de la mano de obra</option><option value="rubro">Porcentaje por rubro</option></Select>
          </Field>
          <TextField label="Porcentaje de herramienta menor" name="minor_tool_percent" defaultValue={project.minor_tool_percent} />
          <Field label="Transporte de materiales"><Select name="transport_materials" defaultValue={project.transport_materials ? "si" : "no"}><option value="si">Incluir</option><option value="no">Dejar fuera</option></Select></Field>
          <Field label="Transporte de equipos"><Select name="transport_equipment" defaultValue={project.transport_equipment ? "si" : "no"}><option value="si">Incluir</option><option value="no">Dejar fuera</option></Select></Field>
          <Field label="Esquema de precio"><Select name="price_scheme" defaultValue={project.price_scheme}><option value="chamber">Precio de cámara</option><option value="personal">Precio personal</option></Select></Field>
          <TextField label="Indirectos (%)" name="indirect_percent" defaultValue={project.indirect_percent} hint="Al guardar, el presupuesto se recalcula con este porcentaje." />
          <Field label="Aportantes"><Select name="contributors_enabled" defaultValue={project.contributors_enabled ? "si" : "no"}><option value="no">No</option><option value="si">Sí</option></Select></Field>
          <Field label="Umbral VAE">
            <Select name="vae_threshold_id" defaultValue={project.vae_threshold_id}>
              <option value="">Sin umbral</option>
              {data.thresholds.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.percent}%)</option>)}
            </Select>
          </Field>
          <label className="grid gap-1 text-sm md:col-span-2">
            <span className="font-medium">Descripción</span>
            <Textarea name="description" defaultValue={project.description} />
          </label>
          {editable ? <div className="md:col-span-2"><Submit>Guardar datos</Submit></div> : <p className="text-sm text-stone-500">Su rol puede consultar la obra.</p>}
        </form>
      </Panel>
      <Panel title="Resumen">
        <p className="text-sm">Costo directo {formatMoney(data.priced.direct)} · Indirectos {formatMoney(data.priced.indirect)} · Oferta {formatMoney(data.priced.total)}</p>
        <p className="text-sm">VAE {formatMoney(data.priced.vaePercent)}%{data.threshold ? ` · umbral ${data.threshold.percent}% · ${data.vaeOk ? "cumple" : "no alcanza el umbral"}` : ""}</p>
      </Panel>
      {project.contributors_enabled && editable ? (
        <Panel title="Aportantes">
          <ul className="mb-3 text-sm">
            {data.contributors.map((item) => <li key={item.id}>{item.company}: equipo <Money value={item.shares.equipment} />, mano de obra <Money value={item.shares.labor} /></li>)}
          </ul>
          <form action={contributorAction} className="grid gap-3 md:grid-cols-5">
            <input type="hidden" name="projectId" value={id} />
            <TextField label="Empresa" name="company" required />
            <TextField label="% material" name="material_percent" defaultValue="0" />
            <TextField label="% mano de obra" name="labor_percent" defaultValue="0" />
            <TextField label="% equipo" name="equipment_percent" defaultValue="0" />
            <TextField label="% transporte" name="transport_percent" defaultValue="0" />
            <Submit>Agregar</Submit>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
