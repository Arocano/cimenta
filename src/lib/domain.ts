import {
  addWorkingDays,
  adjustedValue,
  contributorShares,
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
} from "./engine/budget";
import { dec, money, todayIso } from "./engine/money";
import { transaction, type Row, type Tx } from "./db";
import { DEFAULT_INDIRECTS, DEFAULT_SYMBOLS } from "./seed";
import { AppError, assertAdmin, assertBudget, assertWarehouse, canSee, requireSession, type Session } from "./session";
import type {
  AdjustmentSymbol,
  CatalogLine,
  CatalogRubro,
  CertificateLine,
  ContractAdvance,
  Contributor,
  Deduction,
  Equipment,
  IndirectItemRow,
  LaborCategory,
  Material,
  PaymentCertificate,
  PolynomialTerm,
  PriceIndex,
  PriceSnapshot,
  PriceSnapshotLine,
  Project,
  ProjectChapter,
  ProjectLine,
  ProjectRubro,
  ScheduleGroup,
  ScheduleTask,
  TableName,
  TransportRate,
  ValuedAllocation,
  ValuedPeriod,
  VaeThreshold,
  WarehouseMovement,
  WorkCalendar,
} from "./types";

const PROJECT_TABLES: TableName[] = [
  "project_members", "project_chapters", "project_rubros", "project_apu_lines", "contributors", "indirect_items",
  "adjustment_symbols", "symbol_components", "polynomial_terms", "price_indices", "crew_weights", "adjustment_memos",
  "work_calendars", "schedule_groups", "schedule_tasks", "valued_periods", "valued_allocations", "warehouse_movements",
  "contract_advances", "deductions", "payment_certificates", "certificate_lines", "certificate_adjustments",
];

function as<T>(rows: Row[]): T[] {
  return rows as T[];
}

function sortBy<T extends { sort_order: number; name?: string }>(rows: T[]) {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order || String(a.name ?? "").localeCompare(String(b.name ?? ""), "es"));
}

async function ownedProject(tx: Tx, session: Session, projectId: string) {
  const project = as<Project>(await tx.list("projects", { id: projectId, org_id: session.orgId }))[0];
  if (!project || !canSee(session, project.id)) throw new AppError("No tiene acceso a esta obra.");
  return project;
}

function blankProject(session: Session, name: string, date: string): Omit<Project, "id"> {
  return {
    org_id: session.orgId,
    name,
    proposed_date: date || todayIso(),
    proponent: "",
    owner_name: "",
    calculated_by: session.fullName,
    reviewed_by: "",
    description: "",
    province: "",
    canton: "",
    parish: "",
    sector: "",
    address: "",
    yield_mode: "rubro",
    minor_tool_mode: "global",
    minor_tool_percent: "5",
    transport_materials: true,
    transport_equipment: true,
    price_scheme: "chamber",
    indirect_percent: "15",
    indirect_prevail: "general",
    contributors_enabled: false,
    vae_threshold_id: "",
    work_start: date || todayIso(),
    calendar_id: "",
    created_at: new Date().toISOString(),
  };
}

async function seedProjectExtras(tx: Tx, session: Session, projectId: string) {
  const calendar = await tx.insert("work_calendars", {
    org_id: session.orgId, project_id: projectId, name: "Lunes a viernes, 8 horas",
    mon: "8", tue: "8", wed: "8", thu: "8", fri: "8", sat: "0", sun: "0",
  });
  await tx.update("projects", projectId, { calendar_id: calendar.id });
  for (const [index, item] of DEFAULT_INDIRECTS.entries()) {
    await tx.insert("indirect_items", {
      org_id: session.orgId, project_id: projectId, group_name: item[0], name: item[1], enabled: true, mode: item[2],
      monthly_cost: "0", months: "1", direct_total: "0", percent: item[0] === "contingency" ? "10" : "0",
      advance_percent: "0", premium_percent: "0", guarantee_percent: "0", sort_order: index + 1,
    });
  }
  const thresholds = as<VaeThreshold>(await tx.list("vae_thresholds", { org_id: session.orgId }));
  if (thresholds[0]) await tx.update("projects", projectId, { vae_threshold_id: thresholds[0].id });
  for (const [index, symbol] of DEFAULT_SYMBOLS.entries()) {
    const created = await tx.insert("adjustment_symbols", {
      org_id: session.orgId, project_id: projectId, code: symbol[0], name: symbol[1], family: symbol[2], scope: "family", sort_order: index + 1,
    });
    await tx.insert("polynomial_terms", { org_id: session.orgId, project_id: projectId, symbol_id: created.id, coefficient: "0.2" });
    await tx.insert("price_indices", { org_id: session.orgId, project_id: projectId, symbol_id: created.id, kind: "base", period_label: "Base", value: "100" });
    await tx.insert("price_indices", { org_id: session.orgId, project_id: projectId, symbol_id: created.id, kind: "period", period_label: "Periodo 1", value: "100" });
  }
  await tx.insert("adjustment_memos", { org_id: session.orgId, project_id: projectId, body: "", author: session.fullName, memo_date: todayIso() });
}

export async function listVisibleProjects(query = "") {
  const session = await requireSession();
  const projects = await transaction(async (tx) => as<Project>(await tx.list("projects", { org_id: session.orgId })));
  const visible = projects.filter((project) => canSee(session, project.id));
  const needle = query.trim().toLowerCase();
  return {
    session,
    projects: visible
      .filter((project) => !needle || project.name.toLowerCase().includes(needle) || project.proposed_date.includes(needle))
      .sort((a, b) => b.proposed_date.localeCompare(a.proposed_date) || a.name.localeCompare(b.name, "es")),
  };
}

export async function createProject(name: string, date: string) {
  const session = await requireSession();
  assertBudget(session);
  if (!name.trim()) throw new AppError("El nombre de la obra es obligatorio.");
  return transaction(async (tx) => {
    const project = await tx.insert("projects", blankProject(session, name.trim(), date));
    await tx.insert("project_members", { org_id: session.orgId, project_id: project.id, user_id: session.userId });
    await seedProjectExtras(tx, session, project.id);
    return project.id;
  });
}

export async function updateProject(projectId: string, patch: Record<string, unknown>) {
  const session = await requireSession();
  assertBudget(session);
  if (patch.name !== undefined && !String(patch.name).trim()) throw new AppError("El nombre de la obra es obligatorio.");
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.update("projects", projectId, patch);
  });
}

async function removeProjectRows(tx: Tx, projectId: string) {
  for (const table of PROJECT_TABLES) {
    const rows = await tx.list(table, { project_id: projectId });
    for (const row of rows) await tx.remove(table, row.id);
  }
  await tx.remove("projects", projectId);
}

