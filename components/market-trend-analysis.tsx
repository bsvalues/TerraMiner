"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Calendar,
  Building2,
  Home,
  Factory,
  Trees,
  ChevronDown,
  Info,
  BarChart3,
} from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";

type PropertyType = "all" | "residential" | "commercial" | "agricultural" | "industrial";
type TimeRange = "6m" | "1y" | "2y" | "5y";

interface TrendData {
  period: string;
  medianPrice: number;
  avgPricePerSqFt: number;
  salesVolume: number;
  daysOnMarket: number;
  priceChange: number;
}

interface MarketSummary {
  currentMedian: number;
  previousMedian: number;
  yoyChange: number;
  trendFactor: number;
  confidenceLevel: "high" | "medium" | "low";
  sampleSize: number;
}

// Mock trend data
const mockTrendData: Record<PropertyType, TrendData[]> = {
  all: [
    { period: "May 2026", medianPrice: 425000, avgPricePerSqFt: 215, salesVolume: 87, daysOnMarket: 28, priceChange: 0.8 },
    { period: "Apr 2026", medianPrice: 421600, avgPricePerSqFt: 212, salesVolume: 92, daysOnMarket: 26, priceChange: 1.2 },
    { period: "Mar 2026", medianPrice: 416600, avgPricePerSqFt: 210, salesVolume: 104, daysOnMarket: 24, priceChange: 0.9 },
    { period: "Feb 2026", medianPrice: 412900, avgPricePerSqFt: 208, salesVolume: 78, daysOnMarket: 32, priceChange: 0.6 },
    { period: "Jan 2026", medianPrice: 410400, avgPricePerSqFt: 206, salesVolume: 65, daysOnMarket: 38, priceChange: 0.4 },
    { period: "Dec 2025", medianPrice: 408800, avgPricePerSqFt: 205, salesVolume: 58, daysOnMarket: 42, priceChange: -0.2 },
    { period: "Nov 2025", medianPrice: 409600, avgPricePerSqFt: 206, salesVolume: 71, daysOnMarket: 35, priceChange: 0.3 },
    { period: "Oct 2025", medianPrice: 408400, avgPricePerSqFt: 205, salesVolume: 89, daysOnMarket: 29, priceChange: 0.5 },
    { period: "Sep 2025", medianPrice: 406400, avgPricePerSqFt: 204, salesVolume: 95, daysOnMarket: 27, priceChange: 0.7 },
    { period: "Aug 2025", medianPrice: 403600, avgPricePerSqFt: 202, salesVolume: 98, daysOnMarket: 25, priceChange: 0.8 },
    { period: "Jul 2025", medianPrice: 400400, avgPricePerSqFt: 200, salesVolume: 102, daysOnMarket: 23, priceChange: 1.0 },
    { period: "Jun 2025", medianPrice: 396400, avgPricePerSqFt: 198, salesVolume: 108, daysOnMarket: 22, priceChange: 0.9 },
  ],
  residential: [
    { period: "May 2026", medianPrice: 395000, avgPricePerSqFt: 225, salesVolume: 72, daysOnMarket: 24, priceChange: 0.9 },
    { period: "Apr 2026", medianPrice: 391500, avgPricePerSqFt: 222, salesVolume: 78, daysOnMarket: 22, priceChange: 1.3 },
    { period: "Mar 2026", medianPrice: 386500, avgPricePerSqFt: 220, salesVolume: 88, daysOnMarket: 21, priceChange: 1.0 },
    { period: "Feb 2026", medianPrice: 382700, avgPricePerSqFt: 218, salesVolume: 64, daysOnMarket: 28, priceChange: 0.7 },
    { period: "Jan 2026", medianPrice: 380100, avgPricePerSqFt: 216, salesVolume: 52, daysOnMarket: 34, priceChange: 0.5 },
    { period: "Dec 2025", medianPrice: 378200, avgPricePerSqFt: 215, salesVolume: 45, daysOnMarket: 38, priceChange: -0.1 },
  ],
  commercial: [
    { period: "May 2026", medianPrice: 875000, avgPricePerSqFt: 185, salesVolume: 8, daysOnMarket: 65, priceChange: 0.4 },
    { period: "Apr 2026", medianPrice: 871500, avgPricePerSqFt: 184, salesVolume: 7, daysOnMarket: 72, priceChange: 0.6 },
    { period: "Mar 2026", medianPrice: 866300, avgPricePerSqFt: 182, salesVolume: 9, daysOnMarket: 58, priceChange: 0.5 },
    { period: "Feb 2026", medianPrice: 862000, avgPricePerSqFt: 181, salesVolume: 6, daysOnMarket: 78, priceChange: 0.3 },
    { period: "Jan 2026", medianPrice: 859400, avgPricePerSqFt: 180, salesVolume: 5, daysOnMarket: 85, priceChange: 0.2 },
    { period: "Dec 2025", medianPrice: 857700, avgPricePerSqFt: 180, salesVolume: 4, daysOnMarket: 90, priceChange: -0.3 },
  ],
  agricultural: [
    { period: "May 2026", medianPrice: 285000, avgPricePerSqFt: 45, salesVolume: 4, daysOnMarket: 95, priceChange: 0.2 },
    { period: "Apr 2026", medianPrice: 284400, avgPricePerSqFt: 45, salesVolume: 3, daysOnMarket: 102, priceChange: 0.3 },
    { period: "Mar 2026", medianPrice: 283600, avgPricePerSqFt: 44, salesVolume: 5, daysOnMarket: 88, priceChange: 0.4 },
    { period: "Feb 2026", medianPrice: 282500, avgPricePerSqFt: 44, salesVolume: 2, daysOnMarket: 115, priceChange: 0.1 },
    { period: "Jan 2026", medianPrice: 282200, avgPricePerSqFt: 44, salesVolume: 3, daysOnMarket: 108, priceChange: 0.2 },
    { period: "Dec 2025", medianPrice: 281600, avgPricePerSqFt: 44, salesVolume: 2, daysOnMarket: 120, priceChange: -0.1 },
  ],
  industrial: [
    { period: "May 2026", medianPrice: 1250000, avgPricePerSqFt: 95, salesVolume: 3, daysOnMarket: 120, priceChange: 0.6 },
    { period: "Apr 2026", medianPrice: 1242500, avgPricePerSqFt: 94, salesVolume: 2, daysOnMarket: 135, priceChange: 0.8 },
    { period: "Mar 2026", medianPrice: 1232600, avgPricePerSqFt: 93, salesVolume: 4, daysOnMarket: 105, priceChange: 0.7 },
    { period: "Feb 2026", medianPrice: 1224000, avgPricePerSqFt: 92, salesVolume: 2, daysOnMarket: 142, priceChange: 0.4 },
    { period: "Jan 2026", medianPrice: 1219100, avgPricePerSqFt: 92, salesVolume: 1, daysOnMarket: 158, priceChange: 0.3 },
    { period: "Dec 2025", medianPrice: 1215500, avgPricePerSqFt: 91, salesVolume: 2, daysOnMarket: 145, priceChange: -0.2 },
  ],
};

