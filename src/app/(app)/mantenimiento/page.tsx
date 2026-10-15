import Link from "next/link";

const groups = [
  {
    title: "Rubros",
    items: [
      ["capitulos", "Capítulos", "Agrupan los rubros de la base."],
      ["tipos", "Tipos de rubro", "Clasificación de cada rubro."],
      ["rubros", "Rubros", "Código, unidad y rendimiento."],
      ["analisis", "Análisis de rubros", "Insumos de cada rubro de la base."],
      ["unidades", "Unidades", "m, m2, m3, hora y el resto de la base."],
      ["equivalencias", "Equivalencias", "Cuántas unidades de origen equivalen a las de destino."],
    ],
  },
  {
    title: "Insumos y precios",
    items: [
      ["materiales", "Materiales", "Precio de cámara y precio personal."],
      ["mano-obra", "Mano de obra", "Salario hora de cada categoría."],
      ["equipos", "Equipos", "Costo hora, rendimiento y potencia."],
      ["transporte", "Transporte", "Tarifa de cámara y tarifa personal."],
      ["proveedores", "Proveedores", "Quién abastece cada material."],
      ["ciudades", "Ciudades", "Ciudad del proveedor."],
      ["historicos", "Históricos", "Foto de los precios en una fecha."],
    ],
  },
  {
    title: "Clasificación",
    items: [
      ["cpc", "CPC nivel 9", "Código de nueve dígitos del insumo."],
      ["umbrales", "Umbrales VAE", "Porcentaje mínimo para el procedimiento."],
    ],
  },
  {
    title: "Administración",
    items: [
      ["depurar", "Eliminar información", "Borra familias de la base. No toca las obras ya copiadas."],
    ],
  },
];

export default function MaintenanceHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Mantenimiento</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">La base de precios pertenece a la organización y queda disponible para todas las obras. Un registro en uso no se elimina.</p>
      </div>
      {groups.map((group) => (
        <section key={group.title} className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{group.title}</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {group.items.map(([href, label, hint]) => (
              <Link key={href} href={`/mantenimiento/${href}`} prefetch className="rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent">
                <span className="block font-medium">{label}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
