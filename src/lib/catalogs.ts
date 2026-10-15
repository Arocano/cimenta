import type { TableName } from "@/lib/types";

export type FieldDef = {
  name: string;
  label: string;
  kind?: "text" | "number" | "unit" | "check";
  hint?: string;
  group?: string;
};

export type CatalogKey = "units" | "conversions" | "chapters" | "types" | "rubros" | "equipment" | "cities" | "suppliers" | "materials" | "labor" | "transport" | "cpc" | "thresholds";

export type CatalogConfig = {
  title: string;
  table: TableName;
  key: CatalogKey;
  fields: FieldDef[];
  columns: string[];
  family?: "material" | "labor" | "equipment" | "transport";
};

export const catalogs: Record<string, CatalogConfig> = {
  unidades: {
    title: "Unidades",
    table: "units",
    key: "units",
    columns: ["code", "name"],
    fields: [
      { name: "code", label: "Código", hint: "Como aparece en el rubro: m, m2, m3, h." },
      { name: "name", label: "Nombre" },
    ],
  },
  equivalencias: {
    title: "Equivalencias",
    table: "unit_conversions",
    key: "conversions",
    columns: ["from_qty", "from_unit", "to_qty", "to_unit"],
    fields: [
      { name: "from_qty", label: "Cantidad origen", kind: "number", group: "Origen" },
      { name: "from_unit", label: "Unidad origen", kind: "unit", group: "Origen" },
      { name: "to_qty", label: "Cantidad destino", kind: "number", group: "Destino" },
      { name: "to_unit", label: "Unidad destino", kind: "unit", group: "Destino" },
    ],
  },
  capitulos: {
    title: "Capítulos",
    table: "catalog_chapters",
    key: "chapters",
    columns: ["code", "name", "sort_order"],
    fields: [
      { name: "code", label: "Código" },
      { name: "name", label: "Nombre" },
      { name: "sort_order", label: "Orden", kind: "number", hint: "Número menor aparece primero." },
    ],
  },
  tipos: { title: "Tipos", table: "rubro_types", key: "types", columns: ["name"], fields: [{ name: "name", label: "Nombre" }] },
  rubros: {
    title: "Rubros",
    table: "catalog_rubros",
    key: "rubros",
    columns: ["code", "name", "unit", "chapter_id"],
    fields: [
      { name: "code", label: "Código", group: "Identificación" },
      { name: "name", label: "Nombre", group: "Identificación" },
      { name: "unit", label: "Unidad", kind: "unit", group: "Identificación" },
      { name: "chapter_id", label: "Capítulo", group: "Clasificación" },
      { name: "type_id", label: "Tipo", group: "Clasificación" },
      { name: "yield_rate", label: "Rendimiento", kind: "number", group: "Clasificación", hint: "Unidad de obra por hora." },
    ],
  },
  equipos: {
    title: "Equipos",
    table: "equipment",
    key: "equipment",
    family: "equipment",
    columns: ["code", "name", "hourly_chamber", "yield_rate"],
    fields: [
      { name: "code", label: "Código", group: "Identificación" },
      { name: "name", label: "Nombre", group: "Identificación" },
      { name: "brand", label: "Marca", group: "Identificación" },
      { name: "machine_type", label: "Tipo de máquina", group: "Identificación" },
      { name: "chamber_code", label: "Código de cámara", group: "Identificación" },
      { name: "hourly_chamber", label: "Costo hora cámara", kind: "number", group: "Costo" },
      { name: "hourly_personal", label: "Costo hora personal", kind: "number", group: "Costo" },
      { name: "yield_rate", label: "Rendimiento", kind: "number", group: "Costo", hint: "Unidad de obra por hora." },
      { name: "power", label: "Potencia", kind: "number", group: "Costo" },
      { name: "uses_gasoline", label: "Usa gasolina", kind: "check", group: "Costo" },
    ],
  },
  ciudades: { title: "Ciudades", table: "cities", key: "cities", columns: ["name"], fields: [{ name: "name", label: "Ciudad" }] },
  proveedores: {
    title: "Proveedores",
    table: "suppliers",
    key: "suppliers",
    columns: ["name", "city_id", "address"],
    fields: [
      { name: "name", label: "Nombre" },
      { name: "city_id", label: "Ciudad" },
      { name: "address", label: "Dirección" },
    ],
  },
  materiales: {
    title: "Materiales",
    table: "materials",
    key: "materials",
    family: "material",
    columns: ["code", "name", "unit", "chamber_price", "personal_price"],
    fields: [
      { name: "code", label: "Código", group: "Identificación" },
      { name: "name", label: "Descripción", group: "Identificación" },
      { name: "unit", label: "Unidad", kind: "unit", group: "Identificación" },
      { name: "chamber_price", label: "Precio cámara", kind: "number", group: "Precios" },
      { name: "personal_price", label: "Precio personal", kind: "number", group: "Precios" },
    ],
  },
  "mano-obra": {
    title: "Mano de obra",
    table: "labor_categories",
    key: "labor",
    family: "labor",
    columns: ["code", "name", "hourly_chamber", "hourly_personal"],
    fields: [
      { name: "code", label: "Código", group: "Identificación" },
      { name: "name", label: "Categoría", group: "Identificación" },
      { name: "hourly_chamber", label: "Salario hora cámara", kind: "number", group: "Salario" },
      { name: "hourly_personal", label: "Salario hora personal", kind: "number", group: "Salario" },
    ],
  },
  transporte: {
    title: "Transporte",
    table: "transport_rates",
    key: "transport",
    family: "transport",
    columns: ["code", "name", "unit", "rate_chamber", "rate_personal"],
    fields: [
      { name: "code", label: "Código", group: "Identificación" },
      { name: "name", label: "Nombre", group: "Identificación" },
      { name: "unit", label: "Unidad", kind: "unit", group: "Identificación" },
      { name: "rate_chamber", label: "Tarifa cámara", kind: "number", group: "Tarifas" },
      { name: "rate_personal", label: "Tarifa personal", kind: "number", group: "Tarifas" },
    ],
  },
  cpc: {
    title: "CPC",
    table: "cpc_codes",
    key: "cpc",
    columns: ["code", "description"],
    fields: [
      { name: "code", label: "Código de 9 dígitos", hint: "Sin puntos ni espacios." },
      { name: "description", label: "Descripción" },
    ],
  },
  umbrales: {
    title: "Umbrales VAE",
    table: "vae_thresholds",
    key: "thresholds",
    columns: ["name", "percent"],
    fields: [
      { name: "name", label: "Nombre" },
      { name: "percent", label: "Porcentaje", kind: "number", hint: "Mínimo de componente ecuatoriano para ese procedimiento." },
      { name: "note", label: "Nota" },
    ],
  },
};

export const catalogTitle: Record<string, string> = {
  ...Object.fromEntries(Object.entries(catalogs).map(([slug, config]) => [slug, config.title])),
  historicos: "Históricos",
  depurar: "Eliminar información",
  analisis: "Análisis de rubros",
};

export const kindLabel: Record<string, string> = {
  material: "Material",
  labor: "Mano de obra",
  equipment: "Equipo",
  transport: "Transporte",
  auxiliary: "Auxiliar",
};

export const priceFamilies = [
  ["material", "Materiales"],
  ["labor", "Mano de obra"],
  ["equipment", "Equipos"],
  ["transport", "Transporte"],
] as const;

export const purgeOptions = [
  ["unidades", "Unidades"],
  ["equivalencias", "Equivalencias"],
  ["capitulos", "Capítulos"],
  ["rubros", "Rubros y tipos"],
  ["analisis", "Análisis de rubros"],
  ["equipos", "Equipos"],
  ["materiales", "Materiales"],
  ["mano", "Mano de obra"],
  ["transporte", "Transporte"],
  ["proveedores", "Proveedores"],
  ["ciudades", "Ciudades"],
  ["historicos", "Históricos"],
  ["cpc", "CPC"],
  ["umbrales", "Umbrales VAE"],
] as const;
