import { cn } from "@/lib/utils";

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-orange-950",
        variant === "secondary" && "border border-border bg-card hover:bg-accent",
        variant === "ghost" && "hover:bg-accent",
        variant === "danger" && "bg-destructive text-white",
        className,
      )}
      {...props}
    />
  );
}

export const fieldClass =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none ring-ring focus:ring-2";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, props.className)} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, "min-h-24 py-2", props.className)} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, props.className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-border bg-card shadow-sm", className)} {...props} />;
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground", className)} {...props} />;
}
