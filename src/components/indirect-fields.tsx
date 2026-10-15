"use client";

import { Field, TextField } from "@/components/kit";
import { Select } from "@/components/ui";
import { useState } from "react";

const modes = [
  ["monthly", "Costo mensual por meses"],
  ["total", "Total directo"],
  ["percent_contract", "Porcentaje del contrato"],
  ["percent_readjustment", "Porcentaje del reajuste"],
  ["percent_capital", "Porcentaje del capital"],
  ["percent_subtotal", "Porcentaje del directo más operación"],
  ["financial", "Anticipo, prima y garantías"],
] as const;

const hints: Record<string, string> = {
  monthly: "Se multiplica el costo de un mes por la cantidad de meses.",
  total: "Un valor fijo, sin porcentaje.",
  percent_contract: "Porcentaje sobre el precio de la oferta.",
  percent_readjustment: "Porcentaje sobre el reajuste del período.",
  percent_capital: "Porcentaje sobre el capital de operación.",
  percent_subtotal: "Porcentaje sobre el costo directo más los indirectos de operación.",
  financial: "El anticipo se multiplica por la prima. Las garantías se suman aparte. Ambos salen del contrato.",
};

const visibleByMode: Record<string, string[]> = {
  monthly: ["monthly_cost", "months"],
  total: ["direct_total"],
  percent_contract: ["percent"],
  percent_readjustment: ["percent"],
  percent_capital: ["percent"],
  percent_subtotal: ["percent"],
  financial: ["advance_percent", "premium_percent", "guarantee_percent"],
};

const amounts = [
  ["monthly_cost", "Costo por mes"],
  ["months", "Meses"],
  ["direct_total", "Total directo"],
  ["percent", "Porcentaje"],
  ["advance_percent", "Anticipo %"],
  ["premium_percent", "Prima %"],
  ["guarantee_percent", "Garantías %"],
] as const;

export function IndirectFields({
  mode,
  enabled,
  values,
}: {
  mode: string;
  enabled: boolean;
  values: Record<string, string>;
}) {
  const [current, setCurrent] = useState(mode);
  const visible = new Set(visibleByMode[current] ?? []);
  return (
    <>
      <Field label="Activo">
        <Select name="enabled" defaultValue={enabled ? "si" : "no"}>
          <option value="si">Sí, entra en el desglose</option>
          <option value="no">No, queda fuera</option>
        </Select>
      </Field>
      <Field label="Cálculo" hint={hints[current]} className="md:col-span-2">
        <Select name="mode" value={current} onChange={(event) => setCurrent(event.target.value)}>
          {modes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </Field>
      {amounts.map(([name, label]) => (
        <div key={name} className={visible.has(name) ? undefined : "hidden"}>
          <TextField label={label} name={name} type="number" defaultValue={values[name] ?? "0"} />
        </div>
      ))}
    </>
  );
}
