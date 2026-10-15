"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function isNavigationClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = (event.target as Element | null)?.closest("a");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return null;
  const href = link.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null;
  return link;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const link = isNavigationClick(event);
      if (!link) return;
      document.querySelectorAll<HTMLElement>("[data-pending]").forEach((item) => item.removeAttribute("data-pending"));
      link.setAttribute("data-pending", "true");
      setPending(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    setPending(false);
    document.querySelectorAll<HTMLElement>("[data-pending]").forEach((item) => item.removeAttribute("data-pending"));
  }, [pathname]);

  if (!pending) return null;
  return <div className="nav-progress" role="progressbar" aria-label="Abriendo la pantalla" />;
}
