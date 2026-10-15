"use client";

import { useState } from "react";

export function ExcelFileField() {
  const [name, setName] = useState("");
  return (
    <label className="grid min-w-0 gap-1.5 text-sm">
      <span className="font-medium">Archivo Excel</span>
      <span className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-input bg-field px-2">
        <span className="shrink-0 rounded-md bg-card px-2 py-1 text-foreground">Seleccionar archivo</span>
        <span className="min-w-0 truncate text-muted-foreground">{name || "Ningún archivo seleccionado"}</span>
      </span>
      <input
        name="file"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        required
        className="sr-only"
        onChange={(event) => setName(event.target.files?.[0]?.name ?? "")}
      />
    </label>
  );
}
