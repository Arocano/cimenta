"use client";

import { Field } from "@/components/kit";
import { fieldClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function PasswordField({
  label,
  name,
  autoComplete,
  hint,
  required,
}: {
  label: string;
  name: string;
  autoComplete: string;
  hint?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} hint={hint} required={required}>
      <span className="relative block">
        <input className={cn(fieldClass, "pr-11")} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required={required} />
        <button
          type="button"
          className="absolute top-1 right-1 inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </Field>
  );
}
