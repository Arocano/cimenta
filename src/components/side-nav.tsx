"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SideLink({
  href,
  children,
  exact = false,
  icon,
  compact = false,
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  icon: React.ReactNode;
  compact?: boolean;
}) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      prefetch={true}
      aria-current={active ? "page" : undefined}
      title={typeof children === "string" ? children : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent",
        active && "bg-sidebar-accent font-medium",
        compact && "md:justify-center",
      )}
    >
      <span className="shrink-0" aria-hidden>{icon}</span>
      <span className={compact ? "md:sr-only" : undefined}>{children}</span>
    </Link>
  );
}