export async function removeProject(projectId: string) {
  const session = await requireSession();
  assertAdmin(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await removeProjectRows(tx, projectId);
  });
}

export async function copyProject(projectId: string) {
  const session = await requireSession();
  assertBudget(session);
  return transaction(async (tx) => {
    const source = await ownedProject(tx, session, projectId);
    const copy = await tx.insert("projects", { ...source, id: undefined, name: `${source.name} (copia)`, created_at: new Date().toISOString() });
    await tx.insert("project_members", { org_id: session.orgId, project_id: copy.id, user_id: session.userId });
    const map = new Map<string, string>();
    const chapters = sortBy(as<ProjectChapter>(await tx.list("project_chapters", { project_id: projectId })));
    for (const chapter of chapters) {
      const next = await tx.insert("project_chapters", { ...chapter, id: undefined, project_id: copy.id });
      map.set(chapter.id, next.id);
    }
    const rubros = sortBy(as<ProjectRubro>(await tx.list("project_rubros", { project_id: projectId })));
    for (const rubro of rubros) {
      const next = await tx.insert("project_rubros", { ...rubro, id: undefined, project_id: copy.id, chapter_id: map.get(rubro.chapter_id) ?? rubro.chapter_id });
      map.set(rubro.id, next.id);
    }
    for (const rubro of rubros) {
      if (rubro.chapter_id && map.get(rubro.id)) {
        const current = as<ProjectRubro>(await tx.list("project_rubros", { id: map.get(rubro.id)! }))[0];
        if (current) await tx.update("project_rubros", current.id, { chapter_id: map.get(rubro.chapter_id) ?? current.chapter_id });
      }
    }
    const lines = as<ProjectLine>(await tx.list("project_apu_lines", { project_id: projectId }));
    for (const line of lines) {
      await tx.insert("project_apu_lines", {
        ...line,
        id: undefined,
        project_id: copy.id,
        rubro_id: map.get(line.rubro_id) ?? line.rubro_id,
        auxiliary_rubro_id: line.auxiliary_rubro_id ? map.get(line.auxiliary_rubro_id) ?? "" : "",
      });
    }
    for (const table of ["contributors", "indirect_items", "work_calendars", "adjustment_memos"] as TableName[]) {
      for (const row of await tx.list(table, { project_id: projectId })) {
        const next = await tx.insert(table, { ...row, id: undefined, project_id: copy.id });
        map.set(row.id, next.id);
      }
    }
    const calendarId = map.get(source.calendar_id);
    if (calendarId) await tx.update("projects", copy.id, { calendar_id: calendarId });
    for (const symbol of as<AdjustmentSymbol>(await tx.list("adjustment_symbols", { project_id: projectId }))) {
      const next = await tx.insert("adjustment_symbols", { ...symbol, id: undefined, project_id: copy.id });
      map.set(symbol.id, next.id);
    }
    for (const term of await tx.list("polynomial_terms", { project_id: projectId })) {
      await tx.insert("polynomial_terms", { ...term, id: undefined, project_id: copy.id, symbol_id: map.get(String(term.symbol_id)) ?? term.symbol_id });
    }
    for (const index of await tx.list("price_indices", { project_id: projectId })) {
      await tx.insert("price_indices", { ...index, id: undefined, project_id: copy.id, symbol_id: map.get(String(index.symbol_id)) ?? index.symbol_id });
    }
    return copy.id;
  });
}

function toCost(project: Project, rubros: ProjectRubro[], lines: ProjectLine[]): CostRubro[] {
  return rubros.map((rubro) => ({
    id: rubro.id,
    chapterId: rubro.chapter_id,
    name: rubro.name,
    code: rubro.code,
    unit: rubro.unit,
    quantity: rubro.quantity,
    yieldRate: rubro.yield_rate,
    isSubcontract: rubro.is_subcontract,
    proposedValue: rubro.proposed_value,
    isAuxiliary: rubro.is_auxiliary,
    minorToolPercent: rubro.minor_tool_percent,
    origin: rubro.origin,
    lines: lines.filter((line) => line.rubro_id === rubro.id).sort((a, b) => a.sort_order - b.sort_order).map((line) => ({
      id: line.id,
      kind: line.kind,
      name: line.name,
      quantity: line.quantity,
      unitPrice: line.unit_price,
      origin: line.origin,
      auxiliaryRubroId: line.auxiliary_rubro_id,
      cpcCode: line.cpc_code,
    })),
  }));
}

