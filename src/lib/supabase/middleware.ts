import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { response, user: null };
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  if (tokenStillValid(request)) return { response, user: { id: "session" } };
  const { data } = await supabase.auth.getUser();
  return { response, user: data.user };
}

function tokenStillValid(request: NextRequest) {
  const raw = authCookie(request);
  if (!raw) return false;
  try {
    const json = raw.startsWith("base64-") ? decodeBase64Url(raw.slice("base64-".length)) : raw;
    const parsed = JSON.parse(json) as { expires_at?: number; access_token?: string };
    const expiry = typeof parsed.expires_at === "number" ? parsed.expires_at * 1000 : jwtExpiry(parsed.access_token);
    return expiry !== null && expiry - Date.now() > 60_000;
  } catch {
    return false;
  }
}

function authCookie(request: NextRequest) {
  const cookies = request.cookies.getAll().filter((cookie) => cookie.name.includes("-auth-token"));
  const single = cookies.find((cookie) => cookie.name.endsWith("-auth-token"));
  if (single?.value) return single.value;
  const chunks = cookies
    .map((cookie) => {
      const match = cookie.name.match(/\.(\d+)$/);
      return match ? { index: Number(match[1]), value: cookie.value } : null;
    })
    .filter((chunk): chunk is { index: number; value: string } => Boolean(chunk))
    .sort((a, b) => a.index - b.index);
  return chunks.length ? chunks.map((chunk) => chunk.value).join("") : null;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function jwtExpiry(token: string | undefined) {
  if (!token) return null;
  const payload = token.split(".")[1];
  if (!payload) return null;
  const body = JSON.parse(decodeBase64Url(payload)) as { exp?: number };
  return typeof body.exp === "number" ? body.exp * 1000 : null;
}
