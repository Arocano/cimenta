"use server";

import { redirect } from "next/navigation";
import {
  addAdvance,
  addChapter,
  addContributor,
  addDeduction,
  addIndirect,
  addLine,
  addMovement,
  addRubro,
  bumpPrices,
  copyProject,
  createCertificate,
  createProject,
  createSnapshot,
  deleteCatalog,
  fillFull,
  generatePeriods,
  importFromProject,
  importRows,
  linkSupplier,
  moveRecord,
  persistCrew,
  purgeBase,
  recalculateFamily,
  refreshPrices,
  regroup,
  removeExecution,
  removeOwned,
  removeProject,
  removeWarehouse,
  renameRecord,
  replaceInput,
  saveAllocation,
  saveCatalog,
  saveCertificateLine,
  saveIndex,
  saveIndirect,
  saveMemo,
  updateProject,
} from "@/lib/domain";
import { parseBudgetSheet } from "@/lib/files";
import { assignProjects, createMember, loginAccount, logoutAccount, registerAccount, switchOrganization } from "@/lib/session";
import type { Role, TableName } from "@/lib/types";

function bounce(error: unknown, path: string): never {
  if (typeof error === "object" && error && "digest" in error && String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) throw error;
  const message = error instanceof Error ? error.message : "No se pudo completar la operación.";
  const join = path.includes("?") ? "&" : "?";
  redirect(`${path}${join}aviso=${encodeURIComponent(message)}`);
}

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

const CATALOG_TABLES = new Set<TableName>([
  "units", "unit_conversions", "cities", "suppliers", "materials", "equipment", "labor_categories", "transport_rates",
  "catalog_chapters", "rubro_types", "catalog_rubros", "catalog_apu_lines", "cpc_codes", "vae_thresholds",
]);

export async function loginAction(form: FormData) {
  try {
    await loginAccount(text(form, "email"), String(form.get("password") ?? ""));
    redirect("/");
  } catch (error) {
    bounce(error, "/login");
  }
}

export async function registerAction(form: FormData) {
  try {
    await registerAccount({
      email: text(form, "email"),
      password: String(form.get("password") ?? ""),
      fullName: text(form, "fullName"),
      orgName: text(form, "orgName"),
      invitation: text(form, "invitation"),
    });
    redirect("/");
  } catch (error) {
    bounce(error, "/registro");
  }
}

export async function logoutAction() {
  await logoutAccount();
  redirect("/login");
}

export async function switchOrgAction(form: FormData) {
  try {
    await switchOrganization(text(form, "orgId"));
    redirect("/");
  } catch (error) {
    bounce(error, "/");
  }
}

export async function createProjectAction(form: FormData) {
  try {
    const id = await createProject(text(form, "name"), text(form, "proposed_date"));
    redirect(`/obras/${id}`);
  } catch (error) {
    bounce(error, "/");
  }
}

export async function copyProjectAction(form: FormData) {
  const id = text(form, "id");
  try {
    const copy = await copyProject(id);
    redirect(`/obras/${copy}`);
  } catch (error) {
    bounce(error, "/");
  }
}

export async function deleteProjectAction(form: FormData) {
  try {
    await removeProject(text(form, "id"));
    redirect("/");
  } catch (error) {
    bounce(error, `/obras/${text(form, "id")}`);
  }
}

export async function saveProjectAction(form: FormData) {
  const id = text(form, "id");
  try {
    await updateProject(id, {
      name: text(form, "name"),
      proposed_date: text(form, "proposed_date"),
      proponent: text(form, "proponent"),
      owner_name: text(form, "owner_name"),
      calculated_by: text(form, "calculated_by"),
      reviewed_by: text(form, "reviewed_by"),
      description: text(form, "description"),
      province: text(form, "province"),
      canton: text(form, "canton"),
      parish: text(form, "parish"),
      sector: text(form, "sector"),
      address: text(form, "address"),
      yield_mode: text(form, "yield_mode"),
      minor_tool_mode: text(form, "minor_tool_mode"),
      minor_tool_percent: text(form, "minor_tool_percent") || "0",
      transport_materials: text(form, "transport_materials") === "si",
      transport_equipment: text(form, "transport_equipment") === "si",
      price_scheme: text(form, "price_scheme"),
      indirect_percent: text(form, "indirect_percent") || "0",
      contributors_enabled: text(form, "contributors_enabled") === "si",
      vae_threshold_id: text(form, "vae_threshold_id"),
      work_start: text(form, "work_start"),
    });
    redirect(`/obras/${id}?aviso=${encodeURIComponent("Datos de la obra guardados.")}`);
  } catch (error) {
    bounce(error, `/obras/${id}`);
  }
}