export async function projectBundle(projectId: string) {
  const session = await requireSession();
  return transaction(async (tx) => {
    const project = await ownedProject(tx, session, projectId);
    const chapters = sortBy(as<ProjectChapter>(await tx.list("project_chapters", { project_id: projectId })));
    const rubros = sortBy(as<ProjectRubro>(await tx.list("project_rubros", { project_id: projectId })));
    const lines = as<ProjectLine>(await tx.list("project_apu_lines", { project_id: projectId }));
    const priced = priceBudget(toCost(project, rubros, lines), {
      yieldMode: project.yield_mode,
      minorToolMode: project.minor_tool_mode,
      minorToolPercent: project.minor_tool_percent,
      indirectPercent: project.indirect_percent,
    });
    const indirects = sortBy(as<IndirectItemRow>(await tx.list("indirect_items", { project_id: projectId })));
    const indirectInput: IndirectItem[] = indirects.map((item) => ({
      id: item.id, group: item.group_name, name: item.name, enabled: item.enabled, mode: item.mode,
      monthlyCost: item.monthly_cost, months: item.months, directTotal: item.direct_total, percent: item.percent,
      advancePercent: item.advance_percent, premiumPercent: item.premium_percent, guaranteePercent: item.guarantee_percent,
    }));
    const advances = as<ContractAdvance>(await tx.list("contract_advances", { project_id: projectId }));
    const indirectResult = priceIndirects(indirectInput, {
      direct: priced.direct,
      contract: priced.total,
      readjustment: "0",
      capital: advances.reduce((sum, row) => sum.plus(dec(row.amount)), dec(0)).toFixed(6),
    });
    const symbols = sortBy(as<AdjustmentSymbol>(await tx.list("adjustment_symbols", { project_id: projectId })));
    const terms = as<PolynomialTerm>(await tx.list("polynomial_terms", { project_id: projectId }));
    const indices = as<PriceIndex>(await tx.list("price_indices", { project_id: projectId }));
    const weights = symbolWeights(symbols.map((symbol) => ({ id: symbol.id, amount: symbolAmount(symbol, priced, lines, rubros) })), priced.direct);
    const polynomial = polynomialFactor(terms.map((term) => ({
      coefficient: term.coefficient,
      indexBase: indices.find((index) => index.symbol_id === term.symbol_id && index.kind === "base")?.value ?? "0",
      indexPeriod: indices.find((index) => index.symbol_id === term.symbol_id && index.kind === "period")?.value ?? "0",
    })));
    const laborRows = rubros.filter((rubro) => !rubro.is_auxiliary).flatMap((rubro) => {
      const result = priced.rubros.find((item) => item.id === rubro.id);
      return (result?.lines ?? []).filter((line) => line.kind === "labor").map((line) => ({ id: line.name, amount: money(dec(line.cost).mul(dec(rubro.quantity))) }));
    });
    const mergedLabor = new Map<string, ReturnType<typeof dec>>();
    for (const row of laborRows) mergedLabor.set(row.id, (mergedLabor.get(row.id) ?? dec(0)).plus(dec(row.amount)));
    const crew = crewWeights([...mergedLabor.entries()].map(([id, amount]) => ({ id, amount: amount.toFixed(6) })));
    const calendars = as<WorkCalendar>(await tx.list("work_calendars", { project_id: projectId }));
    const groups = sortBy(as<ScheduleGroup>(await tx.list("schedule_groups", { project_id: projectId })));
    const tasks = as<ScheduleTask>(await tx.list("schedule_tasks", { project_id: projectId }));
    const periods = sortBy(as<ValuedPeriod>(await tx.list("valued_periods", { project_id: projectId })).map((period) => ({ ...period, name: period.name })));
    const allocations = as<ValuedAllocation>(await tx.list("valued_allocations", { project_id: projectId }));
    const calendar = calendars.find((item) => item.id === project.calendar_id) ?? calendars[0];
    const hours = calendar ? [calendar.mon, calendar.tue, calendar.wed, calendar.thu, calendar.fri, calendar.sat, calendar.sun].map((value) => Number(value)) : [8, 8, 8, 8, 8, 0, 0];
    const curve = investmentCurve(
      periods.map((period) => ({ id: period.id, label: period.name })),
      allocations.map((allocation) => {
        const total = priced.rubros.find((rubro) => rubro.id === allocation.rubro_id)?.total ?? "0";
        return { periodId: allocation.period_id, amount: programmedAmount(total, [allocation.percent]) };
      }),
    );
    const threshold = as<VaeThreshold>(await tx.list("vae_thresholds", { org_id: session.orgId })).find((item) => item.id === project.vae_threshold_id);
    const contributors = as<Contributor>(await tx.list("contributors", { project_id: projectId })).map((contributor) => ({
      ...contributor,
      shares: contributorShares(priced.components, {
        material: contributor.material_percent,
        labor: contributor.labor_percent,
        equipment: contributor.equipment_percent,
        transport: contributor.transport_percent,
      }),
    }));
    return {
      session, project, chapters, rubros, lines, priced, indirects, indirectResult, symbols, terms, indices, weights, polynomial, crew,
      calendars, groups, tasks, periods, allocations, hours, curve, threshold,
      movements: as<WarehouseMovement>(await tx.list("warehouse_movements", { project_id: projectId })),
      advances, deductions: as<Deduction>(await tx.list("deductions", { project_id: projectId })),
      certificates: as<PaymentCertificate>(await tx.list("payment_certificates", { project_id: projectId })),
      certificateLines: as<CertificateLine>(await tx.list("certificate_lines", { project_id: projectId })),
      contributors, memo: (await tx.list("adjustment_memos", { project_id: projectId }))[0] ?? null,
      catalogRubros: sortBy(as<CatalogRubro>(await tx.list("catalog_rubros", { org_id: session.orgId })).map((rubro) => ({ ...rubro, sort_order: 0 }))),
      materials: as<Material>(await tx.list("materials", { org_id: session.orgId })),
      labor: as<LaborCategory>(await tx.list("labor_categories", { org_id: session.orgId })),
      equipment: as<Equipment>(await tx.list("equipment", { org_id: session.orgId })),
      transport: as<TransportRate>(await tx.list("transport_rates", { org_id: session.orgId })),
      cpc: await tx.list("cpc_codes", { org_id: session.orgId }),
      thresholds: as<VaeThreshold>(await tx.list("vae_thresholds", { org_id: session.orgId })),
      snapshots: as<PriceSnapshot>(await tx.list("price_snapshots", { org_id: session.orgId })),
      projects: as<Project>(await tx.list("projects", { org_id: session.orgId })).filter((item) => canSee(session, item.id) && item.id !== projectId),
      indirectsMatch: indirectsMatch(project.indirect_percent, indirectResult.percent),
      vaeOk: threshold ? meetsVaeThreshold(priced.vaePercent, threshold.percent) : true,
      hoursPerUnit,
      addWorkingDays,
      scheduleCloses,
      adjustedValue,
    };
  });
}

function symbolAmount(symbol: AdjustmentSymbol, priced: ReturnType<typeof priceBudget>, lines: ProjectLine[], rubros: ProjectRubro[]) {
  if (symbol.family === "minor_tool") return priced.components.minorTool;
  const family = symbol.family;
  return priced.rubros.reduce((sum, rubro) => {
    const source = rubros.find((item) => item.id === rubro.id);
    if (!source || source.is_auxiliary) return sum;
    const component = family === "material" ? rubro.components.material : family === "labor" ? rubro.components.labor : family === "equipment" ? rubro.components.equipment : family === "transport" ? rubro.components.transport : "0";
    return sum.plus(dec(component).mul(dec(source.quantity)));
  }, dec(0)).toFixed(6);
}

async function nextOrder(tx: Tx, table: TableName, filters: Record<string, string>) {
  const rows = await tx.list(table, filters);
  return rows.reduce((max, row) => Math.max(max, Number(row.sort_order ?? 0)), 0) + 1;
}

export async function addChapter(projectId: string, name: string) {
  const session = await requireSession();
  assertBudget(session);
  if (!name.trim()) throw new AppError("Indique el nombre del capítulo.");
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.insert("project_chapters", { org_id: session.orgId, project_id: projectId, name: name.trim(), sort_order: await nextOrder(tx, "project_chapters", { project_id: projectId }) });
  });
}

export async function renameRecord(table: TableName, id: string, patch: Record<string, unknown>, projectId?: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    if (projectId) await ownedProject(tx, session, projectId);
    await tx.update(table, id, patch);
  });
}

export async function moveRecord(table: TableName, id: string, direction: number, projectId: string, parentKey?: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    const current = (await tx.list(table, { id }))[0];
    if (!current) throw new AppError("Registro no encontrado.");
    const filters: Record<string, string> = { project_id: projectId };
    if (parentKey && current[parentKey]) filters[parentKey] = String(current[parentKey]);
    const rows = [...(await tx.list(table, filters))].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
    const index = rows.findIndex((row) => row.id === id);
    const swap = rows[index + direction];
    if (!swap) return;
    await tx.update(table, id, { sort_order: swap.sort_order });
    await tx.update(table, swap.id, { sort_order: current.sort_order });
  });
}

