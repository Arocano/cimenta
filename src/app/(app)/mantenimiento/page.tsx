import Link from "next/link";

const items = [
  ["unidades", "Unidades"],
  ["equivalencias", "Equivalencias"],
  ["capitulos", "Capítulos"],
  ["tipos", "Tipos de rubro"],
  ["rubros", "Rubros"],
  ["analisis", "Análisis de rubros"],
  ["equipos", "Equipos"],
  ["ciudades", "Ciudades"],
  ["proveedores", "Proveedores"],
  ["materiales", "Materiales"],
  ["mano-obra", "Mano de obra"],
  ["transporte", "Transporte"],
  ["cpc", "CPC nivel 9"],
  ["umbrales", "Umbrales VAE"],
  ["historicos", "Históricos"],
  ["depurar", "Eliminar información"],
];

export default function MaintenanceHome() {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl">Mantenimiento</h1>
      <p className="text-sm text-stone-600">La base de precios pertenece a la organización y queda disponible para todas las obras. Un registro en uso no se elimina.</p>
      <div className="grid gap-2 md:grid-cols-3">
        {items.map(([href, label]) => <Link key={href} href={`/mantenimiento/${href}`} className="rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent">{label}</Link>)}
      </div>
    </div>
  );
}
