"use client";

import { cn } from "@/lib/utils";
import { Moon, Sun } from "lucide-react";

const storageKey = "cimenta-theme";

export function applyTheme(theme: "light" | "dark") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(storageKey, theme);
  document.dispatchEvent(new Event("cimenta-theme"));
}

export function ThemeToggle({ tone = "surface" }: { tone?: "surface" | "sidebar" }) {
  function toggle() {
    const next = document.documentElement.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md",
        tone === "sidebar"
          ? "text-sidebar-foreground hover:bg-sidebar-accent"
          : "border border-border bg-card text-foreground hover:bg-accent",
      )}
    >
      <Sun className="hidden size-4 dark:block" aria-hidden />
      <Moon className="size-4 dark:hidden" aria-hidden />
      <span className="sr-only">
        <span className="dark:hidden">Cambiar a modo oscuro</span>
        <span className="hidden dark:inline">Cambiar a modo claro</span>
      </span>
    </button>
  );
}

export const themeBootScript = `(function(){try{var t=localStorage.getItem("${storageKey}");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.dataset.theme=t}catch(e){}})();`;
