"use client";

import { logoutAction, switchOrgAction } from "@/app/actions";
import { BackLink } from "@/components/back-link";
import { NavigationProgress } from "@/components/navigation-progress";
import { SideLink } from "@/components/side-nav";
import { Submit } from "@/components/submit-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Building2, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Shield, Users, Wrench, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const storageKey = "cimenta-nav";

export function AppShell({
  orgName,
  roleLabel,
  isPlatformAdmin,
  orgId,
  memberships,
  children,
}: {
  orgName: string;
  roleLabel: string;
  isPlatformAdmin: boolean;
  orgId: string;
  memberships: { orgId: string; orgName: string }[];
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(storageKey) === "cerrado");
  }, []);

  function toggleCollapsed() {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem(storageKey, next ? "cerrado" : "abierto");
      return next;
    });
  }

  return (
    <div className={cn("min-h-screen md:grid", collapsed ? "md:grid-cols-[4.25rem_minmax(0,1fr)]" : "md:grid-cols-[15.5rem_minmax(0,1fr)]")}>
      {open ? (
        <button type="button" className="fixed inset-0 z-20 bg-foreground/30 md:hidden" aria-label="Cerrar menú" onClick={() => setOpen(false)} />
      ) : null}
      <aside
        className={cn(
          "no-print fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground transition-transform md:sticky md:top-0 md:z-auto md:h-screen md:w-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn("flex items-start justify-between gap-2 px-2", collapsed && "md:justify-center md:px-0")}>
          <Link href="/" className="min-w-0" onClick={() => setOpen(false)}>
            <span className={cn("font-serif text-3xl text-sidebar-primary", collapsed && "md:hidden")}>Cimenta</span>
            <span className={cn("hidden font-serif text-2xl text-sidebar-primary", collapsed && "md:inline")}>C</span>
            <span className={cn("mt-1 block truncate text-xs text-sidebar-muted", collapsed && "md:hidden")}>{orgName}</span>
            <span className={cn("block text-xs text-sidebar-muted", collapsed && "md:hidden")}>{roleLabel}</span>
          </Link>
          <button type="button" className="inline-flex size-8 items-center justify-center rounded-md hover:bg-sidebar-accent md:hidden" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
            <X className="size-4" />
          </button>
          <button
            type="button"
            className={cn("hidden size-8 items-center justify-center rounded-md hover:bg-sidebar-accent md:inline-flex", collapsed && "md:hidden")}
            aria-label="Plegar menú"
            onClick={toggleCollapsed}
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>
        {collapsed ? (
          <button type="button" className="mt-3 hidden size-8 items-center justify-center self-center rounded-md hover:bg-sidebar-accent md:inline-flex" aria-label="Desplegar menú" onClick={toggleCollapsed}>
            <PanelLeftOpen className="size-4" />
          </button>
        ) : null}
        <nav className="mt-6 grid gap-1" onClick={() => setOpen(false)}>
          {isPlatformAdmin ? <SideLink href="/plataforma" icon={<Shield className="size-4" />} compact={collapsed}>Plataforma</SideLink> : null}
          <SideLink href="/" exact icon={<Building2 className="size-4" />} compact={collapsed}>Obras</SideLink>
          <SideLink href="/mantenimiento" icon={<Wrench className="size-4" />} compact={collapsed}>Mantenimiento</SideLink>
          <SideLink href="/organizacion/usuarios" icon={<Users className="size-4" />} compact={collapsed}>Usuarios</SideLink>
        </nav>
        <div className="mt-6 space-y-3 md:mt-auto">
          {memberships.length > 1 ? (
            <form action={switchOrgAction} className={cn("grid gap-2", collapsed && "md:hidden")}>
              <label className="grid gap-1 text-xs text-sidebar-muted">
                Organización
                <select name="orgId" defaultValue={orgId} className="h-10 rounded-md border border-sidebar-accent bg-sidebar-accent px-2 text-sm text-sidebar-foreground">
                  {memberships.map((item) => <option key={item.orgId} value={item.orgId}>{item.orgName}</option>)}
                </select>
              </label>
              <Submit variant="secondary" pending="Cambiando…">Cambiar</Submit>
            </form>
          ) : null}
          <div className={cn("flex items-center gap-2", collapsed && "md:flex-col")}>
            <ThemeToggle tone="sidebar" />
            <form action={logoutAction} className={cn("min-w-0 flex-1", collapsed && "md:flex-none")}>
              <Button type="submit" variant="ghost" className={cn("h-9 w-full text-sidebar-foreground hover:bg-sidebar-accent", collapsed && "md:w-9 md:px-0")} aria-label="Salir">
                <LogOut className="size-4" aria-hidden />
                <span className={cn("ml-2", collapsed && "md:sr-only")}>Salir</span>
              </Button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="no-print flex items-center gap-2 border-b border-border px-4 py-3 md:hidden">
          <button type="button" className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent" aria-label="Abrir menú" onClick={() => setOpen(true)}>
            <Menu className="size-4" />
          </button>
          <span className="font-serif text-xl text-primary">Cimenta</span>
        </div>
        <NavigationProgress />
        <div className="px-4 py-6 md:px-8 md:py-8">
          <BackLink />
          {children}
        </div>
      </div>
    </div>
  );
}
