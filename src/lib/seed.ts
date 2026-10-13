import type { Tx } from "./db";
import { todayIso } from "./engine/money";

function id() {
  return crypto.randomUUID();
}

export async function seedCatalog(tx: Tx, orgId: string) {
  const units = [
    ["m", "Metro"],
    ["m2", "Metro cuadrado"],
    ["m3", "Metro cúbico"],
    ["kg", "Kilogramo"],
    ["u", "Unidad"],
    ["h", "Hora"],
    ["km", "Kilómetro"],
    ["saco", "Saco"],
  ];
  for (const [code, name] of units) await tx.insert("units", { org_id: orgId, code, name });
  await tx.insert("unit_conversions", { org_id: orgId, from_qty: "1000", from_unit: "m", to_qty: "1", to_unit: "km" });

  const loja = id();
  const quito = id();
  const gy = id();
  await tx.insert("cities", { id: loja, org_id: orgId, name: "Loja" });
  await tx.insert("cities", { id: quito, org_id: orgId, name: "Quito" });
  await tx.insert("cities", { id: gy, org_id: orgId, name: "Guayaquil" });
  const supplier = id();
  await tx.insert("suppliers", { id: supplier, org_id: orgId, city_id: loja, name: "Cantera del Valle", address: "Vía a Catamayo" });
  await tx.insert("suppliers", { org_id: orgId, city_id: quito, name: "Ferretería Central", address: "Av. Amazonas" });
  await tx.insert("suppliers", { org_id: orgId, city_id: gy, name: "Materiales del Puerto", address: "Vía a Daule" });

  const cemento = id();
  const arena = id();
  const ripio = id();
  const ladrillo = id();
  const agua = id();
  const materials = [
    [cemento, "MAT-CEM", "Cemento portland 50 kg", "saco", "8.50", "8.10"],
    [arena, "MAT-ARE", "Arena", "m3", "18.00", "16.50"],
    [ripio, "MAT-RIP", "Ripio", "m3", "20.00", "18.00"],
    [ladrillo, "MAT-LAD", "Ladrillo mambrón", "u", "0.25", "0.22"],
    [agua, "MAT-AGU", "Agua", "m3", "1.00", "1.00"],
  ] as const;
  for (const [itemId, code, name, unit, chamber, personal] of materials) {
    await tx.insert("materials", { id: itemId, org_id: orgId, code, name, unit, chamber_price: chamber, personal_price: personal });
  }
  await tx.insert("material_suppliers", { org_id: orgId, material_id: arena, supplier_id: supplier });

  const peon = id();
  const albanil = id();
  const maestro = id();
  await tx.insert("labor_categories", { id: peon, org_id: orgId, code: "MO-PEO", name: "Peón", hourly_chamber: "3.50", hourly_personal: "3.80" });
  await tx.insert("labor_categories", { id: albanil, org_id: orgId, code: "MO-ALB", name: "Albañil", hourly_chamber: "4.50", hourly_personal: "4.80" });
  await tx.insert("labor_categories", { id: maestro, org_id: orgId, code: "MO-MAE", name: "Maestro mayor", hourly_chamber: "6.00", hourly_personal: "6.40" });

  const concretera = id();
  const retro = id();
  await tx.insert("equipment", {
    id: concretera, org_id: orgId, code: "EQ-CON", name: "Concretera de un saco", hourly_chamber: "4.20", hourly_personal: "4.50",
    yield_rate: "2", power: "8 HP", brand: "Genérica", machine_type: "Hormigonera", uses_gasoline: true, chamber_code: "EQ-01",
  });
  await tx.insert("equipment", {
    id: retro, org_id: orgId, code: "EQ-RET", name: "Retroexcavadora", hourly_chamber: "45.00", hourly_personal: "48.00",
    yield_rate: "12", power: "90 HP", brand: "Genérica", machine_type: "Excavación", uses_gasoline: false, chamber_code: "EQ-02",
  });
  const volquete = id();
  await tx.insert("transport_rates", { id: volquete, org_id: orgId, code: "TR-VOL", name: "Volquete", unit: "m3-km", rate_chamber: "0.85", rate_personal: "0.90" });

  const chTierra = id();
  const chHorm = id();
  const chMamp = id();
  await tx.insert("catalog_chapters", { id: chTierra, org_id: orgId, code: "01", name: "Movimiento de tierras", sort_order: 1 });
  await tx.insert("catalog_chapters", { id: chHorm, org_id: orgId, code: "02", name: "Hormigones", sort_order: 2 });
  await tx.insert("catalog_chapters", { id: chMamp, org_id: orgId, code: "03", name: "Mampostería", sort_order: 3 });
  const tipoCivil = id();
  const tipoAux = id();
  await tx.insert("rubro_types", { id: tipoCivil, org_id: orgId, name: "Civil" });
  await tx.insert("rubro_types", { id: tipoAux, org_id: orgId, name: "Auxiliar" });

  const excavacion = id();
  const hormigon = id();
  const mortero = id();
  const muro = id();
  await tx.insert("catalog_rubros", { id: excavacion, org_id: orgId, chapter_id: chTierra, type_id: tipoCivil, code: "01.001", name: "Excavación a máquina en suelo normal", unit: "m3", yield_rate: "8" });
  await tx.insert("catalog_rubros", { id: hormigon, org_id: orgId, chapter_id: chHorm, type_id: tipoAux, code: "02.001", name: "Hormigón simple f'c 180 kg/cm2", unit: "m3", yield_rate: "2" });
  await tx.insert("catalog_rubros", { id: mortero, org_id: orgId, chapter_id: chHorm, type_id: tipoAux, code: "02.002", name: "Mortero 1:3", unit: "m3", yield_rate: "1.5" });
  await tx.insert("catalog_rubros", { id: muro, org_id: orgId, chapter_id: chMamp, type_id: tipoCivil, code: "03.001", name: "Mampostería de ladrillo mambrón", unit: "m2", yield_rate: "3" });

  const lines: [string, string, string, string, string, string, string, string, string][] = [
    [excavacion, "equipment", retro, "EQ-RET", "Retroexcavadora", "h", "1", "ND", "432400011"],
    [excavacion, "labor", peon, "MO-PEO", "Peón", "h", "0.25", "EP", "872100011"],
    [hormigon, "material", cemento, "MAT-CEM", "Cemento portland 50 kg", "saco", "7", "EP", "374400011"],
    [hormigon, "material", arena, "MAT-ARE", "Arena", "m3", "0.55", "EP", "142100011"],
    [hormigon, "material", ripio, "MAT-RIP", "Ripio", "m3", "0.85", "EP", "142100012"],
    [hormigon, "material", agua, "MAT-AGU", "Agua", "m3", "0.16", "EP", "180000011"],
    [hormigon, "labor", albanil, "MO-ALB", "Albañil", "h", "1", "EP", "872100012"],
    [hormigon, "labor", peon, "MO-PEO", "Peón", "h", "2", "EP", "872100011"],
    [hormigon, "equipment", concretera, "EQ-CON", "Concretera de un saco", "h", "1", "ND", "432400012"],
    [mortero, "material", cemento, "MAT-CEM", "Cemento portland 50 kg", "saco", "9", "EP", "374400011"],
    [mortero, "material", arena, "MAT-ARE", "Arena", "m3", "1.05", "EP", "142100011"],
    [mortero, "labor", peon, "MO-PEO", "Peón", "h", "1", "EP", "872100011"],
    [muro, "material", ladrillo, "MAT-LAD", "Ladrillo mambrón", "u", "30", "EP", "373500011"],
    [muro, "auxiliary", mortero, "02.002", "Mortero 1:3", "m3", "0.03", "EP", ""],
    [muro, "labor", albanil, "MO-ALB", "Albañil", "h", "1", "EP", "872100012"],
    [muro, "transport", volquete, "TR-VOL", "Volquete", "m3-km", "5", "EP", "641100011"],
  ];
  for (const [index, line] of lines.entries()) {
    const [rubroId, kind, ref, code, name, unit, quantity, origin, cpc] = line;
    await tx.insert("catalog_apu_lines", {
      org_id: orgId, rubro_id: rubroId, kind, ref_id: ref, code, name, unit, quantity, origin, cpc_code: cpc, sort_order: index,
    });
  }

  const cpcs = [
    ["374400011", "Cemento portland"],
    ["142100011", "Arena"],
    ["142100012", "Ripio"],
    ["373500011", "Ladrillos de arcilla"],
    ["180000011", "Agua"],
    ["872100011", "Servicios de peón"],
    ["872100012", "Servicios de albañil"],
    ["432400011", "Retroexcavadora"],
    ["432400012", "Hormigonera"],
    ["641100011", "Transporte de carga por carretera"],
  ];
  for (const [code, description] of cpcs) await tx.insert("cpc_codes", { org_id: orgId, code, description });
  await tx.insert("vae_thresholds", {
    org_id: orgId,
    name: "Umbral de ejemplo",
    percent: "40",
    note: "Valor de demostración. Confirme el umbral en los pliegos y en la resolución vigente.",
  });
  await tx.insert("price_snapshots", { org_id: orgId, captured_on: todayIso(), note: "Base inicial de ejemplo" });
}

export const DEFAULT_INDIRECTS = [
  ["office", "Operaciones de oficina central", "monthly"],
  ["site", "Operaciones de obra", "monthly"],
  ["misc", "Costos varios", "monthly"],
  ["tax", "Costos impositivos", "percent_contract"],
  ["financial", "Costos financieros", "financial"],
  ["contingency", "Imprevistos y utilidad", "percent_subtotal"],
] as const;

export const DEFAULT_SYMBOLS = [
  ["MAT", "Materiales", "material"],
  ["MO", "Mano de obra", "labor"],
  ["EQ", "Equipos", "equipment"],
  ["HM", "Herramienta menor", "minor_tool"],
  ["TR", "Transporte", "transport"],
] as const;