export async function removeOwned(table: TableName, id: string, projectId: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    if (table === "project_chapters") {
      const rubros = await tx.list("project_rubros", { chapter_id: id });
      for (const rubro of rubros) {
        for (const line of await tx.list("project_apu_lines", { rubro_id: rubro.id })) await tx.remove("project_apu_lines", line.id);
        await tx.remove("project_rubros", rubro.id);
      }
    }
    if (table === "project_rubros") {
      for (const line of await tx.list("project_apu_lines", { rubro_id: id })) await tx.remove("project_apu_lines", line.id);
      for (const line of await tx.list("project_apu_lines", { auxiliary_rubro_id: id })) await tx.remove("project_apu_lines", line.id);
    }
    await tx.remove(table, id);
  });
}

async function priceFor(tx: Tx, orgId: string, scheme: Project["price_scheme"], kind: string, refId: string) {
  if (kind === "material") {
    const item = as<Material>(await tx.list("materials", { id: refId, org_id: orgId }))[0];
    return item ? (scheme === "personal" ? item.personal_price : item.chamber_price) : "0";
  }
  if (kind === "labor") {
    const item = as<LaborCategory>(await tx.list("labor_categories", { id: refId, org_id: orgId }))[0];
    return item ? (scheme === "personal" ? item.hourly_personal : item.hourly_chamber) : "0";
  }
  if (kind === "equipment") {
    const item = as<Equipment>(await tx.list("equipment", { id: refId, org_id: orgId }))[0];
    return item ? (scheme === "personal" ? item.hourly_personal : item.hourly_chamber) : "0";
  }
  if (kind === "transport") {
    const item = as<TransportRate>(await tx.list("transport_rates", { id: refId, org_id: orgId }))[0];
    return item ? (scheme === "personal" ? item.rate_personal : item.rate_chamber) : "0";
  }
  return "0";
}

async function ensureAuxChapter(tx: Tx, session: Session, projectId: string) {
  const chapters = as<ProjectChapter>(await tx.list("project_chapters", { project_id: projectId }));
  const existing = chapters.find((chapter) => chapter.name.toLowerCase() === "auxiliares");
  if (existing) return existing.id;
  const created = await tx.insert("project_chapters", { org_id: session.orgId, project_id: projectId, name: "Auxiliares", sort_order: 0 });
  return created.id;
}

async function copyCatalogRubro(tx: Tx, session: Session, project: Project, catalogId: string, chapterId: string, copied: Map<string, string>, includeCatalog: boolean) {
  const existing = copied.get(catalogId);
  if (existing) return existing;
  const source = as<CatalogRubro>(await tx.list("catalog_rubros", { id: catalogId, org_id: session.orgId }))[0];
  if (!source) throw new AppError("El rubro de catálogo no existe.");
  const types = await tx.list("rubro_types", { org_id: session.orgId });
  const typeName = String(types.find((type) => type.id === source.type_id)?.name ?? "");
  const isAuxiliary = typeName.toLowerCase() === "auxiliar";
  const targetChapter = isAuxiliary ? await ensureAuxChapter(tx, session, project.id) : chapterId;
  const rubro = await tx.insert("project_rubros", {
    org_id: session.orgId, project_id: project.id, chapter_id: targetChapter, catalog_rubro_id: includeCatalog ? source.id : "",
    code: source.code, name: source.name, unit: source.unit, quantity: isAuxiliary ? "0" : "1", yield_rate: source.yield_rate || "1",
    is_subcontract: false, proposed_value: "0", is_auxiliary: isAuxiliary, minor_tool_percent: project.minor_tool_percent,
    origin: "EP", rubro_type: typeName, sort_order: await nextOrder(tx, "project_rubros", { chapter_id: targetChapter }),
  });
  copied.set(catalogId, rubro.id);
  const lines = as<CatalogLine>(await tx.list("catalog_apu_lines", { rubro_id: source.id })).sort((a, b) => a.sort_order - b.sort_order);
  for (const line of lines) {
    if (line.kind === "transport" && !project.transport_materials && !project.transport_equipment) continue;
    if (line.kind === "auxiliary") {
      const auxiliaryId = await copyCatalogRubro(tx, session, project, line.ref_id, chapterId, copied, includeCatalog);
      await tx.insert("project_apu_lines", {
        org_id: session.orgId, project_id: project.id, rubro_id: rubro.id, kind: "auxiliary", catalog_id: "", auxiliary_rubro_id: auxiliaryId,
        code: line.code, name: line.name, unit: line.unit, quantity: line.quantity, unit_price: "0", cpc_code: line.cpc_code, origin: line.origin, sort_order: line.sort_order,
      });
      continue;
    }
    await tx.insert("project_apu_lines", {
      org_id: session.orgId, project_id: project.id, rubro_id: rubro.id, kind: line.kind, catalog_id: line.ref_id, auxiliary_rubro_id: "",
      code: line.code, name: line.name, unit: line.unit, quantity: line.quantity,
      unit_price: await priceFor(tx, session.orgId, project.price_scheme, line.kind, line.ref_id),
      cpc_code: line.cpc_code, origin: line.origin, sort_order: line.sort_order,
    });
  }
  return rubro.id;
}

export async function addRubro(projectId: string, chapterId: string, input: Record<string, string>, catalogId = "") {
  const session = await requireSession();
  assertBudget(session);
  return transaction(async (tx) => {
    const project = await ownedProject(tx, session, projectId);
    if (catalogId) return copyCatalogRubro(tx, session, project, catalogId, chapterId, new Map(), true);
    if (!input.name?.trim()) throw new AppError("Indique el nombre del rubro.");
    const rubro = await tx.insert("project_rubros", {
      org_id: session.orgId, project_id: projectId, chapter_id: chapterId, catalog_rubro_id: "", code: input.code ?? "", name: input.name.trim(),
      unit: input.unit || "u", quantity: input.quantity || "1", yield_rate: input.yield_rate || "1", is_subcontract: input.is_subcontract === "true",
      proposed_value: input.proposed_value || "0", is_auxiliary: input.is_auxiliary === "true", minor_tool_percent: input.minor_tool_percent || project.minor_tool_percent,
      origin: input.origin || "ND", rubro_type: input.rubro_type || "", sort_order: await nextOrder(tx, "project_rubros", { chapter_id: chapterId }),
    });
    return rubro.id;
  });
}

