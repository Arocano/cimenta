import { AppShell } from "@/components/app-shell";
import { ROLE_LABEL } from "@/components/kit";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession({ allowInactive: true });
  if (!session.orgActive && !session.isPlatformAdmin) redirect("/pendiente");
  return (
    <AppShell
      orgName={session.orgName}
      roleLabel={ROLE_LABEL[session.role] ?? session.role}
      isPlatformAdmin={session.isPlatformAdmin}
      orgId={session.orgId}
      memberships={session.memberships.map((item) => ({ orgId: item.orgId, orgName: item.orgName }))}
    >
      {children}
    </AppShell>
  );
}
