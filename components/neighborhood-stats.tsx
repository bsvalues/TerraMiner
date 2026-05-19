"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { cn, formatNumber } from "@/lib/utils";
import {
  Building2,
  Home,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  Users,
  MapPin,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface NeighborhoodStatsProps {
  neighborhood: string;
  city: string;
  currentPropertyId: string;
  currentAssessedValue?: number;
  className?: string;
}

interface NeighborhoodData {
  code: string;
  name: string;
  city: string;
  property_count: number;
  avg_assessed_value: number;
  median_assessed_value: number;
  avg_sale_price: number;
  median_ratio: number;
  price_trend_yoy: number;
  property_types: { type: string; count: number }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Generate mock neighborhood data based on neighborhood code
const generateMockNeighborhoodData = (neighborhood: string, city: string): NeighborhoodData => {
  const seed = neighborhood.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = (min: number, max: number) => min + ((seed * 9301 + 49297) % 233280) / 233280 * (max - min);

  return {
    code: neighborhood,
    name: `${neighborhood} District`,
    city,
    property_count: Math.round(random(50, 200)),
    avg_assessed_value: Math.round(random(250000, 450000)),
    median_assessed_value: Math.round(random(240000, 420000)),
    avg_sale_price: Math.round(random(270000, 480000)),
    median_ratio: 0.85 + random(0, 0.2),
    price_trend_yoy: random(-5, 12),
    property_types: [
      { type: "Single Family", count: Math.round(random(30, 120)) },
      { type: "Townhouse", count: Math.round(random(10, 40)) },
      { type: "Condo", count: Math.round(random(5, 25)) },
      { type: "Multi-Family", count: Math.round(random(2, 15)) },
    ],
  };
};

export function NeighborhoodStats({
  neighborhood,
  city,
  currentPropertyId,
  currentAssessedValue,
  className,
}: NeighborhoodStatsProps) {
  // Try to fetch real data, fall back to mock
  const { data: apiData } = useSWR<{ neighborhood: NeighborhoodData }>(
    neighborhood ? `/api/neighborhoods/${encodeURIComponent(neighborhood)}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const stats = useMemo(() => {
    if (apiData?.neighborhood) return apiData.neighborhood;
    return generateMockNeighborhoodData(neighborhood, city);
  }, [apiData, neighborhood, city]);

  // Calculate how current property compares to neighborhood
  const valueComparison = useMemo(() => {
    if (!currentAssessedValue || !stats.median_assessed_value) return null;
    const diff = ((currentAssessedValue - stats.median_assessed_value) / stats.median_assessed_value) * 100;
    return {
      diff,
      label: diff > 0 ? "above" : "below",
      absPercent: Math.abs(diff).toFixed(1),
    };
  }, [currentAssessedValue, stats.median_assessed_value]);

  // IAAO compliance check
  const isIAAOCompliant = stats.median_ratio >= 0.9 && stats.median_ratio <= 1.1;

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{stats.name}</h3>
            <p className="text-[10px] text-muted-foreground">{city}</p>
          </div>
        </div>
        <Link
          href={`/properties?neighborhood=${encodeURIComponent(neighborhood)}`}
          className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
        >
          View all
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-px bg-border">
        {/* Property Count */}
        <div className="bg-card p-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Properties</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground">{stats.property_count}</p>
        </div>

        {/* Median Value */}
        <div className="bg-card p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Median Value</span>
          </div>
          <p className="mt-1 text-lg font-semibold text-foreground">
            ${formatNumber(stats.median_assessed_value)}
          </p>
        </div>

        {/* Median Ratio */}
        <div className="bg-card p-3">
          <div className="flex items-center gap-2">
            <Scale className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Median Ratio</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className={cn(
              "text-lg font-semibold",
              isIAAOCompliant ? "text-[hsl(var(--success))]" : "text-destructive"
            )}>
              {(stats.median_ratio * 100).toFixed(1)}%
            </p>
            <span className={cn(
              "rounded px-1 py-0.5 text-[8px] font-medium uppercase",
              isIAAOCompliant
                ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                : "bg-destructive/10 text-destructive"
            )}>
              {isIAAOCompliant ? "IAAO" : "Review"}
            </span>
          </div>
        </div>

        {/* YoY Trend */}
        <div className="bg-card p-3">
          <div className="flex items-center gap-2">
            {stats.price_trend_yoy >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">YoY Trend</span>
          </div>
          <p className={cn(
            "mt-1 text-lg font-semibold",
            stats.price_trend_yoy >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"
          )}>
            {stats.price_trend_yoy >= 0 ? "+" : ""}{stats.price_trend_yoy.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Property type breakdown */}
      <div className="border-t border-border p-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Property Mix
        </p>
        <div className="flex gap-1">
          {stats.property_types.map((pt, i) => {
            const total = stats.property_types.reduce((sum, p) => sum + p.count, 0);
            const percent = (pt.count / total) * 100;
            return (
              <div
                key={pt.type}
                className="group relative"
                style={{ flex: percent }}
              >
                <div
                  className={cn(
                    "h-2 rounded-sm",
                    i === 0 ? "bg-primary" :
                    i === 1 ? "bg-primary/70" :
                    i === 2 ? "bg-primary/50" : "bg-primary/30"
                  )}
                />
                <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[9px] text-background group-hover:block">
                  {pt.type}: {pt.count}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {stats.property_types.slice(0, 3).map((pt, i) => (
            <div key={pt.type} className="flex items-center gap-1">
              <div
                className={cn(
                  "h-2 w-2 rounded-sm",
                  i === 0 ? "bg-primary" :
                  i === 1 ? "bg-primary/70" : "bg-primary/50"
                )}
              />
              <span className="text-[9px] text-muted-foreground">{pt.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Value comparison */}
      {valueComparison && (
        <div className="border-t border-border p-3">
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-muted-foreground">This property</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn(
                "text-xs font-semibold",
                valueComparison.diff >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"
              )}>
                {valueComparison.absPercent}% {valueComparison.label}
              </span>
              <span className="text-[10px] text-muted-foreground">median</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
