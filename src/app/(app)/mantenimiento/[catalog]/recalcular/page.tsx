import { recalculateAction } from "@/app/actions";
import { secondaryLink } from "@/components/catalog-record";
import { Field, Notice, Panel, Submit } from "@/components/kit";
import { Select } from "@/components/ui";
import { catalogs } from "@/lib/catalogs";
import { orgCatalog } from "@/lib/domain";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function RecalculatePage({ params, searchParams }: { params: Promise<{ catalog: string }>; searchParams: Promise<{ aviso?: string }> }) {
  const { catalog } = await params;
  const query = await searchParams;
  const config = catalogs[catalog];
  if (!config?.family) notFound();
  const data = await orgCatalog();
  const back = `/mantenimiento/${catalog}`;
  if (data.session.role !== "admin" && data.session.role !== "presupuestador") redirect(back);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Recalcular · {config.title}</h1>
      <Notice message={query.aviso} />
      <Panel title="Copiar precios a las obras">
        <p className="mb-4 text-sm text-muted-foreground">Copia estos precios a los análisis de las obras que usan esta familia.</p>
        <form action={recalculateAction} className="space-y-4">
          <input type="hidden" name="family" value={config.family} />
          <input type="hidden" name="back" value={back} />
          <Field label="Esquema de precio">
            <Select name="scheme" defaultValue="chamber">
              <option value="chamber">Precio de cámara</option>
              <option value="personal">Precio personal</option>
            </Select>
          </Field>
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Submit variant="secondary" pending="Recalculando…">Recalcular precios</Submit>
            <Link href={back} className={secondaryLink}>Cancelar</Link>
          </div>
        </form>
      </Panel>
    </div>
  );
}
