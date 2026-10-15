import { DataTable } from "@/components/kit";
import { kindLabel } from "@/lib/catalogs";
import { orgCatalog } from "@/lib/domain";
import { notFound } from "next/navigation";

export default async function SnapshotDetailPage({ params }: { params: Promise<{ catalog: string; id: string }> }) {
  const { catalog, id } = await params;
  if (catalog !== "historicos") notFound();
  const data = await orgCatalog();
  const snapshot = data.snapshots.find((item) => String(item.id) === id);
  if (!snapshot) notFound();
  const lines = data.snapshotLines.filter((line) => line.snapshot_id === id);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Foto · {String(snapshot.note || "Sin nota")}</h1>
      {lines.length ? (
        <DataTable headers={["Familia", "Código", "Nombre", "Cámara", "Personal"]}>
          {lines.map((line) => (
            <tr key={String(line.id)} className="border-b border-border">
              <td className="px-2 py-2">{kindLabel[String(line.family)] ?? String(line.family)}</td>
              <td className="px-2 py-2">{String(line.code)}</td>
              <td className="px-2 py-2">{String(line.name)}</td>
              <td className="px-2 py-2 tabular-nums">{String(line.chamber_price)}</td>
              <td className="px-2 py-2 tabular-nums">{String(line.personal_price)}</td>
            </tr>
          ))}
        </DataTable>
      ) : <p className="text-sm text-muted-foreground">Esta foto no tiene líneas.</p>}
    </div>
  );
}