const propertyTypeLabels: Record<PropertyType, string> = {
  all: "All Properties",
  residential: "Residential",
  commercial: "Commercial",
  agricultural: "Agricultural",
  industrial: "Industrial",
};

const propertyTypeIcons: Record<PropertyType, typeof Home> = {
  all: BarChart3,
  residential: Home,
  commercial: Building2,
  agricultural: Trees,
  industrial: Factory,
};

interface MarketTrendAnalysisProps {
  className?: string;
}

export function MarketTrendAnalysis({ className }: MarketTrendAnalysisProps) {
  const [propertyType, setPropertyType] = useState<PropertyType>("all");
  const [timeRange, setTimeRange] = useState<TimeRange>("1y");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const trendData = mockTrendData[propertyType];

  const summary: MarketSummary = useMemo(() => {
    const current = trendData[0];
    const previous = trendData[trendData.length - 1];
    const yoyChange = ((current.medianPrice - previous.medianPrice) / previous.medianPrice) * 100;
    const totalSales = trendData.reduce((sum, d) => sum + d.salesVolume, 0);

    return {
      currentMedian: current.medianPrice,
      previousMedian: previous.medianPrice,
      yoyChange,
      trendFactor: 1 + yoyChange / 100,
      confidenceLevel: totalSales > 200 ? "high" : totalSales > 100 ? "medium" : "low",
      sampleSize: totalSales,
    };
  }, [trendData]);

  const maxPrice = Math.max(...trendData.map((d) => d.medianPrice));
  const minPrice = Math.min(...trendData.map((d) => d.medianPrice));
  const priceRange = maxPrice - minPrice;

  const TypeIcon = propertyTypeIcons[propertyType];

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Market Trend Analysis</h3>
            <p className="text-[10px] text-muted-foreground">
              Time-adjusted market indicators for assessment trending
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Property Type Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              <TypeIcon className="h-3.5 w-3.5" />
              {propertyTypeLabels[propertyType]}
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showTypeDropdown && "rotate-180")} />
            </button>
            {showTypeDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTypeDropdown(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
                  {(Object.keys(propertyTypeLabels) as PropertyType[]).map((type) => {
                    const Icon = propertyTypeIcons[type];
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setPropertyType(type);
                          setShowTypeDropdown(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors hover:bg-accent",
                          propertyType === type && "bg-primary/10 text-primary"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {propertyTypeLabels[type]}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Time Range */}
          <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
            {(["6m", "1y", "2y", "5y"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "h-6 rounded-md px-2 text-[10px] font-medium transition-colors",
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 border-b border-border p-4 sm:grid-cols-4">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Current Median</p>
          <p className="mt-1 text-lg font-bold text-foreground">${formatNumber(summary.currentMedian)}</p>
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">YoY Change</p>
          <div className="mt-1 flex items-center gap-1">
            {summary.yoyChange >= 0 ? (
              <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <p className={cn(
              "text-lg font-bold",
              summary.yoyChange >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"
            )}>
              {summary.yoyChange >= 0 ? "+" : ""}{summary.yoyChange.toFixed(1)}%
            </p>
          </div>
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Trend Factor</p>
          <p className="mt-1 text-lg font-bold text-foreground">{summary.trendFactor.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Confidence</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
              summary.confidenceLevel === "high" && "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
              summary.confidenceLevel === "medium" && "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
              summary.confidenceLevel === "low" && "bg-destructive/10 text-destructive"
            )}>
              {summary.confidenceLevel.charAt(0).toUpperCase() + summary.confidenceLevel.slice(1)}
            </span>
            <span className="text-[10px] text-muted-foreground">({summary.sampleSize} sales)</span>
          </div>
        </div>
      </div>

      {/* Trend Chart */}
      <div className="p-4">
        <div className="mb-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Median Price Trend</span>
          <span>${formatNumber(minPrice)} - ${formatNumber(maxPrice)}</span>
        </div>
        
        {/* Simple Bar Chart */}
        <div className="flex h-32 items-end gap-1">
          {trendData.slice().reverse().map((data, idx) => {
            const height = priceRange > 0 
              ? ((data.medianPrice - minPrice) / priceRange) * 100 
              : 50;
            const isPositive = data.priceChange >= 0;
            
            return (
              <div key={idx} className="group relative flex-1">
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    isPositive ? "bg-[hsl(var(--success))]/60" : "bg-destructive/60",
                    "group-hover:opacity-80"
                  )}
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1.5 text-[10px] shadow-lg group-hover:block">
                  <p className="font-medium text-foreground">{data.period}</p>
                  <p className="text-muted-foreground">${formatNumber(data.medianPrice)}</p>
                  <p className={cn(
                    isPositive ? "text-[hsl(var(--success))]" : "text-destructive"
                  )}>
                    {isPositive ? "+" : ""}{data.priceChange}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div className="mt-1 flex justify-between text-[8px] text-muted-foreground">
          <span>{trendData[trendData.length - 1].period}</span>
          <span>{trendData[0].period}</span>
        </div>
      </div>

      {/* Monthly Data Table */}
      <div className="border-t border-border">
        <div className="max-h-48 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
              <tr className="border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Period</th>
                <th className="px-3 py-2 text-right font-medium">Median</th>
                <th className="px-3 py-2 text-right font-medium">$/SqFt</th>
                <th className="px-3 py-2 text-right font-medium">Volume</th>
                <th className="px-3 py-2 text-right font-medium">DOM</th>
                <th className="px-3 py-2 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {trendData.map((data, idx) => (
                <tr key={idx} className="border-b border-border last:border-b-0 hover:bg-accent/50">
                  <td className="px-3 py-2 font-medium text-foreground">{data.period}</td>
                  <td className="px-3 py-2 text-right font-mono text-foreground">${formatNumber(data.medianPrice)}</td>
                  <td className="px-3 py-2 text-right font-mono text-muted-foreground">${data.avgPricePerSqFt}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{data.salesVolume}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{data.daysOnMarket}</td>
                  <td className={cn(
                    "px-3 py-2 text-right font-medium",
                    data.priceChange >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"
                  )}>
                    {data.priceChange >= 0 ? "+" : ""}{data.priceChange}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 border-t border-border p-3 text-[10px] text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        <span>
          Trend factors are applied to time-adjust sales for ratio studies. Use the trend factor to adjust older sales to current market value.
        </span>
      </div>
    </div>
  );
}
