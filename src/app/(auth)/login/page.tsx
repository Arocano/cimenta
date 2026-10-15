import { loginAction } from "@/app/actions";
import { Notice, TextField } from "@/components/kit";
import { PasswordField } from "@/components/password-field";
import { PendingNote, Submit } from "@/components/submit-button";
import { Card } from "@/components/ui";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const query = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <p className="font-serif text-4xl text-primary">Cimenta</p>
      <p className="mb-6 text-muted-foreground">La base económica de la obra: presupuesto, precios unitarios y control.</p>
      <Card className="space-y-5 p-6">
        <Notice message={query.aviso} />
        <form action={loginAction} className="space-y-4">
          <TextField label="Correo" name="email" type="email" required autoComplete="username" inputMode="email" placeholder="nombre@empresa.com" />
          <PasswordField label="Clave" name="password" required autoComplete="current-password" />
          <PendingNote label="Comprobando el ingreso…" />
          <Submit className="w-full" pending="Entrando…">Entrar</Submit>
        </form>
        <p className="text-sm">¿Primera vez? <Link className="text-primary underline" href="/registro">Crear organización</Link></p>
      </Card>
    </main>
  );
}
