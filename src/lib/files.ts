import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from "docx";
import ExcelJS from "exceljs";
import { transaction } from "./db";
import { projectBundle } from "./domain";
import { formatMoney } from "./engine/money";
import { requireSession } from "./session";
import { TABLE_NAMES, type TableName } from "./types";

export type Sheet = { title: string; meta: string[]; headers: string[]; rows: string[][] };

const KIND: Record<string, string> = {
  material: "material",
  "mano de obra": "labor",
  mano: "labor",
  labor: "labor",
  equipo: "equipment",
  equipment: "equipment",
  transporte: "transport",
  transport: "transport",
  auxiliar: "auxiliary",
  auxiliary: "auxiliary",
};

function norm(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export async function parseBudgetSheet(buffer: ArrayBuffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("El archivo no tiene hojas.");
  const headers: Record<string, number> = {};
  sheet.getRow(1).eachCell((cell, col) => {
    headers[norm(String(cell.value ?? ""))] = col;
  });
  const col = (...names: string[]) => names.map(norm).find((name) => headers[name]);
  const read = (row: ExcelJS.Row, ...names: string[]) => {
    const key = col(...names);
    if (!key) return "";
    const value = row.getCell(headers[key]).value;
    if (value && typeof value === "object" && "text" in value) return String(value.text);
    return String(value ?? "").trim();
  };
  const rows: {
    chapter: string; code: string; rubro: string; unit: string; quantity: string; yieldRate: string; kind: string;
    inputCode: string; inputName: string; inputUnit: string; inputQty: string; price: string; origin: string; cpc: string;
    subcontract: boolean; proposed: string; auxiliary: boolean;
  }[] = [];
  let chapter = "Capítulo";
  sheet.eachRow((row, index) => {
    if (index === 1) return;
    const nextChapter = read(row, "capitulo");
    if (nextChapter) chapter = nextChapter;
    const rubro = read(row, "rubro");
    if (!rubro) return;
    const kind = KIND[norm(read(row, "tipo"))] ?? "material";
    rows.push({
      chapter,
      code: read(row, "codigo"),
      rubro,
      unit: read(row, "unidad"),
      quantity: read(row, "cantidad") || "0",
      yieldRate: read(row, "rendimiento") || "1",
      kind,
      inputCode: read(row, "codigo insumo"),
      inputName: read(row, "insumo"),
      inputUnit: read(row, "unidad insumo"),
      inputQty: read(row, "cantidad insumo") || "0",
      price: read(row, "precio") || "0",
      origin: read(row, "origen") || "ND",
      cpc: read(row, "cpc"),
      subcontract: norm(read(row, "subcontrato")) === "si",
      proposed: read(row, "valor"),
      auxiliary: norm(read(row, "auxiliar")) === "si",
    });
  });
  if (!rows.length) throw new Error("No se encontraron rubros. Use la plantilla de Cimenta.");
  return rows;
}

export async function templateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Presupuesto");
  sheet.addRow(["Capitulo", "Codigo", "Rubro", "Unidad", "Cantidad", "Rendimiento", "Tipo", "Codigo insumo", "Insumo", "Unidad insumo", "Cantidad insumo", "Precio", "Origen", "CPC", "Subcontrato", "Valor", "Auxiliar"]);
  sheet.addRow(["Hormigones", "02.001", "Hormigón simple", "m3", 10, 2, "material", "MAT-CEM", "Cemento portland", "saco", 7, 8.5, "EP", "374400011", "no", "", "no"]);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function workbookFrom(sheet: Sheet) {
  const workbook = new ExcelJS.Workbook();
  const page = workbook.addWorksheet("Cimenta");
  page.addRow([sheet.title]);
  sheet.meta.forEach((line) => page.addRow([line]));
  page.addRow([]);
  page.addRow(sheet.headers);
  sheet.rows.forEach((row) => page.addRow(row));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function wordFrom(sheet: Sheet) {
  const table = new Table({
    rows: [
      new TableRow({ children: sheet.headers.map((header) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })] })) }),
      ...sheet.rows.map((row) => new TableRow({ children: row.map((cell) => new TableCell({ children: [new Paragraph(cell)] })) })),
    ],
  });
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ children: [new TextRun({ text: "Cimenta", bold: true, size: 36 })] }),
        new Paragraph({ text: sheet.title }),
        ...sheet.meta.map((line) => new Paragraph({ text: line })),
        new Paragraph({ text: "" }),
        table,
      ],
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