export async function addChapterAction(form: FormData) {
  const id = text(form, "projectId");
  try {
    await addChapter(id, text(form, "name"));
    redirect(`/obras/${id}/presupuesto`);
  } catch (error) {
    bounce(error, `/obras/${id}/presupuesto`);
  }
}

export async function moveAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await moveRecord(text(form, "table") as TableName, text(form, "id"), Number(text(form, "direction")), projectId, text(form, "parent") || undefined);
    redirect(text(form, "back") || `/obras/${projectId}/presupuesto`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/presupuesto`);
  }
}

export async function removeBudgetAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await removeOwned(text(form, "table") as TableName, text(form, "id"), projectId);
    redirect(text(form, "back") || `/obras/${projectId}/presupuesto`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/presupuesto`);
  }
}

export async function addRubroAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await addRubro(projectId, text(form, "chapterId"), {
      code: text(form, "code"),
      name: text(form, "name"),
      unit: text(form, "unit"),
      quantity: text(form, "quantity"),
      yield_rate: text(form, "yield_rate"),
      is_subcontract: text(form, "is_subcontract"),
      proposed_value: text(form, "proposed_value"),
      is_auxiliary: text(form, "is_auxiliary"),
      origin: text(form, "origin"),
    }, text(form, "catalogId"));
    redirect(`/obras/${projectId}/presupuesto?capitulo=${text(form, "chapterId")}`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/presupuesto`);
  }
}

export async function updateRubroAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await renameRecord("project_rubros", text(form, "id"), {
      code: text(form, "code"),
      name: text(form, "name"),
      unit: text(form, "unit"),
      quantity: text(form, "quantity"),
      yield_rate: text(form, "yield_rate"),
      is_subcontract: text(form, "is_subcontract") === "si",
      proposed_value: text(form, "proposed_value") || "0",
      is_auxiliary: text(form, "is_auxiliary") === "si",
      minor_tool_percent: text(form, "minor_tool_percent") || "0",
      origin: text(form, "origin") || "ND",
    }, projectId);
    redirect(`/obras/${projectId}/presupuesto?capitulo=${text(form, "chapterId")}&rubro=${text(form, "id")}`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/presupuesto`);
  }
}

export async function addLineAction(form: FormData) {
  const projectId = text(form, "projectId");
  const back = `/obras/${projectId}/presupuesto?capitulo=${text(form, "chapterId")}&rubro=${text(form, "rubroId")}`;
  try {
    const ref = text(form, "ref");
    const [kind, catalogId] = ref.includes("|") ? ref.split("|") : [text(form, "kind") || "material", ""];
    await addLine(projectId, text(form, "rubroId"), {
      kind,
      catalog_id: kind === "auxiliary" ? "" : catalogId,
      auxiliary_rubro_id: kind === "auxiliary" ? catalogId : "",
      name: text(form, "name"),
      code: text(form, "code"),
      unit: text(form, "unit"),
      quantity: text(form, "quantity") || "1",
      unit_price: text(form, "unit_price"),
      origin: text(form, "origin") || "ND",
      cpc_code: text(form, "cpc_code"),
    });
    redirect(back);
  } catch (error) {
    bounce(error, back);
  }
}

export async function updateLineAction(form: FormData) {
  const projectId = text(form, "projectId");
  const back = `/obras/${projectId}/${text(form, "section") || "presupuesto"}?capitulo=${text(form, "chapterId")}&rubro=${text(form, "rubroId")}`;
  try {
    await renameRecord("project_apu_lines", text(form, "id"), {
      quantity: text(form, "quantity"),
      unit_price: text(form, "unit_price"),
      origin: text(form, "origin"),
      cpc_code: text(form, "cpc_code"),
    }, projectId);
    redirect(back);
  } catch (error) {
    bounce(error, back);
  }
}

export async function saveIndirectAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await saveIndirect(projectId, text(form, "id"), {
      name: text(form, "name"),
      enabled: text(form, "enabled") === "si",
      mode: text(form, "mode"),
      monthly_cost: text(form, "monthly_cost") || "0",
      months: text(form, "months") || "0",
      direct_total: text(form, "direct_total") || "0",
      percent: text(form, "percent") || "0",
      advance_percent: text(form, "advance_percent") || "0",
      premium_percent: text(form, "premium_percent") || "0",
      guarantee_percent: text(form, "guarantee_percent") || "0",
    }, (text(form, "choice") || undefined) as "general" | "breakdown" | undefined);
    redirect(`/obras/${projectId}/indirectos?aviso=${encodeURIComponent("Indirectos actualizados.")}`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/indirectos`);
  }
}

export async function addIndirectAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await addIndirect(projectId, text(form, "name"));
    redirect(`/obras/${projectId}/indirectos`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/indirectos`);
  }
}

