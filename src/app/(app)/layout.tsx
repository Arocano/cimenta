import { logoutAction, switchOrgAction } from "@/app/actions";
import { ROLE_LABEL } from "@/components/kit";
import { Button } from "@/components/ui";
import { requireSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

const links = [
  ["/", "Obras"],
  ["/mantenimiento", "Mantenimiento"],
  ["/organizacion/usuarios", "Usuarios"],
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession({ allowInactive: true });
  if (!session.orgActive && !session.isPlatformAdmin) redirect("/pendiente");
  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <aside className="no-print flex flex-col bg-stone-950 px-4 py-5 text-stone-100">
        <Link href="/" className="font-serif text-3xl text-orange-200">Cimenta</Link>
        <p className="mt-1 text-xs text-stone-400">{session.orgName}</p>
        <p className="mb-6 text-xs text-stone-500">{ROLE_LABEL[session.role]}</p>
        <nav className="grid gap-1">
          {session.isPlatformAdmin ? (
            <Link href="/plataforma" className="rounded-md px-2 py-2 text-sm hover:bg-stone-800">Plataforma</Link>
          ) : null}
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="rounded-md px-2 py-2 text-sm hover:bg-stone-800">{label}</Link>
          ))}
        </nav>
        <div className="mt-6 space-y-2 text-sm">
          {session.memberships.length > 1 ? (
            <form action={switchOrgAction} className="grid gap-2">
              <select name="orgId" defaultValue={session.orgId} className="h-9 rounded-md bg-stone-900 px-2">
                {session.memberships.map((item) => <option key={item.orgId} value={item.orgId}>{item.orgName}</option>)}
              </select>
              <Button type="submit" variant="secondary">Cambiar organización</Button>
            </form>
          ) : null}
          <form action={logoutAction}><Button type="submit" variant="ghost" className="text-stone-200">Salir</Button></form>
        </div>
      </aside>
      <div className="px-4 py-6 md:px-8">{children}</div>
    </div>
  );
}
