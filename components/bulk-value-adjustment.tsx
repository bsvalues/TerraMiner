"use client";

import { useState, useMemo } from "react";
import { cn, formatNumber } from "@/lib/utils";
import {
  Calculator,
  Percent,
  DollarSign,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  FileSpreadsheet,
  Filter,
  ChevronDown,
} from "lucide-react";

interface PropertyData {
  id: string;
  address: string;
  city: string;
  neighborhood?: string;
  assessed_value?: number;
  price?: number;
}

interface BulkValueAdjustmentProps {
  selectedProperties: PropertyData[];
  onApply: (adjustments: AdjustmentResult[]) => void;
  onCancel: () => void;
}

interface AdjustmentResult {
  propertyId: string;
  originalValue: number;
  newValue: number;
  change: number;
  changePercent: number;
}

type AdjustmentMethod = "percentage" | "fixed" | "target-ratio";

export function BulkValueAdjustment({
  selectedProperties,
  onApply,
  onCancel,
}: BulkValueAdjustmentProps) {
  const [method, setMethod] = useState<AdjustmentMethod>("percentage");
  const [percentageValue, setPercentageValue] = useState<string>("5");
  const [fixedValue, setFixedValue] = useState<string>("10000");
  const [targetRatio, setTargetRatio] = useState<string>("0.95");
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [applyToFilter, setApplyToFilter] = useState<"all" | "neighborhood" | "city">("all");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [isApplying, setIsApplying] = useState(false);

  // Get unique neighborhoods and cities
  const neighborhoods = useMemo(() => {
    return Array.from(new Set(selectedProperties.map(p => p.neighborhood).filter(Boolean))) as string[];
  }, [selectedProperties]);

  const cities = useMemo(() => {
    return Array.from(new Set(selectedProperties.map(p => p.city).filter(Boolean))) as string[];
  }, [selectedProperties]);

  // Filter properties based on selection
  const filteredProperties = useMemo(() => {
    let filtered = selectedProperties;
    if (applyToFilter === "neighborhood" && selectedNeighborhood) {
      filtered = filtered.filter(p => p.neighborhood === selectedNeighborhood);
    } else if (applyToFilter === "city" && selectedCity) {
      filtered = filtered.filter(p => p.city === selectedCity);
    }
    return filtered;
  }, [selectedProperties, applyToFilter, selectedNeighborhood, selectedCity]);

  // Calculate adjustments
  const adjustments = useMemo((): AdjustmentResult[] => {
    return filteredProperties.map(property => {
      const originalValue = Number(property.assessed_value) || 0;
      let newValue = originalValue;

      if (method === "percentage") {
        const percent = parseFloat(percentageValue) || 0;
        const change = originalValue * (percent / 100);
        newValue = direction === "increase" ? originalValue + change : originalValue - change;
      } else if (method === "fixed") {
        const fixed = parseFloat(fixedValue) || 0;
        newValue = direction === "increase" ? originalValue + fixed : originalValue - fixed;
      } else if (method === "target-ratio") {
        const ratio = parseFloat(targetRatio) || 0.95;
        const marketValue = Number(property.price) || 0;
        if (marketValue > 0) {
          newValue = marketValue * ratio;
        }
      }

      // Ensure non-negative
      newValue = Math.max(0, newValue);

      return {
        propertyId: property.id,
        originalValue,
        newValue: Math.round(newValue),
        change: Math.round(newValue - originalValue),
        changePercent: originalValue > 0 ? ((newValue - originalValue) / originalValue) * 100 : 0,
      };
    });
  }, [filteredProperties, method, percentageValue, fixedValue, targetRatio, direction]);

  // Summary stats
  const summary = useMemo(() => {
    const totalOriginal = adjustments.reduce((sum, a) => sum + a.originalValue, 0);
    const totalNew = adjustments.reduce((sum, a) => sum + a.newValue, 0);
    const totalChange = totalNew - totalOriginal;
    const avgChangePercent = adjustments.length > 0
      ? adjustments.reduce((sum, a) => sum + a.changePercent, 0) / adjustments.length
      : 0;

    return {
      count: adjustments.length,
      totalOriginal,
      totalNew,
      totalChange,
      avgChangePercent,
    };
  }, [adjustments]);

  const handleApply = async () => {
    setIsApplying(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    onApply(adjustments);
    setIsApplying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Bulk Value Adjustment</h2>
              <p className="text-xs text-muted-foreground">
                Adjust assessed values for {selectedProperties.length} properties
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-180px)] overflow-y-auto p-6">
          {/* Adjustment Method */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Adjustment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "percentage", label: "Percentage", icon: Percent },
                { id: "fixed", label: "Fixed Amount", icon: DollarSign },
                { id: "target-ratio", label: "Target Ratio", icon: Calculator },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMethod(id as AdjustmentMethod)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors",
                    method === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Method-specific inputs */}
          <div className="mb-6">
            {method === "percentage" && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Percentage
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={percentageValue}
                      onChange={(e) => setPercentageValue(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Direction
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDirection("increase")}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
                        direction === "increase"
                          ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      Increase
                    </button>
                    <button
                      onClick={() => setDirection("decrease")}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
                        direction === "decrease"
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      Decrease
                    </button>
                  </div>
                </div>
              </div>
            )}

            {method === "fixed" && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Fixed Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      type="number"
                      value={fixedValue}
                      onChange={(e) => setFixedValue(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 pl-7 text-sm text-foreground"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Direction
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDirection("increase")}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
                        direction === "increase"
                          ? "border-[hsl(var(--success))] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                      Increase
                    </button>
                    <button
                      onClick={() => setDirection("decrease")}
                      className={cn(
                        "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
                        direction === "decrease"
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                      Decrease
                    </button>
                  </div>
                </div>
              </div>
            )}

            {method === "target-ratio" && (
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Target Assessment Ratio
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    value={targetRatio}
                    onChange={(e) => setTargetRatio(e.target.value)}
                    className="flex-1"
                    min="0.80"
                    max="1.10"
                    step="0.01"
                  />
                  <div className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-center text-sm font-medium text-foreground">
                    {(parseFloat(targetRatio) * 100).toFixed(0)}%
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  IAAO recommended range: 90% - 110% (0.90 - 1.10)
                </p>
              </div>
            )}
          </div>

          {/* Filter by neighborhood/city */}
          {(neighborhoods.length > 1 || cities.length > 1) && (
            <div className="mb-6">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Apply To
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setApplyToFilter("all")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    applyToFilter === "all"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  All Selected ({selectedProperties.length})
                </button>
                {neighborhoods.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={() => setApplyToFilter("neighborhood")}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                        applyToFilter === "neighborhood"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Filter className="h-3 w-3" />
                      By Neighborhood
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    {applyToFilter === "neighborhood" && (
                      <select
                        value={selectedNeighborhood}
                        onChange={(e) => setSelectedNeighborhood(e.target.value)}
                        className="absolute left-0 top-full mt-1 w-full rounded-lg border border-border bg-card px-2 py-1 text-xs"
                      >
                        <option value="">Select neighborhood...</option>
                        {neighborhoods.map(n => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Adjustment Preview</h3>
            </div>

            {/* Summary stats */}
            <div className="mb-4 grid grid-cols-4 gap-3">
              <div className="rounded-lg bg-background p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Properties</p>
                <p className="text-lg font-semibold text-foreground">{summary.count}</p>
              </div>
              <div className="rounded-lg bg-background p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Current Total</p>
                <p className="text-lg font-semibold text-foreground">${formatNumber(summary.totalOriginal)}</p>
              </div>
              <div className="rounded-lg bg-background p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">New Total</p>
                <p className="text-lg font-semibold text-foreground">${formatNumber(summary.totalNew)}</p>
              </div>
              <div className="rounded-lg bg-background p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Net Change</p>
                <p className={cn(
                  "text-lg font-semibold",
                  summary.totalChange >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"
                )}>
                  {summary.totalChange >= 0 ? "+" : ""}{summary.avgChangePercent.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Sample adjustments */}
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 text-left font-medium">Address</th>
                    <th className="py-2 text-right font-medium">Current</th>
                    <th className="py-2 text-right font-medium">New</th>
                    <th className="py-2 text-right font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments.slice(0, 5).map((adj, i) => {
                    const property = filteredProperties[i];
                    return (
                      <tr key={adj.propertyId} className="border-b border-border/50">
                        <td className="py-2 text-foreground">{property?.address || adj.propertyId}</td>
                        <td className="py-2 text-right text-muted-foreground">${formatNumber(adj.originalValue)}</td>
                        <td className="py-2 text-right text-foreground">${formatNumber(adj.newValue)}</td>
                        <td className={cn(
                          "py-2 text-right font-medium",
                          adj.change >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"
                        )}>
                          {adj.change >= 0 ? "+" : ""}{adj.changePercent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {adjustments.length > 5 && (
                <p className="mt-2 text-center text-[10px] text-muted-foreground">
                  and {adjustments.length - 5} more properties...
                </p>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--warning))]" />
            <div>
              <p className="text-xs font-medium text-[hsl(var(--warning))]">Review Before Applying</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                This action will update assessed values for {summary.count} properties. Changes will be logged for audit purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying || summary.count === 0}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Apply Adjustments
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
