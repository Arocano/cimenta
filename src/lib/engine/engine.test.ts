import { describe, expect, it } from "vitest";
import {
  addWorkingDays,
  adjustedValue,
  crewWeights,
  hoursPerUnit,
  indirectsMatch,
  investmentCurve,
  meetsVaeThreshold,
  polynomialFactor,
  priceBudget,
  priceIndirects,
  programmedAmount,
  scheduleCloses,
  symbolWeights,
  type CostRubro,
  type IndirectItem,
} from "./budget";

const options = {
  yieldMode: "rubro" as const,
  minorToolMode: "global" as const,
  minorToolPercent: "5",
  indirectPercent: "20",
};

function rubro(partial: Partial<CostRubro> & Pick<CostRubro, "id">): CostRubro {
  return {
    chapterId: "c1",
    name: partial.id,
    code: "",
    unit: "m3",
    quantity: "2",
    yieldRate: "2",
    isSubcontract: false,
    proposedValue: "0",
    isAuxiliary: false,
    minorToolPercent: "0",
    origin: "ND",
    lines: [],
    ...partial,
  };
}

describe("presupuesto", () => {
  it("calcula horas por unidad como inverso del rendimiento", () => {
    expect(hoursPerUnit("4").toFixed(2)).toBe("0.25");
    expect(hoursPerUnit("0").toFixed(2)).toBe("0.00");
  });

  it("suma materiales, mano de obra, equipo, transporte y herramienta menor", () => {
    const result = priceBudget(
      [
        rubro({
          id: "r1",
          quantity: "10",
          yieldRate: "2",
          lines: [
            { id: "m", kind: "material", name: "Cemento", quantity: "3", unitPrice: "8", origin: "EP" },
            { id: "l", kind: "labor", name: "Albañil", quantity: "1", unitPrice: "6", origin: "EP" },
            { id: "e", kind: "equipment", name: "Concretera", quantity: "1", unitPrice: "10", origin: "ND" },
            { id: "t", kind: "transport", name: "Flete", quantity: "2", unitPrice: "1.5", origin: "EP" },
          ],
        }),
      ],
      options,
    );
    const row = result.rubros[0];
    expect(row.components.material).toBe("24.000000");
    expect(row.components.labor).toBe("3.000000");
    expect(row.components.equipment).toBe("5.000000");
    expect(row.components.transport).toBe("3.000000");
    expect(row.components.minorTool).toBe("0.150000");
    expect(row.direct).toBe("35.150000");
    expect(row.unitPrice).toBe("42.180000");
    expect(row.total).toBe("421.800000");
    expect(result.chapters[0].total).toBe("421.800000");
  });

  it("aplica la herramienta menor por rubro", () => {
    const result = priceBudget(
      [rubro({ id: "r1", quantity: "1", minorToolPercent: "10", lines: [{ id: "l", kind: "labor", name: "Peón", quantity: "1", unitPrice: "4", origin: "EP" }] })],
      { ...options, minorToolMode: "rubro", indirectPercent: "0" },
    );
    expect(result.rubros[0].components.minorTool).toBe("0.200000");
  });

  it("el subcontrato usa el valor propuesto", () => {
    const result = priceBudget(
      [
        rubro({
          id: "r1",
          quantity: "3",
          isSubcontract: true,
          proposedValue: "15",
          origin: "NP",
          lines: [{ id: "m", kind: "material", name: "Ignorado", quantity: "9", unitPrice: "9", origin: "EP" }],
        }),
      ],
      { ...options, indirectPercent: "0" },
    );
    expect(result.rubros[0].direct).toBe("15.000000");
    expect(result.rubros[0].total).toBe("45.000000");
    expect(result.vaePercent).toBe("0.000000");
  });

  it("un auxiliar de un solo nivel entra como material", () => {
    const result = priceBudget(
      [
        rubro({
          id: "aux",
          isAuxiliary: true,
          quantity: "1",
          lines: [{ id: "m", kind: "material", name: "Cemento", quantity: "2", unitPrice: "5", origin: "EP" }],
        }),
        rubro({
          id: "muro",
          quantity: "4",
          lines: [{ id: "a", kind: "auxiliary", name: "Hormigón", quantity: "0.5", unitPrice: "0", origin: "EP", auxiliaryRubroId: "aux" }],
        }),
      ],
      { ...options, minorToolPercent: "0", indirectPercent: "10" },
    );
    expect(result.rubros.find((row) => row.id === "aux")?.direct).toBe("10.000000");
    const muro = result.rubros.find((row) => row.id === "muro");
    expect(muro?.components.material).toBe("5.000000");
    expect(muro?.unitPrice).toBe("5.500000");
    expect(result.total).toBe("22.000000");
  });

  it("acepta coma decimal", () => {
    const result = priceBudget(
      [rubro({ id: "r1", quantity: "1,5", lines: [{ id: "m", kind: "material", name: "Arena", quantity: "2", unitPrice: "1,25", origin: "EP" }] })],
      { ...options, minorToolPercent: "0", indirectPercent: "0" },
    );
    expect(result.total).toBe("3.750000");
  });
});

