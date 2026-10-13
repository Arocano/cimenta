import { formatDate, formatMoney } from "@/lib/engine/money";
import { Button, fieldClass } from "./ui";

export function Notice({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">{message}</p>;
}

export function Money({ value, digits = 2 }: { value: string | number; digits?: number }) {
  return <span className="tabular-nums">{formatMoney(value, digits)}</span>;
}

export function DateText({ value }: { value: string }) {
  return <>{formatDate(value)}</>;
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-1 text-sm ${className ?? ""}`}>
      <span className="font-medium text-stone-700">{label}</span>
      {children}
      {hint ? <span className="text-xs text-stone-500">{hint}</span> : null}
    </label>
  );
}

export function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input className={fieldClass} name={name} defaultValue={defaultValue} type={type} required={required} step={type === "number" ? "any" : undefined} />
    </Field>
  );
}

export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg text-stone-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-stone-500">
            {headers.map((header) => (
              <th key={header} className="px-2 py-2 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Submit({ children, variant = "primary" }: { children: React.ReactNode; variant?: "primary" | "secondary" | "danger" }) {
  return <Button type="submit" variant={variant}>{children}</Button>;
}

export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  presupuestador: "Presupuestador",
  bodega: "Bodega",
  consulta: "Consulta",
};