export async function reportSheet(projectId: string, tipo: string): Promise<Sheet> {
  const data = await projectBundle(projectId);
  const meta = [data.project.name, `Fecha ${data.project.proposed_date}`, `Proponente ${data.project.proponent}`];
  const offer = data.rubros.filter((rubro) => !rubro.is_auxiliary);
  if (tipo === "capitulos") {
    return {
      title: "Presupuesto por capítulos",
      meta,
      headers: ["Capítulo", "Total"],
      rows: data.chapters.map((chapter) => [data.priced.chapters.find((item) => item.chapterId === chapter.id) ? chapter.name : chapter.name, formatMoney(data.priced.chapters.find((item) => item.chapterId === chapter.id)?.total ?? 0)]),
    };
  }
  if (tipo === "apu" || tipo === "detallado" || tipo === "directos") {
    const rows = offer.flatMap((rubro) => {
      const priced = data.priced.rubros.find((item) => item.id === rubro.id);
      const head = [rubro.code, rubro.name, rubro.unit, rubro.quantity, formatMoney(priced?.unitPrice ?? 0), formatMoney(priced?.total ?? 0)];
      if (tipo === "directos") return [head];
      const lines = (priced?.lines ?? []).map((line) => ["", line.name, line.kind, line.quantity, formatMoney(line.unitPrice), formatMoney(line.cost)]);
      return [head, ...lines];
    });
    return { title: tipo === "apu" ? "Análisis de precios unitarios" : tipo === "directos" ? "Costos directos" : "Presupuesto detallado", meta, headers: ["Código", "Descripción", "Unidad / tipo", "Cantidad", "Precio", "Total"], rows };
  }
  if (tipo === "insumos") {
    const rows = data.lines.filter((line) => offer.some((rubro) => rubro.id === line.rubro_id)).map((line) => {
      const rubro = data.rubros.find((item) => item.id === line.rubro_id);
      return [line.kind, line.code, line.name, line.unit, line.quantity, formatMoney(line.unit_price), rubro?.name ?? ""];
    });
    return { title: "Listado de insumos", meta, headers: ["Tipo", "Código", "Insumo", "Unidad", "Cantidad", "Precio", "Rubro"], rows };
  }
  if (tipo === "indirectos") {
    return {
      title: "Costos indirectos",
      meta: [...meta, `Porcentaje general ${data.project.indirect_percent}%`, `Desglose ${data.indirectResult.percent}%`],
      headers: ["Concepto", "Valor"],
      rows: data.indirects.map((item) => [item.name, formatMoney(data.indirectResult.rows.find((row) => row.id === item.id)?.amount ?? 0)]),
    };
  }
  if (tipo === "desagregacion") {
    return {
      title: "Desagregación tecnológica",
      meta: [...meta, `VAE ${formatMoney(data.priced.vaePercent)}%`, data.threshold ? `Umbral ${data.threshold.percent}%` : "Sin umbral"],
      headers: ["Rubro", "Insumo", "CPC", "Origen", "Costo"],
      rows: data.priced.rubros.flatMap((rubro) => rubro.lines.map((line) => [data.rubros.find((item) => item.id === rubro.id)?.name ?? "", line.name, line.cpcCode ?? "", line.origin, formatMoney(line.cost)])),
    };
  }
  if (tipo === "simbolos") {
    return {
      title: "Símbolos, fórmula y cuadrilla",
      meta: [...meta, `Factor ${data.polynomial.factor}`, data.polynomial.valid ? "Coeficientes suman 1" : "Los coeficientes no suman 1"],
      headers: ["Símbolo", "Peso", "Coeficiente", "Índice base", "Índice período"],
      rows: data.symbols.map((symbol) => [
        symbol.name,
        data.weights.find((weight) => weight.id === symbol.id)?.weight ?? "",
        data.terms.find((term) => term.symbol_id === symbol.id)?.coefficient ?? "",
        data.indices.find((index) => index.symbol_id === symbol.id && index.kind === "base")?.value ?? "",
        data.indices.find((index) => index.symbol_id === symbol.id && index.kind === "period")?.value ?? "",
      ]),
    };
  }
  if (tipo === "bodega") {
    return {
      title: "Bodega",
      meta,
      headers: ["Fecha", "Tipo", "Material", "Cantidad", "Precio", "Factura", "Proveedor"],
      rows: data.movements.map((move) => [move.movement_date, move.kind === "in" ? "Ingreso" : "Salida", move.material_name, move.quantity, formatMoney(move.unit_price), move.invoice, move.supplier_name]),
    };
  }
  if (tipo === "planilla") {
    const rows = data.certificateLines.map((line) => {
      const rubro = data.rubros.find((item) => item.id === line.rubro_id);
      const price = data.priced.rubros.find((item) => item.id === line.rubro_id)?.unitPrice ?? "0";
      return [rubro?.name ?? "", line.quantity_previous, line.quantity_period, formatMoney(price)];
    });
    return { title: "Planillas", meta, headers: ["Rubro", "Anterior", "Este período", "Precio unitario"], rows };
  }
  if (tipo === "cronograma") {
    return {
      title: "Cronograma",
      meta,
      headers: ["Rubro", "Inicio", "Días", "Responsable"],
      rows: data.tasks.map((task) => [data.rubros.find((rubro) => rubro.id === task.rubro_id)?.name ?? "", task.start_date, task.duration_days, task.responsible]),
    };
  }
  const numbered = tipo === "numerado";
  return {
    title: numbered ? "Presupuesto numerado" : "Presupuesto general",
    meta: [...meta, `Total ${formatMoney(data.priced.total)}`],
    headers: ["N°", "Código", "Rubro", "Unidad", "Cantidad", "Precio unitario", "Total"],
    rows: offer.map((rubro, index) => {
      const priced = data.priced.rubros.find((item) => item.id === rubro.id);
      return [String(index + 1), rubro.code, rubro.name, rubro.unit, rubro.quantity, formatMoney(priced?.unitPrice ?? 0), formatMoney(priced?.total ?? 0)];
    }),
  };
}

