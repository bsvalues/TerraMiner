"use client";

import { useState, useMemo } from "react";
import {
  Calculator,
  DollarSign,
  Percent,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  Building2,
  GraduationCap,
  Ambulance,
  TreePine,
  Library,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface TaxDistrict {
  id: string;
  name: string;
  rate: number; // Mills (per $1000)
  icon: typeof Building2;
  description: string;
}

// Benton County tax districts (realistic rates in mills)
const TAX_DISTRICTS: TaxDistrict[] = [
  { id: "county", name: "Benton County", rate: 1.45, icon: Building2, description: "County general fund" },
  { id: "school", name: "School District", rate: 4.82, icon: GraduationCap, description: "K-12 education" },
  { id: "fire", name: "Fire District", rate: 1.25, icon: Ambulance, description: "Fire & EMS services" },
  { id: "port", name: "Port District", rate: 0.45, icon: Building2, description: "Port operations" },
  { id: "library", name: "Library District", rate: 0.50, icon: Library, description: "Public library" },
  { id: "parks", name: "Parks & Rec", rate: 0.35, icon: TreePine, description: "Parks maintenance" },
  { id: "road", name: "Road District", rate: 0.65, icon: Building2, description: "Road maintenance" },
  { id: "state", name: "State School", rate: 2.35, icon: GraduationCap, description: "State education levy" },
];

interface TaxCalculatorProps {
  assessedValue?: number;
  exemptions?: number;
  city?: string;
}

export function TaxCalculator({
  assessedValue: initialValue = 285000,
  exemptions: initialExemptions = 50000,
  city = "Richland",
}: TaxCalculatorProps) {
  const [assessedValue, setAssessedValue] = useState(initialValue);
  const [exemptions, setExemptions] = useState(initialExemptions);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [compareValue, setCompareValue] = useState(assessedValue * 1.05);

  const taxableValue = Math.max(0, assessedValue - exemptions);
  const compareTaxableValue = Math.max(0, compareValue - exemptions);

  // Total mill rate
  const totalMillRate = useMemo(() => {
    return TAX_DISTRICTS.reduce((sum, d) => sum + d.rate, 0);
  }, []);

  // Calculate tax for a given taxable value
  const calculateTax = (value: number) => {
    return (value / 1000) * totalMillRate;
  };

  const annualTax = calculateTax(taxableValue);
  const monthlyTax = annualTax / 12;
  const compareAnnualTax = calculateTax(compareTaxableValue);
  const taxDifference = compareAnnualTax - annualTax;

  // Tax by district
  const taxByDistrict = useMemo(() => {
    return TAX_DISTRICTS.map((district) => ({
      ...district,
      amount: (taxableValue / 1000) * district.rate,
      compareAmount: (compareTaxableValue / 1000) * district.rate,
      percentage: (district.rate / totalMillRate) * 100,
    }));
  }, [taxableValue, compareTaxableValue, totalMillRate]);

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Calculator className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tax Calculator</h3>
            <p className="text-[10px] text-muted-foreground">
              {city} • {totalMillRate.toFixed(2)} mills total
            </p>
          </div>
        </div>
        <button
          onClick={() => setCompareMode(!compareMode)}
          className={cn(
            "flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-medium transition-colors",
            compareMode
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <TrendingUp className="h-3 w-3" />
          Compare
        </button>
      </div>

      {/* Input Section */}
      <div className="border-b border-border p-4">
        <div className={cn("grid gap-3", compareMode ? "grid-cols-2" : "grid-cols-1")}>
          <div>
            <label className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Assessed Value
            </label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <input
                type="number"
                value={assessedValue}
                onChange={(e) => setAssessedValue(Number(e.target.value) || 0)}
                className="h-9 w-full rounded-md border border-border bg-background pl-6 pr-2 text-sm font-medium"
              />
            </div>
          </div>
          {compareMode && (
            <div>
              <label className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Compare To
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <input
                  type="number"
                  value={compareValue}
                  onChange={(e) => setCompareValue(Number(e.target.value) || 0)}
                  className="h-9 w-full rounded-md border border-border bg-background pl-6 pr-2 text-sm font-medium"
                />
              </div>
            </div>
          )}
        </div>
        <div className="mt-3">
          <label className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Percent className="h-3 w-3" />
            Exemptions
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <input
              type="number"
              value={exemptions}
              onChange={(e) => setExemptions(Number(e.target.value) || 0)}
              className="h-9 w-full rounded-md border border-border bg-background pl-6 pr-2 text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className={cn("grid gap-3 border-b border-border p-4", compareMode ? "grid-cols-2" : "grid-cols-1")}>
        <div className={cn("rounded-lg p-3", compareMode ? "bg-muted/30" : "bg-primary/5")}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">Taxable Value</span>
            {!compareMode && <span className="text-[10px] text-muted-foreground">Annual Tax</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">${formatNumber(taxableValue)}</span>
            {!compareMode && (
              <span className="text-lg font-bold text-primary">${formatNumber(annualTax)}</span>
            )}
          </div>
          {compareMode && (
            <p className="mt-1 text-sm font-semibold text-primary">${formatNumber(annualTax)}/year</p>
          )}
        </div>
        {compareMode && (
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Compare Taxable</span>
            </div>
            <span className="text-lg font-bold text-foreground">${formatNumber(compareTaxableValue)}</span>
            <p className="mt-1 text-sm font-semibold text-foreground">${formatNumber(compareAnnualTax)}/year</p>
          </div>
        )}
      </div>

      {/* Comparison Difference */}
      {compareMode && (
        <div className="border-b border-border p-4">
          <div
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg p-3",
              taxDifference > 0
                ? "bg-destructive/10 text-destructive"
                : taxDifference < 0
                ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                : "bg-muted text-muted-foreground"
            )}
          >
            {taxDifference > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : taxDifference < 0 ? (
              <TrendingDown className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
            <span className="text-sm font-semibold">
              {taxDifference === 0
                ? "No difference"
                : `${taxDifference > 0 ? "+" : ""}$${formatNumber(Math.abs(taxDifference))}/year`}
            </span>
            {taxDifference !== 0 && (
              <span className="text-xs">
                ({taxDifference > 0 ? "+" : ""}${formatNumber(Math.abs(taxDifference / 12))}/month)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Monthly/Annual Toggle */}
      {!compareMode && (
        <div className="grid grid-cols-2 gap-3 border-b border-border p-4">
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Monthly</p>
            <p className="text-lg font-bold text-foreground">${formatNumber(monthlyTax)}</p>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Annual</p>
            <p className="text-lg font-bold text-foreground">${formatNumber(annualTax)}</p>
          </div>
        </div>
      )}

      {/* Tax Breakdown */}
      <div className="p-4">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex w-full items-center justify-between text-[10px] font-medium text-muted-foreground hover:text-foreground"
        >
          <span>Tax Breakdown by District</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", showBreakdown && "rotate-180")} />
        </button>

        {showBreakdown && (
          <div className="mt-3 space-y-2">
            {taxByDistrict.map((district) => {
              const Icon = district.icon;
              return (
                <div
                  key={district.id}
                  className="flex items-center gap-2 rounded-lg bg-muted/30 p-2"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-background">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-foreground truncate">
                        {district.name}
                      </span>
                      <span className="text-[10px] font-semibold text-foreground">
                        ${formatNumber(district.amount)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${district.percentage}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-12 text-right">
                        {district.rate.toFixed(2)} mills
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-border p-2">
          <Info className="h-3 w-3 shrink-0 text-muted-foreground mt-0.5" />
          <p className="text-[9px] text-muted-foreground">
            Tax estimates are for informational purposes only. Actual taxes may vary based on
            special assessments, ballot measures, and other factors. Contact your county
            assessor for official tax information.
          </p>
        </div>
      </div>
    </div>
  );
}
