"use client";

import { usePathname } from "next/navigation";
import useSWR from "swr";
import { Bell, Search, Wifi, WifiOff } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Mission Control",
    subtitle: "Cloud Coach Dashboard",
  },
  "/properties": {
    title: "Property Explorer",
    subtitle: "Browse & Search Listings",
  },
  "/agents": {
    title: "Agent Roster",
    subtitle: "Multi-Agent Swarm Management",
  },
  "/analytics": {
    title: "Analytics",
    subtitle: "Market Intelligence & Performance",
  },
  "/settings": {
    title: "System Settings",
    subtitle: "Configuration & Preferences",
  },
};

export function TopBar() {
  const pathname = usePathname();

  // Poll system status every 30 seconds to detect Flask backend
  const { data: systemData } = useSWR("/api/system/metrics", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  const backendConnected = systemData?.backend?.connected === true;

  // Match route -- agent detail pages fall back to agents
  const pageInfo =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/agents/")
      ? { title: "Agent Detail", subtitle: "Agent Performance & History" }
      : PAGE_TITLES["/"]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 px-6">
      {/* Page title -- these words float like a brick doesn&apos;t */}
      <div>
        <h1 className="text-sm font-semibold text-foreground">
          {pageInfo.title}
        </h1>
        <p className="text-[11px] text-muted-foreground">
          {pageInfo.subtitle}
        </p>
      </div>

      {/* Right side actions -- the buttons are tiny soldiers */}
      <div className="flex items-center gap-2">
        {/* Backend connection indicator */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
            backendConnected
              ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
              : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
          }`}
          title={
            backendConnected
              ? `Connected to Flask: ${systemData?.backend?.primarySource || "unknown"}`
              : "Flask backend offline -- using mock data"
          }
        >
          {backendConnected ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">
            {backendConnected ? "Live" : "Mock"}
          </span>
        </div>

        <button
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
        <div className="ml-2 flex items-center gap-1.5 rounded-full bg-[hsl(var(--success))]/10 px-2.5 py-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[hsl(var(--success))]" />
          <span className="text-[10px] font-medium text-[hsl(var(--success))]">
            Online
          </span>
        </div>
      </div>
    </header>
  );
}