export async function addLine(projectId: string, rubroId: string, input: Record<string, string>) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    const project = await ownedProject(tx, session, projectId);
    const rubro = as<ProjectRubro>(await tx.list("project_rubros", { id: rubroId }))[0];
    if (!rubro || rubro.is_auxiliary && input.kind === "auxiliary") throw new AppError("Un auxiliar no puede contener otro auxiliar.");
    let unitPrice = input.unit_price || "0";
    let name = input.name || "";
    let code = input.code || "";
    let unit = input.unit || "";
    if (input.catalog_id && input.kind !== "auxiliary") {
      unitPrice = await priceFor(tx, session.orgId, project.price_scheme, input.kind, input.catalog_id);
      const table = input.kind === "material" ? "materials" : input.kind === "labor" ? "labor_categories" : input.kind === "equipment" ? "equipment" : "transport_rates";
      const item = (await tx.list(table, { id: input.catalog_id }))[0];
      name = String(item?.name ?? name);
      code = String(item?.code ?? code);
      unit = String(item?.unit ?? (input.kind === "labor" || input.kind === "equipment" ? "h" : unit));
    }
    if (input.kind === "auxiliary") {
      const auxiliary = as<ProjectRubro>(await tx.list("project_rubros", { id: input.auxiliary_rubro_id }))[0];
      if (!auxiliary?.is_auxiliary) throw new AppError("Seleccione un rubro auxiliar.");
      name = auxiliary.name;
      code = auxiliary.code;
      unit = auxiliary.unit;
    }
    await tx.insert("project_apu_lines", {
      org_id: session.orgId, project_id: projectId, rubro_id: rubroId, kind: input.kind || "material", catalog_id: input.catalog_id || "",
      auxiliary_rubro_id: input.auxiliary_rubro_id || "", code, name, unit, quantity: input.quantity || "1", unit_price: unitPrice,
      cpc_code: input.cpc_code || "", origin: input.origin || "ND", sort_order: await nextOrder(tx, "project_apu_lines", { rubro_id: rubroId }),
    });
  });
}

export async function saveIndirect(projectId: string, id: string, patch: Record<string, unknown>, choice?: "general" | "breakdown") {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    const project = await ownedProject(tx, session, projectId);
    if (id) await tx.update("indirect_items", id, patch);
    if (choice === "breakdown") {
      const bundle = await reloadIndirectPercent(tx, project);
      await tx.update("projects", projectId, { indirect_percent: bundle, indirect_prevail: "breakdown" });
    }
    if (choice === "general") await tx.update("projects", projectId, { indirect_prevail: "general" });
  });
}

async function reloadIndirectPercent(tx: Tx, project: Project) {
  const indirects = as<IndirectItemRow>(await tx.list("indirect_items", { project_id: project.id }));
  const rubros = as<ProjectRubro>(await tx.list("project_rubros", { project_id: project.id }));
  const lines = as<ProjectLine>(await tx.list("project_apu_lines", { project_id: project.id }));
  const priced = priceBudget(toCost(project, rubros, lines), {
    yieldMode: project.yield_mode, minorToolMode: project.minor_tool_mode, minorToolPercent: project.minor_tool_percent, indirectPercent: project.indirect_percent,
  });
  const result = priceIndirects(indirects.map((item) => ({
    id: item.id, group: item.group_name, name: item.name, enabled: item.enabled, mode: item.mode, monthlyCost: item.monthly_cost,
    months: item.months, directTotal: item.direct_total, percent: item.percent, advancePercent: item.advance_percent,
    premiumPercent: item.premium_percent, guaranteePercent: item.guarantee_percent,
  })), { direct: priced.direct, contract: priced.total, readjustment: "0", capital: "0" });
  return result.percent;
}

export async function addIndirect(projectId: string, name: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.insert("indirect_items", {
      org_id: session.orgId, project_id: projectId, group_name: "misc", name: name || "Concepto nuevo", enabled: true, mode: "total",
      monthly_cost: "0", months: "1", direct_total: "0", percent: "0", advance_percent: "0", premium_percent: "0", guarantee_percent: "0",
      sort_order: await nextOrder(tx, "indirect_items", { project_id: projectId }),
    });
  });
}

export async function saveIndex(projectId: string, symbolId: string, kind: string, value: string, coefficient?: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    const index = as<PriceIndex>(await tx.list("price_indices", { project_id: projectId, symbol_id: symbolId, kind }))[0];
    if (index) await tx.update("price_indices", index.id, { value });
    if (coefficient !== undefined) {
      const term = as<PolynomialTerm>(await tx.list("polynomial_terms", { project_id: projectId, symbol_id: symbolId }))[0];
      if (term) await tx.update("polynomial_terms", term.id, { coefficient });
    }
  });
}

export async function saveMemo(projectId: string, body: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    const memo = (await tx.list("adjustment_memos", { project_id: projectId }))[0];
    if (memo) await tx.update("adjustment_memos", memo.id, { body, author: session.fullName, memo_date: todayIso() });
  });
}

export async function ensureSchedule(projectId: string) {
  const session = await requireSession();
  await transaction(async (tx) => {
    const project = await ownedProject(tx, session, projectId);
    const chapters = sortBy(as<ProjectChapter>(await tx.list("project_chapters", { project_id: projectId })));
    let groups = as<ScheduleGroup>(await tx.list("schedule_groups", { project_id: projectId }));
    if (!groups.length) {
      for (const chapter of chapters) {
        await tx.insert("schedule_groups", { org_id: session.orgId, project_id: projectId, name: chapter.name, chapter_id: chapter.id, sort_order: chapter.sort_order });
      }
      groups = as<ScheduleGroup>(await tx.list("schedule_groups", { project_id: projectId }));
    }
    const rubros = as<ProjectRubro>(await tx.list("project_rubros", { project_id: projectId })).filter((rubro) => !rubro.is_auxiliary);
    const tasks = as<ScheduleTask>(await tx.list("schedule_tasks", { project_id: projectId }));
    for (const rubro of rubros) {
      if (tasks.some((task) => task.rubro_id === rubro.id)) continue;
      const group = groups.find((item) => item.chapter_id === rubro.chapter_id) ?? groups[0];
      await tx.insert("schedule_tasks", {
        org_id: session.orgId, project_id: projectId, rubro_id: rubro.id, group_id: group?.id ?? "", start_date: project.work_start || todayIso(), duration_days: "5", responsible: "",
      });
    }
  });
}

export async function regroup(projectId: string, manual: boolean) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    if (manual) {
      for (const group of await tx.list("schedule_groups", { project_id: projectId })) await tx.update("schedule_groups", group.id, { chapter_id: "" });
      return;
    }
    for (const group of await tx.list("schedule_groups", { project_id: projectId })) await tx.remove("schedule_groups", group.id);
    for (const task of await tx.list("schedule_tasks", { project_id: projectId })) await tx.remove("schedule_tasks", task.id);
  });
  if (!manual) await ensureSchedule(projectId);
}

