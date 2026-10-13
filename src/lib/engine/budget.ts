import { dec, Decimal, money, nearlyEqual } from "./money";

export type LineKind = "material" | "labor" | "equipment" | "transport" | "auxiliary";
export type Origin = "EP" | "NP" | "ND";
export type YieldMode = "rubro" | "insumo";
export type MinorToolMode = "global" | "rubro";

export const VAE_FACTOR: Record<Origin, string> = { EP: "1", ND: "0.4", NP: "0" };

export type CostLine = {
  id: string;
  kind: LineKind;
  name: string;
  quantity: string;
  unitPrice: string;
  origin: Origin;
  auxiliaryRubroId?: string | null;
  cpcCode?: string | null;
};

export type CostRubro = {
  id: string;
  chapterId: string;
  name: string;
  code: string;
  unit: string;
  quantity: string;
  yieldRate: string;
  isSubcontract: boolean;
  proposedValue: string;
  isAuxiliary: boolean;
  minorToolPercent: string;
  origin: Origin;
  lines: CostLine[];
};

export type BudgetOptions = {
  yieldMode: YieldMode;
  minorToolMode: MinorToolMode;
  minorToolPercent: string;
  indirectPercent: string;
};

export type ComponentTotals = {
  material: string;
  labor: string;
  equipment: string;
  transport: string;
  minorTool: string;
};

export type LineResult = CostLine & { cost: string; vaeAmount: string };

export type RubroResult = {
  id: string;
  direct: string;
  indirect: string;
  unitPrice: string;
  total: string;
  components: ComponentTotals;
  lines: LineResult[];
  vaeAmount: string;
  vaeBase: string;
};

export type ChapterResult = { chapterId: string; direct: string; total: string };

export type BudgetResult = {
  rubros: RubroResult[];
  chapters: ChapterResult[];
  direct: string;
  indirect: string;
  total: string;
  components: ComponentTotals;
  vaePercent: string;
  vaeAmount: string;
  vaeBase: string;
};

export function hoursPerUnit(yieldRate: string | number | Decimal): Decimal {
  const rate = dec(yieldRate);
  if (rate.lte(0)) return new Decimal(0);
  return new Decimal(1).div(rate);
}

function lineCost(
  line: CostLine,
  rubro: CostRubro,
  options: BudgetOptions,
  auxiliaryDirect: Map<string, Decimal>,
): Decimal {
  if (line.kind === "auxiliary") {
    const unit = auxiliaryDirect.get(line.auxiliaryRubroId ?? "") ?? new Decimal(0);
    return unit.mul(dec(line.quantity));
  }
  if (line.kind === "labor" || line.kind === "equipment") {
    if (options.yieldMode === "insumo") {
      return hoursPerUnit(line.quantity).mul(dec(line.unitPrice));
    }
    const crew = dec(line.quantity).lte(0) ? new Decimal(1) : dec(line.quantity);
    return hoursPerUnit(rubro.yieldRate).mul(crew).mul(dec(line.unitPrice));
  }
  return dec(line.quantity).mul(dec(line.unitPrice));
}

function emptyComponents(): Record<keyof ComponentTotals, Decimal> {
  return {
    material: new Decimal(0),
    labor: new Decimal(0),
    equipment: new Decimal(0),
    transport: new Decimal(0),
    minorTool: new Decimal(0),
  };
}

function directOf(
  rubro: CostRubro,
  options: BudgetOptions,
  auxiliaryDirect: Map<string, Decimal>,
): { direct: Decimal; components: Record<keyof ComponentTotals, Decimal>; lines: LineResult[] } {
  const components = emptyComponents();
  const lines: LineResult[] = [];
  if (rubro.isSubcontract) {
    const direct = dec(rubro.proposedValue);
    return { direct, components, lines };
  }
  for (const line of rubro.lines) {
    if (rubro.isAuxiliary && line.kind === "auxiliary") continue;
    const cost = lineCost(line, rubro, options, auxiliaryDirect);
    if (line.kind === "auxiliary") components.material = components.material.plus(cost);
    else components[line.kind] = components[line.kind].plus(cost);
    const factor = dec(VAE_FACTOR[line.origin] ?? "0");
    lines.push({ ...line, cost: money(cost), vaeAmount: money(cost.mul(factor)) });
  }
  const toolPercent =
    options.minorToolMode === "rubro" ? dec(rubro.minorToolPercent) : dec(options.minorToolPercent);
  components.minorTool = components.labor.mul(toolPercent).div(100);
  const direct = components.material
    .plus(components.labor)
    .plus(components.equipment)
    .plus(components.transport)
    .plus(components.minorTool);
  return { direct, components, lines };
}

function packComponents(c: Record<keyof ComponentTotals, Decimal>): ComponentTotals {
  return {
    material: money(c.material),
    labor: money(c.labor),
    equipment: money(c.equipment),
    transport: money(c.transport),
    minorTool: money(c.minorTool),
  };
}

