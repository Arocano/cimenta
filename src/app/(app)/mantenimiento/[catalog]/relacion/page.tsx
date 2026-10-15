import { linkSupplierAction } from "@/app/actions";
import { secondaryLink } from "@/components/catalog-record";
import { Field, Notice, Panel, Submit } from "@/components/kit";
import { Select } from "@/components/ui";
import { orgCatalog } from "@/lib/domain";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export default async function LinkSupplierPage({ params, searchParams }: { params: Promise<{ catalog: string }>; searchParams: Promise<{ aviso?: string }> }) {
  const { catalog } = await params;
  const query = await searchParams;
  if (catalog !== "materiales") notFound();
  const data = await orgCatalog();
  const back = "/mantenimiento/materiales";
  if (data.session.role !== "admin" && data.session.role !== "presupuestador") redirect(back);
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Relacionar proveedor</h1>
      <Notice message={query.aviso} />
      <Panel title="Material y proveedor">
        <form action={linkSupplierAction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Material" required>
              <Select name="material_id" required defaultValue="">
                <option value="">Seleccione</option>
                {data.materials.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}
              </Select>
            </Field>
            <Field label="Proveedor" required>
              <Select name="supplier_id" required defaultValue="">
                <option value="">Seleccione</option>
                {data.suppliers.map((item) => <option key={String(item.id)} value={String(item.id)}>{String(item.name)}</option>)}
              </Select>
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Submit pending="Relacionando…">Relacionar</Submit>
            <Link href={back} className={secondaryLink}>Cancelar</Link>
          </div>
        </form>
      </Panel>
      <Panel title="Relaciones actuales">
        {data.links.length ? (
          <ul className="divide-y divide-border text-sm">
            {data.links.map((link) => (
              <li key={String(link.id)} className="py-2">
                {String(data.materials.find((item) => item.id === link.material_id)?.name ?? "Material")}
                {" · "}
                {String(data.suppliers.find((item) => item.id === link.supplier_id)?.name ?? "Proveedor")}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Todavía no hay materiales ligados a un proveedor.</p>}
      </Panel>
    </div>
  );
}