describe("indirectos, VAE y reajuste", () => {
  it("desglosa indirectos y detecta diferencia con el porcentaje general", () => {
    const items: IndirectItem[] = [
      { id: "1", group: "office", name: "Oficina", enabled: true, mode: "monthly", monthlyCost: "100", months: "2", directTotal: "0", percent: "0", advancePercent: "0", premiumPercent: "0", guaranteePercent: "0" },
      { id: "2", group: "contingency", name: "Utilidad", enabled: true, mode: "percent_subtotal", monthlyCost: "0", months: "0", directTotal: "0", percent: "10", advancePercent: "0", premiumPercent: "0", guaranteePercent: "0" },
      { id: "3", group: "financial", name: "Financiero", enabled: true, mode: "financial", monthlyCost: "0", months: "0", directTotal: "0", percent: "0", advancePercent: "40", premiumPercent: "5", guaranteePercent: "1" },
    ];
    const priced = priceIndirects(items, { direct: "1000", contract: "1200", readjustment: "0", capital: "0" });
    expect(priced.rows[0].amount).toBe("200.000000");
    expect(priced.rows[1].amount).toBe("120.000000");
    expect(priced.rows[2].amount).toBe("36.000000");
    expect(indirectsMatch("20", priced.percent)).toBe(false);
    expect(indirectsMatch(priced.percent, priced.percent)).toBe(true);
  });

  it("calcula VAE con EP, ND y NP", () => {
    const result = priceBudget(
      [
        rubro({
          id: "r1",
          quantity: "1",
          lines: [
            { id: "a", kind: "material", name: "Local", quantity: "1", unitPrice: "100", origin: "EP" },
            { id: "b", kind: "material", name: "Mixto", quantity: "1", unitPrice: "100", origin: "ND" },
            { id: "c", kind: "material", name: "Importado", quantity: "1", unitPrice: "100", origin: "NP" },
          ],
        }),
      ],
      { ...options, minorToolPercent: "0", indirectPercent: "0" },
    );
    expect(result.vaePercent).toBe("46.666667");
    expect(meetsVaeThreshold(result.vaePercent, "40")).toBe(true);
    expect(meetsVaeThreshold(result.vaePercent, "50")).toBe(false);
  });

  it("exige coeficientes que sumen uno y reajusta el valor", () => {
    const bad = polynomialFactor([{ coefficient: "0.4", indexBase: "100", indexPeriod: "110" }]);
    expect(bad.valid).toBe(false);
    const good = polynomialFactor([
      { coefficient: "0.5", indexBase: "100", indexPeriod: "110" },
      { coefficient: "0.5", indexBase: "200", indexPeriod: "200" },
    ]);
    expect(good.valid).toBe(true);
    expect(good.factor).toBe("1.050000");
    expect(adjustedValue("1000", good.factor)).toBe("1050.000000");
  });

  it("pondera símbolos y cuadrilla", () => {
    expect(symbolWeights([{ id: "a", amount: "25" }, { id: "b", amount: "75" }], "100")[0].weight).toBe("0.250000");
    expect(crewWeights([{ id: "peon", amount: "1" }, { id: "albanil", amount: "3" }])[1].weight).toBe("0.750000");
  });
});

describe("cronograma", () => {
  it("salta fines de semana y cierra la curva", () => {
    expect(addWorkingDays("2026-10-12", 1, [8, 8, 8, 8, 8, 0, 0])).toBe("2026-10-12");
    expect(addWorkingDays("2026-10-16", 2, [8, 8, 8, 8, 8, 0, 0])).toBe("2026-10-19");
    expect(programmedAmount("200", ["40", "60"])).toBe("200.000000");
    expect(scheduleCloses("200", ["25", "75"])).toBe(true);
    const curve = investmentCurve(
      [{ id: "p1", label: "S1" }, { id: "p2", label: "S2" }],
      [{ periodId: "p1", amount: "40" }, { periodId: "p2", amount: "60" }],
    );
    expect(curve[1].cumulative).toBe("100.000000");
  });
});
