import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/registro";
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const { response, user } = await updateSession(request);
    if (!user && !isAuthPage) return NextResponse.redirect(new URL("/login", request.url));
    if (user && isAuthPage) return NextResponse.redirect(new URL("/", request.url));
    return response;
  }
  const signedIn = Boolean(request.cookies.get("cimenta_uid")?.value);
  if (!signedIn && !isAuthPage) return NextResponse.redirect(new URL("/login", request.url));
  if (signedIn && isAuthPage) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
