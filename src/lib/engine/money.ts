import Decimal from "decimal.js";

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export function dec(value: string | number | Decimal | null | undefined): Decimal {
  if (value instanceof Decimal) return value;
  if (value === null || value === undefined) return new Decimal(0);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return new Decimal(0);
    return new Decimal(value);
  }
  const raw = String(value).trim().replace(/\s/g, "");
  if (!raw) return new Decimal(0);
  let normalized = raw;
  if (raw.includes(",") && raw.includes(".")) {
    normalized =
      raw.lastIndexOf(",") > raw.lastIndexOf(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "");
  } else if (raw.includes(",")) {
    normalized = raw.replace(",", ".");
  }
  try {
    return new Decimal(normalized);
  } catch {
    return new Decimal(0);
  }
}

export function money(value: string | number | Decimal | null | undefined): string {
  return dec(value).toDecimalPlaces(6).toFixed(6);
}

export function formatMoney(value: string | number | Decimal | null | undefined, digits = 2): string {
  const n = dec(value).toNumber();
  return new Intl.NumberFormat("es-EC", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

export function formatQty(value: string | number | Decimal | null | undefined): string {
  return formatMoney(value, 4);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function todayIso(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

export function nearlyEqual(a: Decimal, b: Decimal, tol = "0.0001"): boolean {
  return a.minus(b).abs().lte(tol);
}

export { Decimal };
