import { backup } from "@/lib/files";
import { supabaseConfigured } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await backup("project", id);
  if (supabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.storage.from("respaldos").upload(`${id}/${Date.now()}.json`, body, { contentType: "application/json", upsert: true }).catch(() => undefined);
  }
  return new Response(body, { headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=cimenta-obra.json" } });
}
