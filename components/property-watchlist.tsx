"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Star,
  Eye,
  Bell,
  Trash2,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Filter,
  X,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface WatchlistItem {
  id: string;
  propertyId: string;
  address: string;
  city: string;
  price: number;
  assessedValue: number;
  addedDate: string;
  category: "favorites" | "monitoring" | "alerts";
  notes?: string;
  priceChange?: number;
  alertThreshold?: number;
  lastViewed?: string;
}

interface PropertyWatchlistProps {
  className?: string;
  compact?: boolean;
}

const CATEGORY_CONFIG = {
  favorites: {
    icon: Star,
    label: "Favorites",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  monitoring: {
    icon: Eye,
    label: "Monitoring",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  alerts: {
    icon: Bell,
    label: "Alerts",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
};

export function PropertyWatchlist({ className, compact = false }: PropertyWatchlistProps) {
  const [items, setItems] = useState<WatchlistItem[]>([
    {
      id: "w1",
      propertyId: "prop-001",
      address: "1425 Columbia Park Trail",
      city: "Richland",
      price: 385000,
      assessedValue: 361250,
      addedDate: "May 10, 2026",
      category: "favorites",
      notes: "Good comparable for neighborhood analysis",
      priceChange: 2.5,
      lastViewed: "2 hours ago",
    },
    {
      id: "w2",
      propertyId: "prop-002",
      address: "2890 Bombing Range Rd",
      city: "West Richland",
      price: 425000,
      assessedValue: 361250,
      addedDate: "May 8, 2026",
      category: "monitoring",
      notes: "Pending appeal - monitoring value changes",
      priceChange: -1.2,
      lastViewed: "1 day ago",
    },
    {
      id: "w3",
      propertyId: "prop-003",
      address: "456 Keene Rd",
      city: "Richland",
      price: 298500,
      assessedValue: 275000,
      addedDate: "May 5, 2026",
      category: "alerts",
      alertThreshold: 10,
      notes: "Alert if ratio exceeds 10% deviation",
      priceChange: 5.8,
      lastViewed: "3 days ago",
    },
    {
      id: "w4",
      propertyId: "prop-004",
      address: "789 George Washington Way",
      city: "Richland",
      price: 295000,
      assessedValue: 280000,
      addedDate: "May 3, 2026",
      category: "favorites",
      priceChange: 0,
      lastViewed: "1 week ago",
    },
    {
      id: "w5",
      propertyId: "prop-005",
      address: "1200 Stevens Dr",
      city: "Richland",
      price: 1250000,
      assessedValue: 1180000,
      addedDate: "Apr 28, 2026",
      category: "monitoring",
      notes: "Commercial property - quarterly review",
      priceChange: 3.2,
      lastViewed: "4 days ago",
    },
  ]);

  const [filter, setFilter] = useState<"all" | "favorites" | "monitoring" | "alerts">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredItems = filter === "all" ? items : items.filter((item) => item.category === filter);

  const stats = {
    total: items.length,
    favorites: items.filter((i) => i.category === "favorites").length,
    monitoring: items.filter((i) => i.category === "monitoring").length,
    alerts: items.filter((i) => i.category === "alerts").length,
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCategory = (id: string, category: WatchlistItem["category"]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, category } : item)));
  };

  if (compact) {
    return (
      <div className={cn("rounded-xl border border-border bg-card", className)}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20">
              <Star className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Watchlist</h3>
              <p className="text-xs text-muted-foreground">{stats.total} properties</p>
            </div>
          </div>
          <Link
            href="/watchlist"
            className="text-xs font-medium text-primary hover:text-primary/80"
          >
            View All
          </Link>
        </div>
        <div className="divide-y divide-border">
          {items.slice(0, 3).map((item) => {
            const config = CATEGORY_CONFIG[item.category];
            const Icon = config.icon;
            return (
              <Link
                key={item.id}
                href={`/properties/${item.propertyId}`}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
              >
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", config.bgColor)}>
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-foreground">{item.address}</div>
                  <div className="text-[10px] text-muted-foreground">{item.city}</div>
                </div>
                {item.priceChange !== undefined && item.priceChange !== 0 && (
                  <div
                    className={cn(
                      "flex items-center gap-0.5 text-[10px] font-medium",
                      item.priceChange > 0 ? "text-emerald-400" : "text-red-400"
                    )}
                  >
                    {item.priceChange > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(item.priceChange)}%
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20">
            <Star className="h-4.5 w-4.5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Property Watchlist</h3>
            <p className="text-xs text-muted-foreground">Track and monitor properties of interest</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 border-b border-border p-3">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "rounded-lg p-2 text-center transition-colors",
            filter === "all" ? "bg-primary/10" : "hover:bg-muted"
          )}
        >
          <div className={cn("text-lg font-bold", filter === "all" ? "text-primary" : "text-foreground")}>
            {stats.total}
          </div>
          <div className="text-[10px] text-muted-foreground">Total</div>
        </button>
        <button
          onClick={() => setFilter("favorites")}
          className={cn(
            "rounded-lg p-2 text-center transition-colors",
            filter === "favorites" ? "bg-amber-500/10" : "hover:bg-muted"
          )}
        >
          <div className={cn("text-lg font-bold", filter === "favorites" ? "text-amber-400" : "text-foreground")}>
            {stats.favorites}
          </div>
          <div className="text-[10px] text-muted-foreground">Favorites</div>
        </button>
        <button
          onClick={() => setFilter("monitoring")}
          className={cn(
            "rounded-lg p-2 text-center transition-colors",
            filter === "monitoring" ? "bg-cyan-500/10" : "hover:bg-muted"
          )}
        >
          <div className={cn("text-lg font-bold", filter === "monitoring" ? "text-cyan-400" : "text-foreground")}>
            {stats.monitoring}
          </div>
          <div className="text-[10px] text-muted-foreground">Monitoring</div>
        </button>
        <button
          onClick={() => setFilter("alerts")}
          className={cn(
            "rounded-lg p-2 text-center transition-colors",
            filter === "alerts" ? "bg-red-500/10" : "hover:bg-muted"
          )}
        >
          <div className={cn("text-lg font-bold", filter === "alerts" ? "text-red-400" : "text-foreground")}>
            {stats.alerts}
          </div>
          <div className="text-[10px] text-muted-foreground">Alerts</div>
        </button>
      </div>

      {/* List */}
      <div className="max-h-96 divide-y divide-border overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center">
            <Star className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No properties in this category</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const config = CATEGORY_CONFIG[item.category];
            const Icon = config.icon;
            const isExpanded = expandedId === item.id;
            const ratio = ((item.assessedValue / item.price) * 100).toFixed(1);

            return (
              <div key={item.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg", config.bgColor)}>
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          href={`/properties/${item.propertyId}`}
                          className="text-sm font-medium text-foreground hover:text-primary"
                        >
                          {item.address}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {item.city}
                          <span className="text-muted-foreground/50">|</span>
                          <span>Added {item.addedDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.priceChange !== undefined && item.priceChange !== 0 && (
                          <div
                            className={cn(
                              "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                              item.priceChange > 0
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-red-500/20 text-red-400"
                            )}
                          >
                            {item.priceChange > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(item.priceChange)}%
                          </div>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Price:</span>{" "}
                        <span className="font-medium text-foreground">${formatNumber(item.price)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assessed:</span>{" "}
                        <span className="font-medium text-foreground">${formatNumber(item.assessedValue)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ratio:</span>{" "}
                        <span className="font-medium text-foreground">{ratio}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 rounded-lg bg-muted/50 p-3">
                    {item.notes && (
                      <div className="mb-3">
                        <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          Notes
                        </div>
                        <div className="text-xs text-foreground">{item.notes}</div>
                      </div>
                    )}

                    {item.alertThreshold && (
                      <div className="mb-3 flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-xs text-muted-foreground">
                          Alert threshold: {item.alertThreshold}% ratio deviation
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Category:</span>
                        {(["favorites", "monitoring", "alerts"] as const).map((cat) => {
                          const catConfig = CATEGORY_CONFIG[cat];
                          return (
                            <button
                              key={cat}
                              onClick={() => updateCategory(item.id, cat)}
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                                item.category === cat
                                  ? cn(catConfig.bgColor, catConfig.color)
                                  : "bg-muted text-muted-foreground hover:bg-accent"
                              )}
                            >
                              {catConfig.label}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    </div>

                    {item.lastViewed && (
                      <div className="mt-2 text-[10px] text-muted-foreground">Last viewed: {item.lastViewed}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border bg-muted/30 p-3">
        <div className="text-xs text-muted-foreground">
          {filteredItems.length} of {items.length} properties
        </div>
        <Link
          href="/properties"
          className="text-xs font-medium text-primary hover:text-primary/80"
        >
          Browse Properties
        </Link>
      </div>
    </div>
  );
}

// Hook for adding/removing from watchlist
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("terra-watchlist");
    if (stored) {
      try {
        setWatchlist(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const isInWatchlist = (propertyId: string) => watchlist.includes(propertyId);

  const toggleWatchlist = (propertyId: string) => {
    setWatchlist((prev) => {
      const updated = prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId];
      localStorage.setItem("terra-watchlist", JSON.stringify(updated));
      return updated;
    });
  };

  return { watchlist, isInWatchlist, toggleWatchlist };
}
