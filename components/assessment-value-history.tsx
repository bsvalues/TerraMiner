"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ValueRecord {
  year: number;
  landValue: number;
  improvementValue: number;
  totalValue: number;
  marketValue: number;
  taxableValue: number;
  changePercent: number;
  event?: string;
}

interface AssessmentValueHistoryProps {
  propertyId: string;
  className?: string;
}

// ── Mock historical data ───────────────────────────────────────────────────

function generateHistory(propertyId: string): ValueRecord[] {
  const seed = propertyId.charCodeAt(0) % 5;
  const baseYear = 2016;
  const baseLand = 65000 + seed * 5000;
  const baseImprovement = 180000 + seed * 15000;
  const records: ValueRecord[] = [];

  for (let i = 0; i <= 10; i++) {
    const year = baseYear + i;
    const landGrowth = 1 + (0.02 + seed * 0.005) * i + (i > 5 ? 0.015 * (i - 5) : 0);
    const impGrowth = 1 + (0.018 + seed * 0.003) * i + (i > 7 ? 0.01 * (i - 7) : 0);
    // 2020 dip
    const dip = year === 2020 ? 0.97 : year === 2021 ? 0.99 : 1;
    // 2022-2024 surge
    const surge = year >= 2022 && year <= 2024 ? 1 + 0.03 * (year - 2021) : 1;

    const land = Math.round(baseLand * landGrowth * dip * surge);
    const improvement = Math.round(baseImprovement * impGrowth * dip * surge);
    const total = land + improvement;
    const market = Math.round(total * (1 + 0.05 + seed * 0.01));
    const exemption = seed > 2 ? 50000 : seed > 0 ? 25000 : 0;
    const taxable = Math.max(0, total - exemption);
    const prev = records.length > 0 ? records[records.length - 1].totalValue : total;
    const change = records.length > 0 ? ((total - prev) / prev) * 100 : 0;

    let event: string | undefined;
    if (year === 2020) event = "COVID Market Adjustment";
    else if (year === 2022) event = "Revaluation Cycle";
    else if (year === 2024 && seed > 2) event = "Homestead Exemption Applied";
    else if (year === 2025) event = "Annual Trending Factor 1.045";

    records.push({
      year,
      landValue: land,
      improvementValue: improvement,
      totalValue: total,
      marketValue: market,
      taxableValue: taxable,
      changePercent: Number(change.toFixed(1)),
      event,
    });
  }
  return records;
}

// ── Component ──────────────────────────────────────────────────────────────