export function priceBudget(rubros: CostRubro[], options: BudgetOptions): BudgetResult {
  const auxiliaryDirect = new Map<string, Decimal>();
  for (const rubro of rubros.filter((item) => item.isAuxiliary)) {
    auxiliaryDirect.set(rubro.id, directOf(rubro, options, new Map()).direct);
  }

  const indirectRate = dec(options.indirectPercent).div(100);
  const results: RubroResult[] = [];
  const chapterMap = new Map<string, { direct: Decimal; total: Decimal }>();
  const components = emptyComponents();
  let direct = new Decimal(0);
  let indirect = new Decimal(0);
  let total = new Decimal(0);
  let vaeAmount = new Decimal(0);
  let vaeBase = new Decimal(0);

  for (const rubro of rubros) {
    const priced = directOf(rubro, options, auxiliaryDirect);
    const qty = dec(rubro.quantity);
    const indirectUnit = priced.direct.mul(indirectRate);
    const unitPrice = priced.direct.plus(indirectUnit);
    const rubroTotal = unitPrice.mul(qty);
    let rubroVae = new Decimal(0);
    let rubroBase = new Decimal(0);
    if (rubro.isSubcontract) {
      const base = priced.direct.mul(qty);
      rubroBase = base;
      rubroVae = base.mul(dec(VAE_FACTOR[rubro.origin] ?? "0"));
    } else {
      for (const line of priced.lines) {
        const base = dec(line.cost).mul(qty);
        rubroBase = rubroBase.plus(base);
        rubroVae = rubroVae.plus(dec(line.vaeAmount).mul(qty));
      }
      const toolBase = priced.components.minorTool.mul(qty);
      rubroBase = rubroBase.plus(toolBase);
      rubroVae = rubroVae.plus(toolBase);
    }
    results.push({
      id: rubro.id,
      direct: money(priced.direct),
      indirect: money(indirectUnit),
      unitPrice: money(unitPrice),
      total: money(rubroTotal),
      components: packComponents(priced.components),
      lines: priced.lines,
      vaeAmount: money(rubroVae),
      vaeBase: money(rubroBase),
    });
    if (!rubro.isAuxiliary) {
      const chapter = chapterMap.get(rubro.chapterId) ?? { direct: new Decimal(0), total: new Decimal(0) };
      chapter.direct = chapter.direct.plus(priced.direct.mul(qty));
      chapter.total = chapter.total.plus(rubroTotal);
      chapterMap.set(rubro.chapterId, chapter);
      direct = direct.plus(priced.direct.mul(qty));
      indirect = indirect.plus(indirectUnit.mul(qty));
      total = total.plus(rubroTotal);
      vaeAmount = vaeAmount.plus(rubroVae);
      vaeBase = vaeBase.plus(rubroBase);
      (Object.keys(components) as (keyof ComponentTotals)[]).forEach((key) => {
        components[key] = components[key].plus(priced.components[key].mul(qty));
      });
    }
  }

  return {
    rubros: results,
    chapters: [...chapterMap.entries()].map(([chapterId, value]) => ({
      chapterId,
      direct: money(value.direct),
      total: money(value.total),
    })),
    direct: money(direct),
    indirect: money(indirect),
    total: money(total),
    components: packComponents(components),
    vaePercent: vaeBase.lte(0) ? "0.000000" : money(vaeAmount.div(vaeBase).mul(100)),
    vaeAmount: money(vaeAmount),
    vaeBase: money(vaeBase),
  };
}

export function meetsVaeThreshold(vaePercent: string, threshold: string): boolean {
  return dec(vaePercent).gte(dec(threshold));
}

export type IndirectMode =
  | "monthly"
  | "total"
  | "percent_contract"
  | "percent_readjustment"
  | "percent_capital"
  | "percent_subtotal"
  | "financial";

export type IndirectItem = {
  id: string;
  group: "office" | "site" | "misc" | "tax" | "financial" | "contingency";
  name: string;
  enabled: boolean;
  mode: IndirectMode;
  monthlyCost: string;
  months: string;
  directTotal: string;
  percent: string;
  advancePercent: string;
  premiumPercent: string;
  guaranteePercent: string;
};

export type IndirectContext = {
  direct: string;
  contract: string;
  readjustment: string;
  capital: string;
};

export function indirectItemAmount(item: IndirectItem, ctx: IndirectContext, operating: Decimal): Decimal {
  if (!item.enabled) return new Decimal(0);
  if (item.mode === "monthly") return dec(item.monthlyCost).mul(dec(item.months));
  if (item.mode === "total") return dec(item.directTotal);
  if (item.mode === "percent_contract") return dec(ctx.contract).mul(dec(item.percent)).div(100);
  if (item.mode === "percent_readjustment") return dec(ctx.readjustment).mul(dec(item.percent)).div(100);
  if (item.mode === "percent_capital") return dec(ctx.capital).mul(dec(item.percent)).div(100);
  if (item.mode === "percent_subtotal") return dec(ctx.direct).plus(operating).mul(dec(item.percent)).div(100);
  const contract = dec(ctx.contract);
  const advance = contract.mul(dec(item.advancePercent)).div(100).mul(dec(item.premiumPercent)).div(100);
  const guarantee = contract.mul(dec(item.guaranteePercent)).div(100);
  return advance.plus(guarantee);
}

