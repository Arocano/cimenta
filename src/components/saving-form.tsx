"use client";

import { warningClass } from "@/components/kit";
import { Loader2 } from "lucide-react";
import { useActionState } from "react";

type SaveResult = { ok: boolean; message: string };

export function SavingForm({
  action,
  children,
  pending = "Guardando…",
  className,
  confirm,
}: {
  action: (form: FormData) => Promise<SaveResult>;
  children: React.ReactNode;
  pending?: string;
  className?: string;
  confirm?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: SaveResult | null, formData: FormData) => action(formData),
    null,
  );
  return (
    <form
      action={formAction}
      className={`relative ${className ?? ""}`}
      aria-busy={isPending}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {state ? (
        <p role="status" className={`w-full ${state.ok ? "rounded-md border border-border bg-accent px-3 py-2 text-sm text-accent-foreground" : warningClass}`}>
          {state.message}
        </p>
      ) : null}
      {children}
      {isPending ? (
        <div className="absolute inset-0 z-10 rounded-lg bg-card/85" role="status">
          <p className="sticky top-6 flex items-center justify-center gap-2 p-3 text-sm font-medium">
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            {pending}
          </p>
        </div>
      ) : null}
    </form>
  );
}
