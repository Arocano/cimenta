import { formatDate, formatMoney } from "@/lib/engine/money";
import { Submit } from "./submit-button";
import { fieldClass } from "./ui";

export { Submit };

export const warningClass = "rounded-md border border-warning-border bg-warning px-3 py-2 text-sm text-warning-foreground";

export function Notice({ message }: { message?: string }) {
  if (!message) return null;
  return <p className={warningClass} role="alert">{message}</p>;
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
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={`grid gap-1.5 text-sm ${className ?? ""}`}>
      <span className="font-medium text-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs leading-relaxed text-muted-foreground">{hint}</span> : null}
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
  autoComplete,
  inputMode,
  placeholder,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  hint?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  placeholder?: string;
  className?: string;
}) {
  const numeric = type === "number" || inputMode === "decimal";
  return (
    <Field label={label} hint={hint} required={required} className={className}>
      <input
        className={fieldClass}
        name={name}
        defaultValue={defaultValue}
        type={type}
        required={required}
        step={type === "number" ? "any" : undefined}
        inputMode={inputMode ?? (numeric ? "decimal" : undefined)}
        autoComplete={autoComplete ?? (numeric ? "off" : undefined)}
        placeholder={placeholder}
        spellCheck={type === "email" ? false : undefined}
      />
    </Field>
  );
}

export function CheckChip({
  name,
  label,
  defaultChecked,
  value,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  value?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-md border border-border bg-field px-3 py-2 text-sm">
      <input className="size-4 accent-primary" type="checkbox" name={name} value={value} defaultChecked={defaultChecked} />
      {label}
    </label>
  );
}

export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-serif text-lg">{title}</h2>
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
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
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

export const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  presupuestador: "Presupuestador",
  bodega: "Bodega",
  consulta: "Consulta",
};
