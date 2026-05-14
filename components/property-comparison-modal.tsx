"use client";

import { useState } from "react";
import { X, ArrowUpDown, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PropertyData } from "@/components/property-card";

interface PropertyComparisonModalProps {
  properties: PropertyData[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

interface ComparisonRow {
  label: string;
  key: string;
  format?: (value: unknown) => string;
  highlight?: "higher-better" | "lower-better" | "neutral";
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Address", key: "address", highlight: "neutral" },
  { label: "City", key: "city", highlight: "neutral" },
  { label: "Neighborhood", key: "neighborhood_code", highlight: "neutral" },
  { 
    label: "List Price", 
    key: "price", 
    format: (v) => `$${Number(v).toLocaleString()}`,
    highlight: "lower-better"
  },
  { 
    label: "Assessed Value", 
    key: "assessed_value", 
    format: (v) => v ? `$${Number(v).toLocaleString()}` : "--",
    highlight: "neutral"
  },
  { 
    label: "Assessment Ratio", 
    key: "ratio", 
    format: (v) => v ? Number(v).toFixed(4) : "--",
    highlight: "neutral"
  },
  { 
    label: "Price/SqFt", 
    key: "price_per_sqft", 
    format: (v) => v ? `$${Number(v).toFixed(0)}` : "--",
    highlight: "lower-better"
  },
  { label: "Bedrooms", key: "bedrooms", highlight: "higher-better" },
  { label: "Bathrooms", key: "bathrooms", highlight: "higher-better" },
  { 
    label: "Square Feet", 
    key: "square_feet", 
    format: (v) => v ? Number(v).toLocaleString() : "--",
    highlight: "higher-better"
  },
  { label: "Year Built", key: "year_built", highlight: "higher-better" },
  { 
    label: "Lot Size", 
    key: "lot_size", 
    format: (v) => v ? `${Number(v).toLocaleString()} sqft` : "--",
    highlight: "higher-better"
  },
  { 
    label: "Investment Score", 
    key: "investment_score", 
    format: (v) => v ? `${Number(v).toFixed(1)}/10` : "--",
    highlight: "higher-better"
  },
  { label: "Investment Grade", key: "investment_grade", highlight: "neutral" },
  { label: "Days on Market", key: "dom", highlight: "lower-better" },
];

export function PropertyComparisonModal({ properties, onRemove, onClose }: PropertyComparisonModalProps) {
  const [highlightBest, setHighlightBest] = useState(true);

  if (properties.length === 0) return null;

  const getValue = (property: PropertyData, key: string): unknown => {
    // Cast to any for flexible property access
    const p = property as unknown as Record<string, unknown>;
    
    // Handle computed values
    if (key === "ratio") {
      const assessed = Number(property.assessed_value) || 0;
      const price = Number(property.price) || 0;
      return price > 0 ? assessed / price : null;
    }
    if (key === "price_per_sqft") {
      const price = Number(property.price) || 0;
      const sqft = Number(property.sqft) || 0;
      return sqft > 0 ? price / sqft : null;
    }
    // Handle aliases using flexible access
    if (key === "square_feet") {
      return p.square_feet ?? property.sqft;
    }
    if (key === "year_built") {
      return property.year_built ?? property.yearBuilt;
    }
    if (key === "bedrooms") {
      return p.bedrooms ?? property.beds;
    }
    if (key === "bathrooms") {
      return p.bathrooms ?? property.baths;
    }
    return p[key];
  };

  const getBestIndex = (row: ComparisonRow): number | null => {
    if (row.highlight === "neutral" || properties.length < 2) return null;

    const values = properties.map((p) => {
      const v = getValue(p, row.key);
      return typeof v === "number" ? v : null;
    });

    const validValues = values.filter((v): v is number => v !== null);
    if (validValues.length < 2) return null;

    const bestValue = row.highlight === "higher-better" 
      ? Math.max(...validValues) 
      : Math.min(...validValues);
    
    return values.findIndex((v) => v === bestValue);
  };

  const getComparisonIcon = (row: ComparisonRow, index: number) => {
    if (!highlightBest || row.highlight === "neutral" || properties.length < 2) {
      return null;
    }

    const bestIndex = getBestIndex(row);
    if (bestIndex === null || bestIndex !== index) return null;

    return row.highlight === "higher-better" 
      ? <TrendingUp className="h-3 w-3 text-[hsl(var(--success))]" />
      : <TrendingDown className="h-3 w-3 text-[hsl(var(--success))]" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-secondary/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <Scale className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Property Comparison</h2>
              <p className="text-xs text-muted-foreground">
                Comparing {properties.length} {properties.length === 1 ? "property" : "properties"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={highlightBest}
                onChange={(e) => setHighlightBest(e.target.checked)}
                className="rounded border-border"
              />
              Highlight best values
            </label>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
              aria-label="Close comparison"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Comparison table */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="border-b border-border">
                <th className="w-40 bg-secondary/20 px-4 py-3 text-left text-xs font-semibold text-foreground">
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    Attribute
                  </div>
                </th>
                {properties.map((property) => (
                  <th key={property.id} className="relative min-w-[180px] px-4 py-3 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground line-clamp-1">
                          {property.address}
                        </p>
                        <p className="text-[10px] font-normal text-muted-foreground">
                          {property.city}
                        </p>
                      </div>
                      <button
                        onClick={() => onRemove(property.id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${property.address} from comparison`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, rowIndex) => {
                const bestIndex = highlightBest ? getBestIndex(row) : null;
                return (
                  <tr
                    key={row.key}
                    className={cn(
                      "border-b border-border/50",
                      rowIndex % 2 === 0 ? "bg-card" : "bg-secondary/10"
                    )}
                  >
                    <td className="px-4 py-2.5 text-xs font-medium text-muted-foreground">
                      {row.label}
                    </td>
                    {properties.map((property, colIndex) => {
                      const value = getValue(property, row.key);
                      const formatted = row.format ? row.format(value) : String(value ?? "--");
                      const isBest = bestIndex === colIndex;

                      return (
                        <td
                          key={property.id}
                          className={cn(
                            "px-4 py-2.5 text-xs",
                            isBest && "bg-[hsl(var(--success))]/10 font-semibold text-[hsl(var(--success))]"
                          )}
                        >
                          <span className="inline-flex items-center gap-1">
                            {formatted}
                            {getComparisonIcon(row, colIndex)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-secondary/20 px-5 py-3">
          <p className="text-[10px] text-muted-foreground">
            Green highlights indicate the best value for each metric
          </p>
          <button
            onClick={onClose}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
