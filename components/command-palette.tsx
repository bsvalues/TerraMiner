"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/toast";
import {
  LayoutDashboard,
  Home,
  Bot,
  BarChart3,
  Settings,
  Search,
  Command,
  MapPin,
  TrendingUp,
  Zap,
  Download,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: typeof LayoutDashboard;
  action: () => void;
  category: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CommandItem[] = [
    // Navigation
    { id: "nav-dashboard", label: "Dashboard", description: "Main overview", icon: LayoutDashboard, action: () => router.push("/"), category: "Navigation" },
    { id: "nav-properties", label: "Properties", description: "Browse all listings", icon: Home, action: () => router.push("/properties"), category: "Navigation" },
    { id: "nav-properties-map", label: "Properties Map View", description: "View properties on map", icon: MapPin, action: () => { router.push("/properties"); setTimeout(() => document.querySelector<HTMLButtonElement>('[aria-label="Map view"]')?.click(), 500); }, category: "Navigation" },
    { id: "nav-agents", label: "Agents", description: "AI agent management", icon: Bot, action: () => router.push("/agents"), category: "Navigation" },
    { id: "nav-analytics", label: "Analytics", description: "Charts and insights", icon: BarChart3, action: () => router.push("/analytics"), category: "Navigation" },
    { id: "nav-settings", label: "Settings", description: "System preferences", icon: Settings, action: () => router.push("/settings"), category: "Navigation" },
    // Actions
    { id: "act-search", label: "Search Properties", description: "Find listings by keyword", icon: Search, action: () => { router.push("/properties"); setTimeout(() => document.querySelector<HTMLButtonElement>('[aria-label="Search properties"]')?.click(), 500); }, category: "Actions" },
    { id: "act-top-picks", label: "Top Investment Picks", description: "Sort by TerraFusion score", icon: TrendingUp, action: () => router.push("/properties?sort=score"), category: "Actions" },
    { id: "act-swarm", label: "Run Swarm Query", description: "Execute an AI swarm task", icon: Zap, action: () => { router.push("/"); setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder*="swarm"]')?.focus(), 500); }, category: "Actions" },
    { id: "act-export", label: "Export Properties CSV", description: "Download all properties with scores", icon: Download, action: () => { window.location.href = "/api/properties/export"; addToast({ message: "Downloading properties CSV...", type: "info" }); }, category: "Actions" },
  ];

  const filtered = query.trim()
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          (item.description?.toLowerCase().includes(query.toLowerCase()))
      )
    : items;

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const flatFiltered = Object.values(grouped).flat();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        setQuery("");
        setSelectedIndex(0);
      }
      if (!open) return;
      if (e.key === "Escape") {
        setOpen(false);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && flatFiltered[selectedIndex]) {
        e.preventDefault();
        flatFiltered[selectedIndex].action();
        setOpen(false);
      }
    },
    [open, flatFiltered, selectedIndex]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  let flatIndex = -1;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="fixed inset-x-0 top-[15%] z-[70] mx-auto w-full max-w-lg">
        <div className="mx-4 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="hidden rounded border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto p-2">
            {flatFiltered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </p>
            ) : (
              Object.entries(grouped).map(([category, categoryItems]) => (
                <div key={category}>
                  <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {category}
                  </p>
                  {categoryItems.map((item) => {
                    flatIndex++;
                    const isSelected = flatIndex === selectedIndex;
                    const Icon = item.icon;
                    const idx = flatIndex;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          item.action();
                          setOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.description && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <Command className="h-3 w-3" />
              <span>K to toggle</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Arrow keys to navigate</span>
              <span>Enter to select</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
