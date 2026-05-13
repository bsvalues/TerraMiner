"use client";

import { useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import { Bell, Search, Database, DatabaseZap, X } from "lucide-react";

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
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Poll system metrics every 30 seconds -- checks PostgreSQL connection health
  const { data: systemData } = useSWR("/api/system/metrics", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });

  const dbConnected = systemData?.source === "database";

  // Fetch recent activity for notification dropdown
  const { data: activityData } = useSWR("/api/activity", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });
  const recentNotifs = (activityData?.entries ?? []).slice(0, 5);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/properties?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  // Match route -- agent detail pages fall back to agents
  const pageInfo =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/agents/")
      ? { title: "Agent Detail", subtitle: "Agent Performance & History" }
      : PAGE_TITLES["/"]);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/50 pl-14 pr-4 md:px-6">
      {/* Page title */}
      <div>
        <h1 className="text-sm font-semibold text-foreground">
          {pageInfo.title}
        </h1>
        <p className="text-[11px] text-muted-foreground">
          {pageInfo.subtitle}
        </p>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Cmd+K hint */}
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
          <span className="text-[9px]">&#8984;</span>K
        </kbd>

        {/* Database connection indicator */}
        <div
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
            dbConnected
              ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
              : "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]"
          }`}
          title={
            dbConnected
              ? "Connected to PostgreSQL (Neon)"
              : "PostgreSQL offline -- using mock data"
          }
        >
          {dbConnected ? (
            <DatabaseZap className="h-3 w-3" />
          ) : (
            <Database className="h-3 w-3" />
          )}
          <span className="hidden sm:inline">
            {dbConnected ? "PostgreSQL" : "Mock"}
          </span>
        </div>

        {/* Expandable search */}
        {searchOpen ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
            className="flex items-center gap-1 rounded-md border border-primary/50 bg-background px-2"
          >
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties..."
              className="w-32 bg-transparent py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none sm:w-44"
              autoFocus
            />
            <button
              type="button"
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Search properties"
          >
            <Search className="h-4 w-4" />
          </button>
        )}

        {/* Notifications dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {recentNotifs.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} aria-hidden="true" />
              <div className="absolute right-0 top-10 z-50 w-72 rounded-lg border border-border bg-card p-2 shadow-xl">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Activity
                </p>
                {recentNotifs.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground">No recent activity</p>
                ) : (
                  recentNotifs.map((n: { id: string; message: string; timestamp: string; level: string }, i: number) => (
                    <div key={n.id ?? i} className="flex gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                        n.level === "success" ? "bg-[hsl(var(--success))]"
                        : n.level === "warning" ? "bg-[hsl(var(--warning))]"
                        : "bg-primary"
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] text-foreground">{n.message}</p>
                        <p className="text-[9px] text-muted-foreground">
                          {new Date(n.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
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