export async function generatePeriods(projectId: string, days: number, count: number) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    const project = await ownedProject(tx, session, projectId);
    for (const period of await tx.list("valued_periods", { project_id: projectId })) await tx.remove("valued_periods", period.id);
    for (const allocation of await tx.list("valued_allocations", { project_id: projectId })) await tx.remove("valued_allocations", allocation.id);
    let cursor = project.work_start || todayIso();
    for (let index = 0; index < count; index += 1) {
      const end = addWorkingDays(cursor, Math.max(days, 1), [8, 8, 8, 8, 8, 0, 0]);
      await tx.insert("valued_periods", { org_id: session.orgId, project_id: projectId, name: `Periodo ${index + 1}`, start_date: cursor, end_date: end, sort_order: index + 1 });
      const next = new Date(`${end}T12:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      cursor = next.toISOString().slice(0, 10);
    }
  });
}

export async function saveAllocation(projectId: string, periodId: string, rubroId: string, percent: string, subperiod: boolean) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    const current = as<ValuedAllocation>(await tx.list("valued_allocations", { project_id: projectId })).find((item) => item.period_id === periodId && item.rubro_id === rubroId && item.is_subperiod === subperiod);
    if (current) await tx.update("valued_allocations", current.id, { percent });
    else await tx.insert("valued_allocations", { org_id: session.orgId, project_id: projectId, period_id: periodId, rubro_id: rubroId, percent, is_subperiod: subperiod });
  });
}

export async function fillFull(projectId: string, rubroId: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    for (const row of as<ValuedAllocation>(await tx.list("valued_allocations", { project_id: projectId, rubro_id: rubroId }))) await tx.remove("valued_allocations", row.id);
    const periods = sortBy(as<ValuedPeriod>(await tx.list("valued_periods", { project_id: projectId })).map((period) => ({ ...period, name: period.name })));
    const task = as<ScheduleTask>(await tx.list("schedule_tasks", { project_id: projectId, rubro_id: rubroId }))[0];
    const period = periods.find((item) => task && item.start_date <= task.start_date && item.end_date >= task.start_date) ?? periods[0];
    if (!period) throw new AppError("Genere primero los períodos del cronograma valorado.");
    await tx.insert("valued_allocations", { org_id: session.orgId, project_id: projectId, period_id: period.id, rubro_id: rubroId, percent: "100", is_subperiod: false });
  });
}

export async function addMovement(projectId: string, input: Record<string, string>) {
  const session = await requireSession();
  assertWarehouse(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.insert("warehouse_movements", {
      org_id: session.orgId, project_id: projectId, kind: input.kind === "out" ? "out" : "in", material_name: input.material_name,
      rubro_id: input.rubro_id || "", quantity: input.quantity || "0", unit_price: input.unit_price || "0", invoice: input.invoice || "",
      supplier_name: input.supplier_name || "", movement_date: input.movement_date || todayIso(),
    });
  });
}

export async function removeWarehouse(projectId: string, id: string) {
  const session = await requireSession();
  assertWarehouse(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.remove("warehouse_movements", id);
  });
}

export async function addAdvance(projectId: string, amount: string, date: string, note: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.insert("contract_advances", { org_id: session.orgId, project_id: projectId, amount, advance_date: date || todayIso(), note });
  });
}

export async function addDeduction(projectId: string, name: string, mode: string, amount: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.insert("deductions", { org_id: session.orgId, project_id: projectId, name, mode, amount });
  });
}

export async function removeExecution(table: TableName, projectId: string, id: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.remove(table, id);
  });
}

export async function createCertificate(projectId: string, periodLabel: string) {
  const session = await requireSession();
  assertBudget(session);
  return transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    const existing = as<PaymentCertificate>(await tx.list("payment_certificates", { project_id: projectId }));
    const number = existing.reduce((max, row) => Math.max(max, row.number), 0) + 1;
    const certificate = await tx.insert("payment_certificates", {
      org_id: session.orgId, project_id: projectId, number, period_label: periodLabel || `Planilla ${number}`, certificate_date: todayIso(), amortization_percent: "0",
    });
    const rubros = as<ProjectRubro>(await tx.list("project_rubros", { project_id: projectId })).filter((rubro) => !rubro.is_auxiliary);
    const previous = as<CertificateLine>(await tx.list("certificate_lines", { project_id: projectId }));
    for (const rubro of rubros) {
      const quantityPrevious = previous.filter((line) => line.rubro_id === rubro.id).reduce((sum, line) => sum.plus(dec(line.quantity_period)), dec(0)).toFixed(4);
      await tx.insert("certificate_lines", { org_id: session.orgId, project_id: projectId, certificate_id: certificate.id, rubro_id: rubro.id, quantity_period: "0", quantity_previous: quantityPrevious });
    }
    return certificate.id;
  });
}

export async function saveCertificateLine(projectId: string, lineId: string, quantity: string, amortization?: string, certificateId?: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.update("certificate_lines", lineId, { quantity_period: quantity });
    if (amortization !== undefined && certificateId) await tx.update("payment_certificates", certificateId, { amortization_percent: amortization });
  });
}

export async function refreshPrices(projectId: string, source: string, snapshotId: string, families: string[]) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    const project = await ownedProject(tx, session, projectId);
    const scheme = source === "personal" ? "personal" : project.price_scheme;
    const snapshotLines = source === "snapshot" ? as<PriceSnapshotLine>(await tx.list("price_snapshot_lines", { snapshot_id: snapshotId })) : [];
    const lines = as<ProjectLine>(await tx.list("project_apu_lines", { project_id: projectId }));
    for (const line of lines) {
      if (families.length && !families.includes(line.kind)) continue;
      if (line.kind === "auxiliary") continue;
      if (source === "snapshot") {
        const found = snapshotLines.find((item) => item.item_id === line.catalog_id);
        if (!found) continue;
        await tx.update("project_apu_lines", line.id, { unit_price: scheme === "personal" ? found.personal_price : found.chamber_price });
        continue;
      }
      await tx.update("project_apu_lines", line.id, { unit_price: await priceFor(tx, session.orgId, scheme, line.kind, line.catalog_id) });
    }
  });
}

export async function bumpPrices(projectId: string, percent: string, family: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    const lines = as<ProjectLine>(await tx.list("project_apu_lines", { project_id: projectId }));
    for (const line of lines) {
      if (family && line.kind !== family) continue;
      await tx.update("project_apu_lines", line.id, { unit_price: money(dec(line.unit_price).mul(dec(100).plus(dec(percent))).div(100)) });
    }
  });
}

export async function replaceInput(projectId: string, query: string, kind: string, catalogId: string) {
  const session = await requireSession();
  assertBudget(session);
  const needle = query.trim().toLowerCase();
  if (!needle) throw new AppError("Indique el código o el nombre a reemplazar.");
  await transaction(async (tx) => {
    const project = await ownedProject(tx, session, projectId);
    const lines = as<ProjectLine>(await tx.list("project_apu_lines", { project_id: projectId }));
    const price = await priceFor(tx, session.orgId, project.price_scheme, kind, catalogId);
    const table = kind === "material" ? "materials" : kind === "labor" ? "labor_categories" : kind === "equipment" ? "equipment" : "transport_rates";
    const item = (await tx.list(table, { id: catalogId }))[0];
    if (!item) throw new AppError("Seleccione el insumo de reemplazo.");
    for (const line of lines) {
      if (line.kind !== kind) continue;
      if (line.code.toLowerCase() !== needle && !line.name.toLowerCase().includes(needle)) continue;
      await tx.update("project_apu_lines", line.id, {
        catalog_id: catalogId, code: item.code, name: item.name, unit: item.unit ?? line.unit, unit_price: price,
      });
    }
  });
}

export async function importFromProject(projectId: string, sourceId: string, includeCatalog: boolean) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    const target = await ownedProject(tx, session, projectId);
    const source = await ownedProject(tx, session, sourceId);
    const chapters = sortBy(as<ProjectChapter>(await tx.list("project_chapters", { project_id: source.id })));
    const chapterMap = new Map<string, string>();
    for (const chapter of chapters) {
      const next = await tx.insert("project_chapters", { org_id: session.orgId, project_id: target.id, name: chapter.name, sort_order: await nextOrder(tx, "project_chapters", { project_id: target.id }) });
      chapterMap.set(chapter.id, next.id);
      if (includeCatalog) await tx.insert("catalog_chapters", { org_id: session.orgId, code: "", name: chapter.name, sort_order: next.sort_order });
    }
    const rubros = sortBy(as<ProjectRubro>(await tx.list("project_rubros", { project_id: source.id })));
    const rubroMap = new Map<string, string>();
    for (const rubro of rubros) {
      const next = await tx.insert("project_rubros", { ...rubro, id: undefined, project_id: target.id, chapter_id: chapterMap.get(rubro.chapter_id) ?? "" });
      rubroMap.set(rubro.id, next.id);
      if (includeCatalog) {
        await tx.insert("catalog_rubros", { org_id: session.orgId, chapter_id: "", type_id: "", code: rubro.code, name: rubro.name, unit: rubro.unit, yield_rate: rubro.yield_rate });
      }
    }
    for (const line of as<ProjectLine>(await tx.list("project_apu_lines", { project_id: source.id }))) {
      await tx.insert("project_apu_lines", { ...line, id: undefined, project_id: target.id, rubro_id: rubroMap.get(line.rubro_id) ?? "", auxiliary_rubro_id: rubroMap.get(line.auxiliary_rubro_id) ?? "" });
    }
  });
}

const USAGE: Record<string, { table: TableName; field: string }[]> = {
  materials: [{ table: "catalog_apu_lines", field: "ref_id" }, { table: "project_apu_lines", field: "catalog_id" }, { table: "material_suppliers", field: "material_id" }],
  equipment: [{ table: "catalog_apu_lines", field: "ref_id" }, { table: "project_apu_lines", field: "catalog_id" }],
  labor_categories: [{ table: "catalog_apu_lines", field: "ref_id" }, { table: "project_apu_lines", field: "catalog_id" }],
  transport_rates: [{ table: "catalog_apu_lines", field: "ref_id" }, { table: "project_apu_lines", field: "catalog_id" }],
  cities: [{ table: "suppliers", field: "city_id" }],
  suppliers: [{ table: "material_suppliers", field: "supplier_id" }],
  catalog_chapters: [{ table: "catalog_rubros", field: "chapter_id" }],
  rubro_types: [{ table: "catalog_rubros", field: "type_id" }],
  catalog_rubros: [{ table: "catalog_apu_lines", field: "rubro_id" }, { table: "project_rubros", field: "catalog_rubro_id" }],
  cpc_codes: [{ table: "catalog_apu_lines", field: "cpc_code" }, { table: "project_apu_lines", field: "cpc_code" }],
  vae_thresholds: [{ table: "projects", field: "vae_threshold_id" }],
};

export async function saveCatalog(table: TableName, id: string, data: Record<string, unknown>) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    const row = { ...data, org_id: session.orgId };
    if (id) await tx.update(table, id, row);
    else await tx.insert(table, row);
  });
}

export async function deleteCatalog(table: TableName, id: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    const current = (await tx.list(table, { id, org_id: session.orgId }))[0];
    if (!current) throw new AppError("Registro no encontrado.");
    if (table === "units") {
      const code = String(current.code);
      const tables: TableName[] = ["materials", "catalog_rubros", "transport_rates", "unit_conversions"];
      for (const name of tables) {
        const rows = await tx.list(name, { org_id: session.orgId });
        if (rows.some((row) => row.unit === code || row.from_unit === code || row.to_unit === code)) throw new AppError("La unidad está en uso y no se puede eliminar.");
      }
    }
    for (const usage of USAGE[table] ?? []) {
      const rows = await tx.list(usage.table, { org_id: session.orgId });
      const value = usage.field === "cpc_code" ? current.code : id;
      if (rows.some((row) => row[usage.field] === value && row[usage.field] !== "")) throw new AppError("El registro está en uso y no se puede eliminar.");
    }
    if (table === "price_snapshots") {
      for (const line of await tx.list("price_snapshot_lines", { snapshot_id: id })) await tx.remove("price_snapshot_lines", line.id);
    }
    await tx.remove(table, id);
  });
}

export async function linkSupplier(materialId: string, supplierId: string) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await tx.insert("material_suppliers", { org_id: session.orgId, material_id: materialId, supplier_id: supplierId });
  });
}

export async function createSnapshot(note: string, families: string[]) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    const snapshot = await tx.insert("price_snapshots", { org_id: session.orgId, captured_on: todayIso(), note: note || "Histórico" });
    const specs = [
      ["material", "materials", "chamber_price", "personal_price"],
      ["labor", "labor_categories", "hourly_chamber", "hourly_personal"],
      ["equipment", "equipment", "hourly_chamber", "hourly_personal"],
      ["transport", "transport_rates", "rate_chamber", "rate_personal"],
    ] as const;
    for (const [family, table, chamber, personal] of specs) {
      if (families.length && !families.includes(family)) continue;
      for (const item of await tx.list(table, { org_id: session.orgId })) {
        await tx.insert("price_snapshot_lines", {
          org_id: session.orgId, snapshot_id: snapshot.id, family, item_id: item.id, code: item.code, name: item.name,
          chamber_price: item[chamber], personal_price: item[personal],
        });
      }
    }
  });
}

export async function purgeBase(families: string[], confirmation: string) {
  const session = await requireSession();
  assertAdmin(session);
  if (confirmation.trim() !== session.orgName) throw new AppError("Escriba el nombre de la organización para confirmar.");
  const selected = new Set(families);
  const plan: TableName[] = [];
  if (selected.has("analisis") || selected.has("rubros")) plan.push("catalog_apu_lines");
  if (selected.has("rubros")) plan.push("catalog_rubros", "rubro_types");
  if (selected.has("capitulos")) plan.push("catalog_chapters");
  if (selected.has("materiales")) plan.push("material_suppliers", "materials");
  if (selected.has("equipos")) plan.push("equipment");
  if (selected.has("mano")) plan.push("labor_categories");
  if (selected.has("transporte")) plan.push("transport_rates");
  if (selected.has("proveedores")) plan.push("suppliers");
  if (selected.has("ciudades")) plan.push("cities");
  if (selected.has("equivalencias")) plan.push("unit_conversions");
  if (selected.has("unidades")) plan.push("units");
  if (selected.has("historicos")) plan.push("price_snapshot_lines", "price_snapshots");
  if (selected.has("cpc")) plan.push("cpc_codes");
  if (selected.has("umbrales")) plan.push("vae_thresholds");
  await transaction(async (tx) => {
    for (const table of plan) {
      for (const row of await tx.list(table, { org_id: session.orgId })) await tx.remove(table, row.id);
    }
  });
}

export async function recalculateFamily(family: "material" | "labor" | "equipment" | "transport", scheme: "chamber" | "personal") {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    const lines = as<ProjectLine>(await tx.list("project_apu_lines", { org_id: session.orgId, kind: family }));
    for (const line of lines) {
      await tx.update("project_apu_lines", line.id, { unit_price: await priceFor(tx, session.orgId, scheme, family, line.catalog_id) });
    }
  });
}

export async function orgCatalog() {
  const session = await requireSession();
  return transaction(async (tx) => {
    const org = session.orgId;
    return {
      session,
      units: await tx.list("units", { org_id: org }),
      conversions: await tx.list("unit_conversions", { org_id: org }),
      cities: await tx.list("cities", { org_id: org }),
      suppliers: await tx.list("suppliers", { org_id: org }),
      materials: await tx.list("materials", { org_id: org }),
      links: await tx.list("material_suppliers", { org_id: org }),
      equipment: await tx.list("equipment", { org_id: org }),
      labor: await tx.list("labor_categories", { org_id: org }),
      transport: await tx.list("transport_rates", { org_id: org }),
      chapters: await tx.list("catalog_chapters", { org_id: org }),
      types: await tx.list("rubro_types", { org_id: org }),
      rubros: await tx.list("catalog_rubros", { org_id: org }),
      analysis: await tx.list("catalog_apu_lines", { org_id: org }),
      snapshots: await tx.list("price_snapshots", { org_id: org }),
      snapshotLines: await tx.list("price_snapshot_lines", { org_id: org }),
      cpc: await tx.list("cpc_codes", { org_id: org }),
      thresholds: await tx.list("vae_thresholds", { org_id: org }),
    };
  });
}

export async function addContributor(projectId: string, input: Record<string, string>) {
  const session = await requireSession();
  assertBudget(session);
  await transaction(async (tx) => {
    await ownedProject(tx, session, projectId);
    await tx.insert("contributors", {
      org_id: session.orgId, project_id: projectId, company: input.company, material_percent: input.material_percent || "0",
      labor_percent: input.labor_percent || "0", equipment_percent: input.equipment_percent || "0", transport_percent: input.transport_percent || "0",
    });
  });
}

export async function importRows(projectName: string, rows: { chapter: string; code: string; rubro: string; unit: string; quantity: string; yieldRate: string; kind: string; inputCode: string; inputName: string; inputUnit: string; inputQty: string; price: string; origin: string; cpc: string; subcontract: boolean; proposed: string; auxiliary: boolean }[], includeCatalog: boolean) {
  const session = await requireSession();
  assertBudget(session);
  return transaction(async (tx) => {
    const projectId = (await tx.insert("projects", blankProject(session, projectName, todayIso()))).id;
    await tx.insert("project_members", { org_id: session.orgId, project_id: projectId, user_id: session.userId });
    await seedProjectExtras(tx, session, projectId);
    const project = as<Project>(await tx.list("projects", { id: projectId }))[0];
    const chapters = new Map<string, string>();
    const rubros = new Map<string, string>();
    for (const row of rows) {
      if (!chapters.has(row.chapter)) {
        const chapter = await tx.insert("project_chapters", { org_id: session.orgId, project_id: projectId, name: row.chapter || "Capítulo", sort_order: chapters.size + 1 });
        chapters.set(row.chapter, chapter.id);
        if (includeCatalog) await tx.insert("catalog_chapters", { org_id: session.orgId, code: "", name: row.chapter, sort_order: chapters.size });
      }
      const key = `${row.chapter}|${row.code}|${row.rubro}`;
      if (!rubros.has(key)) {
        const rubro = await tx.insert("project_rubros", {
          org_id: session.orgId, project_id: projectId, chapter_id: chapters.get(row.chapter), catalog_rubro_id: "", code: row.code, name: row.rubro,
          unit: row.unit || "u", quantity: row.quantity || "0", yield_rate: row.yieldRate || "1", is_subcontract: row.subcontract, proposed_value: row.proposed || "0",
          is_auxiliary: row.auxiliary, minor_tool_percent: project.minor_tool_percent, origin: row.origin || "ND", rubro_type: "", sort_order: rubros.size + 1,
        });
        rubros.set(key, rubro.id);
        if (includeCatalog) await tx.insert("catalog_rubros", { org_id: session.orgId, chapter_id: "", type_id: "", code: row.code, name: row.rubro, unit: row.unit, yield_rate: row.yieldRate || "1" });
      }
      if (!row.inputName) continue;
      await tx.insert("project_apu_lines", {
        org_id: session.orgId, project_id: projectId, rubro_id: rubros.get(key), kind: row.kind || "material", catalog_id: "", auxiliary_rubro_id: "",
        code: row.inputCode, name: row.inputName, unit: row.inputUnit, quantity: row.inputQty || "0", unit_price: row.price || "0", cpc_code: row.cpc, origin: row.origin || "ND", sort_order: 1,
      });
    }
    return projectId;
  });
}

export async function persistCrew(projectId: string) {
  const data = await projectBundle(projectId);
  assertBudget(data.session);
  await transaction(async (tx) => {
    for (const row of await tx.list("crew_weights", { project_id: projectId })) await tx.remove("crew_weights", row.id);
    for (const row of data.crew) {
      await tx.insert("crew_weights", { org_id: data.session.orgId, project_id: projectId, labor_id: row.id, name: row.id, weight: row.weight });
    }
  });
}

export { hoursPerUnit };
