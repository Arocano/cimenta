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
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary-hover",
        variant === "secondary" && "border border-border bg-card text-foreground hover:bg-accent",
        variant === "ghost" && "text-inherit hover:bg-accent",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

export const fieldClass =
  "h-10 w-full rounded-md border border-input bg-field px-3 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus:border-ring focus:ring-2";

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
  return <div className={cn("rounded-lg border border-border bg-card text-card-foreground", className)} {...props} />;
}

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("inline-flex rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground", className)} {...props} />;
}