export function AssessmentValueHistory({ propertyId, className }: AssessmentValueHistoryProps) {
  const history = useMemo(() => generateHistory(propertyId), [propertyId]);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showLand, setShowLand] = useState(true);
  const [showImprovement, setShowImprovement] = useState(true);
  const [showMarket, setShowMarket] = useState(false);

  const latest = history[history.length - 1];
  const earliest = history[0];
  const totalGrowth = ((latest.totalValue - earliest.totalValue) / earliest.totalValue) * 100;
  const cagr = (Math.pow(latest.totalValue / earliest.totalValue, 1 / (latest.year - earliest.year)) - 1) * 100;

  // Chart calculations
  const maxVal = Math.max(...history.map((r) => Math.max(r.totalValue, showMarket ? r.marketValue : 0)));
  const chartWidth = 560;
  const chartHeight = 200;
  const padding = { top: 10, right: 10, bottom: 30, left: 60 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / (history.length - 1)) * plotWidth;
  const yScale = (v: number) => padding.top + plotHeight - (v / (maxVal * 1.1)) * plotHeight;

  function makePath(accessor: (r: ValueRecord) => number): string {
    return history
      .map((r, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(accessor(r)).toFixed(1)}`)
      .join(" ");
  }

  function makeArea(accessor: (r: ValueRecord) => number): string {
    const path = makePath(accessor);
    const lastX = xScale(history.length - 1);
    const firstX = xScale(0);
    const bottom = yScale(0);
    return `${path} L ${lastX} ${bottom} L ${firstX} ${bottom} Z`;
  }

  const selectedRecord = selectedYear !== null ? history.find((r) => r.year === selectedYear) : null;

  return (
    <div className={`rounded-lg border border-border bg-card ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100">
            <BarChart3 className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Assessment Value History</h3>
            <p className="text-xs text-muted-foreground">
              {earliest.year}-{latest.year} | {history.length} years of assessment records
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-muted/50 p-0.5">
            <button
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "chart" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              onClick={() => setViewMode("chart")}
            >
              Chart
            </button>
            <button
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                viewMode === "table" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 border-b border-border p-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Current Value</p>
          <p className="text-lg font-bold text-foreground">${latest.totalValue.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-xs">
            {latest.changePercent >= 0 ? (
              <TrendingUp className="h-3 w-3 text-emerald-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={latest.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}>
              {latest.changePercent > 0 ? "+" : ""}{latest.changePercent}% YoY
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">10-Year Growth</p>
          <p className="text-lg font-bold text-emerald-600">+{totalGrowth.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Since {earliest.year}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">CAGR</p>
          <p className="text-lg font-bold text-foreground">{cagr.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Compound annual</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Land / Improvement</p>
          <p className="text-lg font-bold text-foreground">
            {((latest.landValue / latest.totalValue) * 100).toFixed(0)}% / {((latest.improvementValue / latest.totalValue) * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-muted-foreground">Value split</p>
        </div>
      </div>

      {/* Chart View */}
      {viewMode === "chart" && (
        <div className="p-4">
          {/* Layer toggles */}
          <div className="mb-3 flex flex-wrap gap-3">
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" checked={showLand} onChange={() => setShowLand(!showLand)} className="h-3.5 w-3.5 rounded border-border accent-emerald-600" />
              <span className="inline-block h-2 w-4 rounded-sm bg-emerald-400" />
              <span className="text-muted-foreground">Land Value</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" checked={showImprovement} onChange={() => setShowImprovement(!showImprovement)} className="h-3.5 w-3.5 rounded border-border accent-sky-600" />
              <span className="inline-block h-2 w-4 rounded-sm bg-sky-400" />
              <span className="text-muted-foreground">Improvement Value</span>
            </label>
            <label className="flex items-center gap-1.5 text-xs">
              <input type="checkbox" checked={showMarket} onChange={() => setShowMarket(!showMarket)} className="h-3.5 w-3.5 rounded border-border accent-violet-600" />
              <span className="inline-block h-2 w-4 rounded-sm bg-violet-400" />
              <span className="text-muted-foreground">Market Value</span>
            </label>
          </div>

          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-auto w-full">
            {/* Y-axis grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const val = Math.round(maxVal * 1.1 * frac);
              const y = yScale(val);
              return (
                <g key={frac}>
                  <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} className="stroke-border/40" strokeWidth="0.5" strokeDasharray="3 3" />
                  <text x={padding.left - 5} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
                    ${(val / 1000).toFixed(0)}K
                  </text>
                </g>
              );
            })}

            {/* Area fills */}
            {showLand && (
              <path d={makeArea((r) => r.landValue)} className="fill-emerald-400/15" />
            )}
            {showImprovement && (
              <path d={makeArea((r) => r.improvementValue)} className="fill-sky-400/15" />
            )}

            {/* Lines */}
            <path d={makePath((r) => r.totalValue)} className="fill-none stroke-foreground" strokeWidth="2" />
            {showLand && (
              <path d={makePath((r) => r.landValue)} className="fill-none stroke-emerald-500" strokeWidth="1.5" strokeDasharray="4 2" />
            )}
            {showImprovement && (
              <path d={makePath((r) => r.improvementValue)} className="fill-none stroke-sky-500" strokeWidth="1.5" strokeDasharray="4 2" />
            )}
            {showMarket && (
              <path d={makePath((r) => r.marketValue)} className="fill-none stroke-violet-500" strokeWidth="1.5" strokeDasharray="6 3" />
            )}

            {/* Data points and labels */}
            {history.map((r, i) => (
              <g key={r.year}>
                <circle
                  cx={xScale(i)}
                  cy={yScale(r.totalValue)}
                  r={selectedYear === r.year ? 5 : 3}
                  className={`cursor-pointer transition-all ${
                    selectedYear === r.year ? "fill-sky-600 stroke-card" : "fill-foreground stroke-card"
                  }`}
                  strokeWidth="1.5"
                  onClick={() => setSelectedYear(selectedYear === r.year ? null : r.year)}
                />
                {/* X-axis labels */}
                <text
                  x={xScale(i)}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {String(r.year).slice(-2)}
                </text>
                {/* Event markers */}
                {r.event && (
                  <g>
                    <circle cx={xScale(i)} cy={yScale(r.totalValue) - 12} r="5" className="fill-amber-100 stroke-amber-400" strokeWidth="1" />
                    <text x={xScale(i)} y={yScale(r.totalValue) - 9} textAnchor="middle" className="fill-amber-600 text-[7px] font-bold">!</text>
                  </g>
                )}
              </g>
            ))}
          </svg>

          {/* Selected year detail */}
          {selectedRecord && (
            <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50/50 p-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-semibold text-foreground">Tax Year {selectedRecord.year}</span>
                {selectedRecord.event && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">{selectedRecord.event}</span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
                <div>
                  <p className="text-[10px] text-muted-foreground">Land</p>
                  <p className="text-xs font-semibold text-foreground">${selectedRecord.landValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Improvement</p>
                  <p className="text-xs font-semibold text-foreground">${selectedRecord.improvementValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="text-xs font-semibold text-foreground">${selectedRecord.totalValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Market</p>
                  <p className="text-xs font-semibold text-foreground">${selectedRecord.marketValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Change</p>
                  <p className={`text-xs font-semibold ${selectedRecord.changePercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {selectedRecord.changePercent > 0 ? "+" : ""}{selectedRecord.changePercent}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 pr-3 font-medium text-muted-foreground">Year</th>
                <th className="pb-2 pr-3 text-right font-medium text-muted-foreground">Land</th>
                <th className="pb-2 pr-3 text-right font-medium text-muted-foreground">Improvement</th>
                <th className="pb-2 pr-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="pb-2 pr-3 text-right font-medium text-muted-foreground">Market</th>
                <th className="pb-2 pr-3 text-right font-medium text-muted-foreground">Taxable</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {[...history].reverse().map((r) => (
                <tr key={r.year} className="hover:bg-muted/30">
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">{r.year}</span>
                      {r.event && (
                        <span title={r.event}>
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-foreground">${r.landValue.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-mono text-foreground">${r.improvementValue.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-mono font-semibold text-foreground">${r.totalValue.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-mono text-muted-foreground">${r.marketValue.toLocaleString()}</td>
                  <td className="py-2 pr-3 text-right font-mono text-muted-foreground">${r.taxableValue.toLocaleString()}</td>
                  <td className="py-2 text-right">
                    {r.changePercent !== 0 ? (
                      <span className={`font-mono ${r.changePercent > 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {r.changePercent > 0 ? "+" : ""}{r.changePercent}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
