import { logoutAction } from "@/app/actions";
import { Button, Card } from "@/components/ui";
import { requireSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PendingPage() {
  const session = await requireSession({ allowInactive: true });
  if (session.orgActive || session.isPlatformAdmin) redirect("/");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <p className="font-serif text-4xl text-primary">Cimenta</p>
      <Card className="mt-4 space-y-4 p-5">
        <h1 className="font-serif text-2xl">Organización inactiva</h1>
        <p className="text-sm text-stone-600">
          {session.orgName} todavía no puede usar el sistema. Cuando el administrador de la plataforma la active, entra de nuevo con este mismo correo.
        </p>
        <form action={logoutAction}><Button type="submit" variant="secondary">Salir</Button></form>
        <p className="text-sm"><Link className="text-primary underline" href="/login">Volver al ingreso</Link></p>
      </Card>
    </main>
  );
}
