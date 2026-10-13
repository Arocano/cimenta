import { projectBundle } from "@/lib/domain";
import { projectXml } from "@/lib/files";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await projectBundle(id);
  const xml = projectXml(data.project.name, data.tasks.map((task) => ({
    name: data.rubros.find((rubro) => rubro.id === task.rubro_id)?.name ?? "Rubro",
    start: task.start_date,
    days: task.duration_days,
  })));
  return new Response(xml, { headers: { "Content-Type": "application/xml", "Content-Disposition": "attachment; filename=cimenta-cronograma.xml" } });
}