export function priceIndirects(items: IndirectItem[], ctx: IndirectContext) {
  const operating = items
    .filter((item) => item.group === "office" || item.group === "site" || item.group === "misc")
    .reduce((sum, item) => sum.plus(indirectItemAmount(item, ctx, new Decimal(0))), new Decimal(0));
  const rows = items.map((item) => ({
    id: item.id,
    amount: money(indirectItemAmount(item, ctx, operating)),
  }));
  const total = rows.reduce((sum, row) => sum.plus(dec(row.amount)), new Decimal(0));
  const base = dec(ctx.direct);
  const percent = base.lte(0) ? new Decimal(0) : total.div(base).mul(100);
  return { rows, operating: money(operating), total: money(total), percent: money(percent) };
}

export function indirectsMatch(generalPercent: string, breakdownPercent: string): boolean {
  return nearlyEqual(dec(generalPercent), dec(breakdownPercent), "0.01");
}

export type SymbolInput = { id: string; amount: string };

export function symbolWeights(symbols: SymbolInput[], directTotal: string) {
  const base = dec(directTotal);
  return symbols.map((symbol) => ({
    id: symbol.id,
    weight: base.lte(0) ? "0.000000" : money(dec(symbol.amount).div(base)),
  }));
}

export type PolynomialTerm = { coefficient: string; indexBase: string; indexPeriod: string };

export function polynomialFactor(terms: PolynomialTerm[]): { factor: string; coefficientsSum: string; valid: boolean } {
  const sum = terms.reduce((acc, term) => acc.plus(dec(term.coefficient)), new Decimal(0));
  const factor = terms.reduce((acc, term) => {
    const base = dec(term.indexBase);
    if (base.lte(0)) return acc;
    return acc.plus(dec(term.coefficient).mul(dec(term.indexPeriod).div(base)));
  }, new Decimal(0));
  return { factor: money(factor), coefficientsSum: money(sum), valid: nearlyEqual(sum, new Decimal(1)) };
}

export function adjustedValue(initial: string, factor: string): string {
  return money(dec(initial).mul(dec(factor)));
}

export function crewWeights(rows: SymbolInput[]) {
  const total = rows.reduce((sum, row) => sum.plus(dec(row.amount)), new Decimal(0));
  return rows.map((row) => ({
    id: row.id,
    weight: total.lte(0) ? "0.000000" : money(dec(row.amount).div(total)),
  }));
}

export function addWorkingDays(startIso: string, workingDays: number, hours: number[]): string {
  const date = new Date(`${startIso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return startIso;
  let left = Math.max(0, Math.trunc(workingDays));
  if (left === 0) return startIso.slice(0, 10);
  let guard = 0;
  while (left > 0 && guard < 3660) {
    const weekday = date.getUTCDay();
    const index = weekday === 0 ? 6 : weekday - 1;
    if ((hours[index] ?? 0) > 0) left -= 1;
    if (left > 0) date.setUTCDate(date.getUTCDate() + 1);
    guard += 1;
  }
  return date.toISOString().slice(0, 10);
}

export function programmedAmount(total: string, percents: string[]): string {
  const sum = percents.reduce((acc, value) => acc.plus(dec(value)), new Decimal(0));
  return money(dec(total).mul(sum).div(100));
}

export function scheduleCloses(total: string, percents: string[]): boolean {
  return nearlyEqual(dec(programmedAmount(total, percents)), dec(total), "0.05");
}

export function investmentCurve(periods: { id: string; label: string }[], amounts: { periodId: string; amount: string }[]) {
  let cumulative = new Decimal(0);
  return periods.map((period) => {
    const amount = amounts
      .filter((row) => row.periodId === period.id)
      .reduce((sum, row) => sum.plus(dec(row.amount)), new Decimal(0));
    cumulative = cumulative.plus(amount);
    return { id: period.id, label: period.label, amount: money(amount), cumulative: money(cumulative) };
  });
}

export function contributorShares(components: ComponentTotals, percents: { material: string; labor: string; equipment: string; transport: string }) {
  return {
    material: money(dec(components.material).mul(dec(percents.material)).div(100)),
    labor: money(dec(components.labor).mul(dec(percents.labor)).div(100)),
    equipment: money(dec(components.equipment).mul(dec(percents.equipment)).div(100)),
    transport: money(dec(components.transport).mul(dec(percents.transport)).div(100)),
  };
}
