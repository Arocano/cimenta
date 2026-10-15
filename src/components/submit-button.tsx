"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "./ui";

export function Submit({
  children,
  variant = "primary",
  pending = "Procesando…",
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  pending?: string;
  className?: string;
}) {
  const status = useFormStatus();
  return (
    <Button type="submit" variant={variant} className={cn("h-10", className)} disabled={status.pending} aria-busy={status.pending}>
      {status.pending ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
          {pending}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

export function PendingNote({ label }: { label: string }) {
  const status = useFormStatus();
  if (!status.pending) return null;
  return (
    <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label}
    </p>
  );
}
