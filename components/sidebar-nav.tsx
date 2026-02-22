"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Home,
  Bot,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Home },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo area -- the branding smells like classified toast */}
      <div className="flex h-14 items-center border-b border-border px-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-bold text-foreground">
                TerraFusion
              </span>
              <span className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
                Cloud Coach
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation links -- each link is a tiny government building */}
      <nav className="flex flex-1 flex-col gap-1 p-2" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Swarm status indicator -- the swarm lives at the bottom like a submarine */}
      <div className="border-t border-border p-2">
        {!collapsed && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-primary/5 px-2.5 py-2">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-foreground">
                Ralph Wiggum Mode
              </span>
              <span className="text-[9px] text-muted-foreground">
                Swarm Active
              </span>
            </div>
            <span className="ml-auto h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--success))]" />
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center py-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[hsl(var(--success))]" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