export async function saveSymbolAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await saveIndex(projectId, text(form, "symbolId"), "base", text(form, "base") || "0", text(form, "coefficient"));
    await saveIndex(projectId, text(form, "symbolId"), "period", text(form, "period") || "0");
    redirect(`/obras/${projectId}/reajuste`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/reajuste`);
  }
}

export async function saveMemoAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await saveMemo(projectId, String(form.get("body") ?? ""));
    await persistCrew(projectId);
    redirect(`/obras/${projectId}/reajuste?aviso=${encodeURIComponent("Informe y cuadrilla guardados.")}`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/reajuste`);
  }
}

export async function saveTaskAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await renameRecord("schedule_tasks", text(form, "id"), {
      start_date: text(form, "start_date"),
      duration_days: text(form, "duration_days") || "1",
      responsible: text(form, "responsible"),
      group_id: text(form, "group_id"),
    }, projectId);
    redirect(`/obras/${projectId}/cronograma?escala=${text(form, "escala") || "semana"}`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/cronograma`);
  }
}

export async function calendarAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    if (text(form, "calendarId")) {
      await renameRecord("work_calendars", text(form, "calendarId"), {
        name: text(form, "name"), mon: text(form, "mon"), tue: text(form, "tue"), wed: text(form, "wed"),
        thu: text(form, "thu"), fri: text(form, "fri"), sat: text(form, "sat"), sun: text(form, "sun"),
      }, projectId);
      await updateProject(projectId, { calendar_id: text(form, "calendarId"), work_start: text(form, "work_start") });
    }
    redirect(`/obras/${projectId}/cronograma`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/cronograma`);
  }
}

export async function regroupAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await regroup(projectId, text(form, "manual") === "si");
    redirect(`/obras/${projectId}/cronograma`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/cronograma`);
  }
}

export async function periodsAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await generatePeriods(projectId, Number(text(form, "days") || 7), Number(text(form, "count") || 4));
    redirect(`/obras/${projectId}/cronograma`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/cronograma`);
  }
}

export async function allocationAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    if (text(form, "full") === "si") await fillFull(projectId, text(form, "rubroId"));
    else await saveAllocation(projectId, text(form, "periodId"), text(form, "rubroId"), text(form, "percent") || "0", text(form, "subperiod") === "si");
    redirect(`/obras/${projectId}/cronograma`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/cronograma`);
  }
}

export async function movementAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await addMovement(projectId, {
      kind: text(form, "kind"), material_name: text(form, "material_name"), rubro_id: text(form, "rubro_id"),
      quantity: text(form, "quantity"), unit_price: text(form, "unit_price"), invoice: text(form, "invoice"),
      supplier_name: text(form, "supplier_name"), movement_date: text(form, "movement_date"),
    });
    redirect(`/obras/${projectId}/bodega`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/bodega`);
  }
}

export async function removeMovementAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await removeWarehouse(projectId, text(form, "id"));
    redirect(`/obras/${projectId}/bodega`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/bodega`);
  }
}

export async function advanceAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await addAdvance(projectId, text(form, "amount") || "0", text(form, "advance_date"), text(form, "note"));
    redirect(`/obras/${projectId}/planillas`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/planillas`);
  }
}

export async function deductionAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await addDeduction(projectId, text(form, "name"), text(form, "mode") || "amount", text(form, "amount") || "0");
    redirect(`/obras/${projectId}/planillas`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/planillas`);
  }
}

export async function removeExecutionAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await removeExecution(text(form, "table") as TableName, projectId, text(form, "id"));
    redirect(`/obras/${projectId}/planillas`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/planillas`);
  }
}

export async function certificateAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    const id = await createCertificate(projectId, text(form, "period_label"));
    redirect(`/obras/${projectId}/planillas?planilla=${id}`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/planillas`);
  }
}

export async function certificateLineAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await saveCertificateLine(projectId, text(form, "id"), text(form, "quantity") || "0", text(form, "amortization"), text(form, "certificateId"));
    redirect(`/obras/${projectId}/planillas?planilla=${text(form, "certificateId")}`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/planillas`);
  }
}

export async function priceToolsAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    const tool = text(form, "tool");
    if (tool === "refresh") await refreshPrices(projectId, text(form, "source"), text(form, "snapshotId"), form.getAll("family").map(String));
    if (tool === "bump") await bumpPrices(projectId, text(form, "percent") || "0", text(form, "family"));
    if (tool === "replace") await replaceInput(projectId, text(form, "query"), text(form, "kind"), text(form, "catalogId"));
    if (tool === "import") await importFromProject(projectId, text(form, "sourceId"), text(form, "includeCatalog") === "si");
    redirect(`/obras/${projectId}/presupuesto?aviso=${encodeURIComponent("Precios actualizados.")}`);
  } catch (error) {
    bounce(error, `/obras/${projectId}/presupuesto`);
  }
}

