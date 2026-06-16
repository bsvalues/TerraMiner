"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
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
  Menu,
  X,
  Scale,
  Gavel,
  AlertCircle,
  FileText,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/properties", label: "Properties", icon: Home },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/assessment", label: "Assessment", icon: Scale },
  { href: "/appeals", label: "Appeals", icon: Gavel },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Fetch assessment status for notification badge
  const { data: ratioStudy } = useSWR<{
    sample_size: number;
    median_ratio: number;
    cod: number;
    prd: number;
    prb: number;
    iaao_compliant: boolean;
  }>("/api/assessment/ratio-study", fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 60000, // Refresh every minute
  });

  // Count assessment issues (non-compliant metrics)
  const assessmentIssues = ratioStudy ? [
    ratioStudy.median_ratio < 0.9 || ratioStudy.median_ratio > 1.1,
    ratioStudy.cod > 15,
    ratioStudy.prd < 0.98 || ratioStudy.prd > 1.03,
    ratioStudy.prb < -0.05 || ratioStudy.prb > 0.05,
  ].filter(Boolean).length : 0;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-lg md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

    <aside
      className={cn(
        "fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-border bg-card transition-all duration-200",
        "md:sticky md:z-auto",
        collapsed ? "w-16" : "w-56",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Logo area */}
      <div className="flex h-14 items-center border-b border-border px-3">
        <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
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
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Close navigation menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation links */}
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
                "relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {/* Notification badge for Assessment */}
              {item.href === "/assessment" && assessmentIssues > 0 && (
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground",
                    collapsed
                      ? "absolute -right-0.5 -top-0.5 h-3.5 w-3.5"
                      : "ml-auto h-4 min-w-4 px-1"
                  )}
                  title={`${assessmentIssues} IAAO metric${assessmentIssues > 1 ? "s" : ""} out of compliance`}
                >
                  {assessmentIssues}
                </span>
              )}
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
    </>
  );
}
