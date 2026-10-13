import { templateWorkbook } from "@/lib/files";

export async function GET() {
  const file = await templateWorkbook();
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=plantilla-cimenta.xlsx",
    },
  });
}