export async function importExcelAction(form: FormData) {
  try {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("Seleccione un archivo Excel.");
    const rows = await parseBudgetSheet(await file.arrayBuffer());
    const id = await importRows(text(form, "name") || file.name.replace(/\.xlsx$/i, ""), rows, text(form, "includeCatalog") === "si");
    redirect(`/obras/${id}/presupuesto`);
  } catch (error) {
    bounce(error, "/");
  }
}

export async function contributorAction(form: FormData) {
  const projectId = text(form, "projectId");
  try {
    await addContributor(projectId, {
      company: text(form, "company"), material_percent: text(form, "material_percent"), labor_percent: text(form, "labor_percent"),
      equipment_percent: text(form, "equipment_percent"), transport_percent: text(form, "transport_percent"),
    });
    redirect(`/obras/${projectId}`);
  } catch (error) {
    bounce(error, `/obras/${projectId}`);
  }
}

export async function catalogAction(form: FormData) {
  const back = text(form, "back") || "/mantenimiento";
  try {
    const table = text(form, "table") as TableName;
    if (!CATALOG_TABLES.has(table)) throw new Error("Catálogo no válido.");
    const data: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      if (["table", "id", "back"].includes(key)) continue;
      data[key] = typeof value === "string" ? value.trim() : value;
    }
    if (table === "equipment") data.uses_gasoline = form.get("uses_gasoline") === "on";
    if ("sort_order" in data) data.sort_order = Number(data.sort_order || 0);
    for (const key of Object.keys(data)) if (String(key).endsWith("_id") && data[key] === "") data[key] = null;
    await saveCatalog(table, text(form, "id"), data);
    redirect(`${back}?aviso=${encodeURIComponent("Registro guardado.")}`);
  } catch (error) {
    bounce(error, back);
  }
}

export async function deleteCatalogAction(form: FormData) {
  const back = text(form, "back") || "/mantenimiento";
  try {
    const table = text(form, "table") as TableName;
    if (!CATALOG_TABLES.has(table)) throw new Error("Catálogo no válido.");
    await deleteCatalog(table, text(form, "id"));
    redirect(back);
  } catch (error) {
    bounce(error, back);
  }
}

export async function linkSupplierAction(form: FormData) {
  try {
    await linkSupplier(text(form, "material_id"), text(form, "supplier_id"));
    redirect("/mantenimiento/materiales");
  } catch (error) {
    bounce(error, "/mantenimiento/materiales");
  }
}

export async function snapshotAction(form: FormData) {
  try {
    await createSnapshot(text(form, "note"), form.getAll("family").map(String));
    redirect(`/mantenimiento/historicos?aviso=${encodeURIComponent("Histórico guardado.")}`);
  } catch (error) {
    bounce(error, "/mantenimiento/historicos");
  }
}

export async function purgeAction(form: FormData) {
  try {
    await purgeBase(form.getAll("family").map(String), text(form, "confirmation"));
    redirect(`/mantenimiento/depurar?aviso=${encodeURIComponent("Base depurada.")}`);
  } catch (error) {
    bounce(error, "/mantenimiento/depurar");
  }
}

export async function recalculateAction(form: FormData) {
  const back = text(form, "back");
  try {
    await recalculateFamily(text(form, "family") as "material" | "labor" | "equipment" | "transport", text(form, "scheme") === "personal" ? "personal" : "chamber");
    redirect(`${back}?aviso=${encodeURIComponent("Precios de las obras recalculados.")}`);
  } catch (error) {
    bounce(error, back);
  }
}

export async function memberAction(form: FormData) {
  try {
    await createMember({
      email: text(form, "email"),
      password: String(form.get("password") ?? ""),
      fullName: text(form, "fullName"),
      role: text(form, "role") as Role,
      projectIds: form.getAll("projectId").map(String),
    });
    redirect(`/organizacion/usuarios?aviso=${encodeURIComponent("Usuario creado.")}`);
  } catch (error) {
    bounce(error, "/organizacion/usuarios");
  }
}

export async function assignAction(form: FormData) {
  try {
    await assignProjects(text(form, "userId"), form.getAll("projectId").map(String));
    redirect(`/organizacion/usuarios?aviso=${encodeURIComponent("Obras asignadas.")}`);
  } catch (error) {
    bounce(error, "/organizacion/usuarios");
  }
}
