"use client";

import { useEffect } from "react";

const sections = ["presupuesto", "indirectos", "desagregacion", "reajuste", "bodega", "planillas", "reportes", "cronograma"];

export function WarmObraRoutes({ id }: { id: string }) {
  useEffect(() => {
    const current = window.location.pathname;
    const urls = [ `/obras/${id}`, ...sections.map((section) => `/obras/${id}/${section}`) ].filter((url) => url !== current);
    const controller = new AbortController();
    const stop = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.("a");
      const href = link?.getAttribute("href") ?? "";
      if (href.startsWith(`/obras/${id}`)) controller.abort();
    };
    document.addEventListener("click", stop, true);
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        for (const url of urls) {
          if (cancelled) return;
          try {
            await fetch(url, { signal: controller.signal, credentials: "same-origin" });
          } catch {
            return;
          }
        }
      })();
    }, 500);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
      document.removeEventListener("click", stop, true);
    };
  }, [id]);
  return null;
}
