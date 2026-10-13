import { loginAction } from "@/app/actions";
import { Notice, TextField } from "@/components/kit";
import { Button, Card } from "@/components/ui";
import Link from "next/link";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const query = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <p className="font-serif text-4xl text-primary">Cimenta</p>
      <p className="mb-6 text-stone-600">La base económica de la obra: presupuesto, precios unitarios y control.</p>
      <Card className="space-y-4 p-5">
        <Notice message={query.aviso} />
        <form action={loginAction} className="space-y-3">
          <TextField label="Correo" name="email" type="email" required />
          <TextField label="Clave" name="password" type="password" required />
          <Button type="submit" className="w-full">Entrar</Button>
        </form>
        <p className="text-sm">¿Primera vez? <Link className="text-primary underline" href="/registro">Crear organización</Link></p>
      </Card>
    </main>
  );
}
