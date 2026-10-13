import { backup } from "@/lib/files";

export async function GET() {
  const body = await backup("org");
  return new Response(body, { headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=cimenta-organizacion.json" } });
}
