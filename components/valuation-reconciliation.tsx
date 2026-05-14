"use client";

import { useState, useMemo } from "react";
import {
  Scale,
  Check,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calculator,
  FileText,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  History,
  MessageSquare,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

interface ValuationApproach {
  id: string;
  name: string;
  value: number;
  weight: number;
  confidence: "high" | "medium" | "low";
  applicability: "primary" | "secondary" | "supportive" | "not_applicable";
  notes: string;
  lastUpdated: string;
}

interface ValuationReconciliationProps {
  propertyId: string;
  propertyType?: string;
  salesApproachValue?: number;
  costApproachValue?: number;
  incomeApproachValue?: number;
  currentAssessedValue?: number;
  className?: string;
}

const CONFIDENCE_COLORS = {
  high: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-red-500/20 text-red-400 border-red-500/30",
};

const APPLICABILITY_LABELS = {
  primary: "Primary",
  secondary: "Secondary",
  supportive: "Supportive",
  not_applicable: "N/A",
};

export function ValuationReconciliation({
  propertyId,
  propertyType = "Residential",
  salesApproachValue = 385000,
  costApproachValue = 370600,
  incomeApproachValue = 172487,
  currentAssessedValue = 361250,
  className,
}: ValuationReconciliationProps) {
  const [approaches, setApproaches] = useState<ValuationApproach[]>([
    {
      id: "sales",
      name: "Sales Comparison",
      value: salesApproachValue,
      weight: 60,
      confidence: "high",
      applicability: "primary",
      notes: "Strong market data with 8 comparable sales within 6 months",
      lastUpdated: "May 14, 2026",
    },
    {
      id: "cost",
      name: "Cost Approach",
      value: costApproachValue,
      weight: 30,
      confidence: "medium",
      applicability: "secondary",
      notes: "Marshall & Swift costs applied with 18% physical depreciation",
      lastUpdated: "May 14, 2026",
    },
    {
      id: "income",
      name: "Income Approach",
      value: incomeApproachValue,
      weight: 10,
      confidence: "low",
      applicability: "supportive",
      notes: "Limited rental data for owner-occupied SFR; included for reference",
      lastUpdated: "May 14, 2026",
    },
  ]);

  const [isLocked, setIsLocked] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [reconciliationNotes, setReconciliationNotes] = useState(
    "Final value weighted primarily on sales comparison due to strong comparable data. Cost approach supports value range. Income approach given minimal weight as property is owner-occupied."
  );

  // Calculate weighted average value
  const reconciledValue = useMemo(() => {
    const totalWeight = approaches.reduce((sum, a) => sum + a.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = approaches.reduce((sum, a) => sum + a.value * a.weight, 0);
    return Math.round(weighted / totalWeight);
  }, [approaches]);

  // Calculate value range
  const valueRange = useMemo(() => {
    const values = approaches.map((a) => a.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      spread: Math.max(...values) - Math.min(...values),
      spreadPercent: ((Math.max(...values) - Math.min(...values)) / Math.min(...values)) * 100,
    };
  }, [approaches]);

  // Calculate change from current
  const changeFromCurrent = useMemo(() => {
    const change = reconciledValue - currentAssessedValue;
    const percent = (change / currentAssessedValue) * 100;
    return { amount: change, percent };
  }, [reconciledValue, currentAssessedValue]);

  const updateWeight = (id: string, newWeight: number) => {
    if (isLocked) return;
    setApproaches((prev) =>
      prev.map((a) => (a.id === id ? { ...a, weight: Math.max(0, Math.min(100, newWeight)) } : a))
    );
  };

  const updateConfidence = (id: string, confidence: "high" | "medium" | "low") => {
    if (isLocked) return;
    setApproaches((prev) => prev.map((a) => (a.id === id ? { ...a, confidence } : a)));
  };

  const totalWeight = approaches.reduce((sum, a) => sum + a.weight, 0);

  const reconciliationHistory = [
    { date: "May 14, 2026", user: "Sarah Chen", value: reconciledValue, action: "Initial reconciliation" },
    { date: "May 10, 2026", user: "Mike Rodriguez", value: 358000, action: "Draft value review" },
    { date: "Apr 28, 2026", user: "System", value: 355000, action: "Automated preliminary" },
  ];

  return (
    <div className={cn("rounded-xl border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20">
            <Scale className="h-4.5 w-4.5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Valuation Reconciliation</h3>
            <p className="text-xs text-muted-foreground">Final value determination for {propertyType}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium",
              isLocked
                ? "bg-amber-500/20 text-amber-400"
                : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {isLocked ? "Locked" : "Lock"}
          </button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <div className="border-b border-border bg-muted/30 p-4">
          <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reconciliation History
          </h4>
          <div className="space-y-2">
            {reconciliationHistory.map((entry, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-background p-2.5">
                <div className="flex items-center gap-3">
                  <div className="text-xs text-muted-foreground">{entry.date}</div>
                  <div className="text-xs text-foreground">{entry.user}</div>
                  <div className="text-xs text-muted-foreground">{entry.action}</div>
                </div>
                <div className="text-xs font-medium text-foreground">${formatNumber(entry.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reconciled Value Summary */}
      <div className="border-b border-border bg-gradient-to-r from-violet-500/5 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Reconciled Market Value</div>
            <div className="text-2xl font-bold text-foreground">${formatNumber(reconciledValue)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Change from Current</div>
            <div
              className={cn(
                "flex items-center justify-end gap-1 text-lg font-semibold",
                changeFromCurrent.amount >= 0 ? "text-emerald-400" : "text-red-400"
              )}
            >
              {changeFromCurrent.amount >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {changeFromCurrent.amount >= 0 ? "+" : ""}
              {changeFromCurrent.percent.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {changeFromCurrent.amount >= 0 ? "+" : ""}${formatNumber(Math.abs(changeFromCurrent.amount))}
            </div>
          </div>
        </div>

        {/* Value Range Indicator */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Value Range</span>
            <span className="text-muted-foreground">{valueRange.spreadPercent.toFixed(1)}% spread</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted">
            <div
              className="absolute h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-500"
              style={{ left: "0%", width: "100%" }}
            />
            {/* Reconciled value marker */}
            <div
              className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-foreground"
              style={{
                left: `${((reconciledValue - valueRange.min) / valueRange.spread) * 100}%`,
              }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>${formatNumber(valueRange.min)}</span>
            <span>${formatNumber(valueRange.max)}</span>
          </div>
        </div>
      </div>

      {/* Weight Distribution Warning */}
      {totalWeight !== 100 && (
        <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <span className="text-xs text-amber-400">
            Weights total {totalWeight}% (should equal 100%)
          </span>
        </div>
      )}

      {/* Approach Cards */}
      <div className="divide-y divide-border">
        {approaches.map((approach) => (
          <ApproachCard
            key={approach.id}
            approach={approach}
            reconciledValue={reconciledValue}
            isLocked={isLocked}
            onWeightChange={(w) => updateWeight(approach.id, w)}
            onConfidenceChange={(c) => updateConfidence(approach.id, c)}
          />
        ))}
      </div>

      {/* Reconciliation Notes */}
      <div className="border-t border-border p-4">
        <div className="mb-2 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Reconciliation Notes</span>
        </div>
        <textarea
          value={reconciliationNotes}
          onChange={(e) => setReconciliationNotes(e.target.value)}
          disabled={isLocked}
          className="h-20 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter reconciliation rationale..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-border bg-muted/30 p-4">
        <div className="text-xs text-muted-foreground">
          Last reconciled: May 14, 2026 by Sarah Chen
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            <FileText className="h-3.5 w-3.5" />
            Generate Report
          </button>
          <button
            disabled={isLocked || totalWeight !== 100}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Apply Value
          </button>
        </div>
      </div>
    </div>
  );
}

function ApproachCard({
  approach,
  reconciledValue,
  isLocked,
  onWeightChange,
  onConfidenceChange,
}: {
  approach: ValuationApproach;
  reconciledValue: number;
  isLocked: boolean;
  onWeightChange: (weight: number) => void;
  onConfidenceChange: (confidence: "high" | "medium" | "low") => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const deviation = ((approach.value - reconciledValue) / reconciledValue) * 100;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{approach.name}</span>
              <span
                className={cn(
                  "rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
                  CONFIDENCE_COLORS[approach.confidence]
                )}
              >
                {approach.confidence.charAt(0).toUpperCase() + approach.confidence.slice(1)} Confidence
              </span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {APPLICABILITY_LABELS[approach.applicability]}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-4">
              <span className="text-lg font-semibold text-foreground">${formatNumber(approach.value)}</span>
              <span
                className={cn(
                  "text-xs",
                  Math.abs(deviation) < 5
                    ? "text-emerald-400"
                    : Math.abs(deviation) < 10
                    ? "text-amber-400"
                    : "text-red-400"
                )}
              >
                {deviation >= 0 ? "+" : ""}
                {deviation.toFixed(1)}% from reconciled
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Weight Input */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Weight:</span>
            <div className="flex items-center">
              <button
                onClick={() => onWeightChange(approach.weight - 5)}
                disabled={isLocked}
                className="flex h-7 w-7 items-center justify-center rounded-l-md border border-r-0 border-border bg-muted text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                -
              </button>
              <input
                type="number"
                value={approach.weight}
                onChange={(e) => onWeightChange(parseInt(e.target.value) || 0)}
                disabled={isLocked}
                className="h-7 w-12 border border-border bg-background text-center text-xs text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <button
                onClick={() => onWeightChange(approach.weight + 5)}
                disabled={isLocked}
                className="flex h-7 w-7 items-center justify-center rounded-r-md border border-l-0 border-border bg-muted text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                +
              </button>
            </div>
            <span className="text-xs text-muted-foreground">%</span>
          </div>

          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 rounded-lg bg-muted/50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Confidence Level
              </div>
              <div className="flex gap-1">
                {(["high", "medium", "low"] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => onConfidenceChange(level)}
                    disabled={isLocked}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed",
                      approach.confidence === level
                        ? CONFIDENCE_COLORS[level]
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Last Updated
              </div>
              <div className="text-xs text-foreground">{approach.lastUpdated}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Notes</div>
            <div className="text-xs text-muted-foreground">{approach.notes}</div>
          </div>
        </div>
      )}
    </div>
  );
}
