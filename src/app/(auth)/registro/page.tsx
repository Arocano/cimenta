import { registerAction } from "@/app/actions";
import { Notice, TextField } from "@/components/kit";
import { PasswordField } from "@/components/password-field";
import { PendingNote, Submit } from "@/components/submit-button";
import { Card } from "@/components/ui";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ aviso?: string; invitacion?: string }> }) {
  const query = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-16">
      <Link href="/login" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Ingreso
      </Link>
      <p className="font-serif text-4xl text-primary">Cimenta</p>
      <Card className="mt-4 space-y-5 p-6">
        <Notice message={query.aviso} />
        <form action={registerAction} className="space-y-4">
          <TextField label="Nombre" name="fullName" required autoComplete="name" placeholder="Nombre y apellido" />
          <TextField label="Correo" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="nombre@empresa.com" />
          <PasswordField label="Clave" name="password" required autoComplete="new-password" hint="Mínimo 6 caracteres. Puede mostrarla para revisarla antes de crear la cuenta." />
          <TextField label="Organización" name="orgName" autoComplete="organization" placeholder="Empresa, entidad o estudio" hint="Queda inactiva hasta que el administrador de la plataforma la active. Con invitación, puede dejarlo vacío." />
          <input type="hidden" name="invitation" defaultValue={query.invitacion ?? ""} />
          <PendingNote label="Creando la cuenta…" />
          <Submit className="w-full" pending="Creando cuenta…">Crear cuenta</Submit>
        </form>
      </Card>
    </main>
  );
}