export function projectXml(name: string, tasks: { name: string; start: string; days: string }[]) {
  const body = tasks.map((task, index) => `    <Task><UID>${index + 1}</UID><ID>${index + 1}</ID><Name>${escapeXml(task.name)}</Name><Start>${task.start}T08:00:00</Start><Duration>PT${Math.max(1, Number(task.days) || 1) * 8}H0M0S</Duration></Task>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Project xmlns="http://schemas.microsoft.com/project">\n  <Name>${escapeXml(name)}</Name>\n  <Tasks>\n${body}\n  </Tasks>\n</Project>\n`;
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function backup(scope: "org" | "project", projectId?: string) {
  const session = await requireSession();
  const payload = await transaction(async (tx) => {
    const data: Record<string, unknown[]> = {};
    for (const table of TABLE_NAMES) {
      if (table === "users") continue;
      const rows = await tx.list(table as TableName, table === "organizations" ? { id: session.orgId } : { org_id: session.orgId });
      data[table] = projectId ? rows.filter((row) => row.project_id === projectId || row.id === projectId || table === "organizations") : rows;
    }
    return { product: "Cimenta", exportedAt: new Date().toISOString(), orgId: session.orgId, scope, projectId: projectId ?? null, data };
  });
  return JSON.stringify(payload, null, 2);
}
