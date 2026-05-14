"use client";

import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentRecord {
  year: number;
  assessed_value: number;
  market_value: number;
  ratio: number;
  change_percent: number;
  tax_amount?: number;
}

interface AssessmentHistoryTimelineProps {
  propertyId: string;
  className?: string;
}

// Mock assessment history data - in production, this would come from an API
function generateMockHistory(propertyId: string): AssessmentRecord[] {
  // Use propertyId hash to generate consistent mock data
  const hash = propertyId.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const baseValue = 250000 + (hash % 200000);
  
  const records: AssessmentRecord[] = [];
  let currentAssessed = baseValue;
  
  for (let year = 2024; year >= 2019; year--) {
    const changePercent = year === 2024 ? 0 : (Math.random() * 10 - 2); // -2% to +8%
    if (year !== 2024) {
      currentAssessed = currentAssessed / (1 + changePercent / 100);
    }
    const marketValue = currentAssessed * (0.95 + Math.random() * 0.15); // 95%-110% of assessed
    const ratio = currentAssessed / marketValue;
    
    records.push({
      year,
      assessed_value: Math.round(currentAssessed),
      market_value: Math.round(marketValue),
      ratio: Math.round(ratio * 1000) / 1000,
      change_percent: Math.round(changePercent * 10) / 10,
      tax_amount: Math.round(currentAssessed * 0.012), // ~1.2% tax rate
    });
  }
  
  return records;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function AssessmentHistoryTimeline({ propertyId, className }: AssessmentHistoryTimelineProps) {
  const history = generateMockHistory(propertyId);
  
  // Calculate overall trend
  const firstRecord = history[history.length - 1];
  const lastRecord = history[0];
  const overallChange = ((lastRecord.assessed_value - firstRecord.assessed_value) / firstRecord.assessed_value) * 100;
  
  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Assessment History</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground">6-Year Trend:</span>
          <span className={cn(
            "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            overallChange > 0 
              ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
              : overallChange < 0
              ? "bg-destructive/10 text-destructive"
              : "bg-secondary text-muted-foreground"
          )}>
            {overallChange > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : overallChange < 0 ? (
              <TrendingDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {overallChange > 0 ? "+" : ""}{overallChange.toFixed(1)}%
          </span>
        </div>
      </div>
      
      <div className="p-4">
        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-3 top-2 h-[calc(100%-16px)] w-0.5 bg-border" />
          
          {/* Timeline items */}
          <div className="space-y-4">
            {history.map((record, idx) => {
              const isFirst = idx === 0;
              const isInRange = record.ratio >= 0.9 && record.ratio <= 1.1;
              
              return (
                <div key={record.year} className="relative flex gap-4 pl-8">
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute left-1.5 top-1.5 h-3 w-3 rounded-full border-2",
                    isFirst
                      ? "border-primary bg-primary"
                      : "border-border bg-card"
                  )} />
                  
                  {/* Content */}
                  <div className={cn(
                    "flex-1 rounded-lg border p-3",
                    isFirst
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-secondary/20"
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-semibold",
                          isFirst ? "text-primary" : "text-foreground"
                        )}>
                          {record.year}
                        </span>
                        {isFirst && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
                            Current
                          </span>
                        )}
                      </div>
                      {idx > 0 && (
                        <span className={cn(
                          "flex items-center gap-0.5 text-[10px] font-medium",
                          record.change_percent > 0 
                            ? "text-[hsl(var(--success))]"
                            : record.change_percent < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        )}>
                          {record.change_percent > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : record.change_percent < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : null}
                          {record.change_percent > 0 ? "+" : ""}{record.change_percent}%
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Assessed</p>
                        <p className="font-semibold text-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          {formatCurrency(record.assessed_value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Market</p>
                        <p className="font-medium text-muted-foreground">
                          {formatCurrency(record.market_value)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Ratio</p>
                        <p className={cn(
                          "flex items-center gap-1 font-semibold",
                          isInRange ? "text-[hsl(var(--success))]" : "text-destructive"
                        )}>
                          <Percent className="h-3 w-3" />
                          {(record.ratio * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    {record.tax_amount && (
                      <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                        <span className="text-muted-foreground">Est. Annual Tax</span>
                        <span className="font-medium text-foreground">{formatCurrency(record.tax_amount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
