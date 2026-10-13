import { reportSheet, wordFrom } from "@/lib/files";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tipo = new URL(request.url).searchParams.get("tipo") || "general";
  const file = await wordFrom(await reportSheet(id, tipo));
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename=cimenta-${tipo}.docx`,
    },
  });
}
