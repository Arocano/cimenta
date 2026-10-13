import { registerAction } from "@/app/actions";
import { Notice, TextField } from "@/components/kit";
import { Button, Card } from "@/components/ui";
import Link from "next/link";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ aviso?: string; invitacion?: string }> }) {
  const query = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <p className="font-serif text-4xl text-primary">Cimenta</p>
      <Card className="mt-4 space-y-4 p-5">
        <Notice message={query.aviso} />
        <form action={registerAction} className="space-y-3">
          <TextField label="Nombre" name="fullName" required />
          <TextField label="Correo" name="email" type="email" required />
          <TextField label="Clave" name="password" type="password" required hint="Mínimo 6 caracteres." />
          <TextField label="Organización" name="orgName" hint="Empresa, entidad o estudio. Si entra con invitación, puede dejarlo vacío." />
          <input type="hidden" name="invitation" defaultValue={query.invitacion ?? ""} />
          <Button type="submit" className="w-full">Crear cuenta</Button>
        </form>
        <p className="text-sm"><Link className="text-primary underline" href="/login">Ya tengo cuenta</Link></p>
      </Card>
    </main>
  );
}
