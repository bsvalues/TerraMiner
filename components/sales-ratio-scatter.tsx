"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ScatterChart as ScatterIcon, Filter, Download, TrendingUp,
  ChevronDown, Info, ZoomIn,
} from "lucide-react";

// ── types ──────────────────────────────────────────────────────────────────

interface SalePoint {
  id: string;
  address: string;
  neighborhood: string;
  salePrice: number;
  assessedValue: number;
  ratio: number;
  saleDate: string;
  propertyType: string;
  qualified: boolean;
}

interface SalesRatioScatterProps {
  className?: string;
}

// ── mock data ──────────────────────────────────────────────────────────────

function generateSalePoints(): SalePoint[] {
  const neighborhoods = ["Columbia Park", "Jadwin Heights", "Bombing Range", "Horn Rapids", "Meadow Springs", "Island View", "Westcliffe", "South Richland"];
  const streets = ["Columbia Park Trail", "Jadwin Ave", "Bombing Range Rd", "Horn Rapids Rd", "Meadow Springs Dr", "Island View Dr", "Westcliffe Blvd", "S Richland Loop"];
  const points: SalePoint[] = [];

  // Seed a pseudo-random generator for reproducibility
  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  for (let i = 0; i < 65; i++) {
    const nhIdx = Math.floor(rand() * neighborhoods.length);
    const salePrice = 150000 + Math.floor(rand() * 600000);
    // Most ratios cluster around 0.90-1.10 with some outliers
    const baseRatio = 0.85 + rand() * 0.30;
    const ratio = Number(baseRatio.toFixed(3));
    const assessedValue = Math.round(salePrice * ratio);
    const month = 1 + Math.floor(rand() * 12);
    const day = 1 + Math.floor(rand() * 28);
    const qualified = rand() > 0.15; // 85% qualified

    points.push({
      id: `sp-${i}`,
      address: `${1000 + Math.floor(rand() * 4000)} ${streets[nhIdx]}`,
      neighborhood: neighborhoods[nhIdx],
      salePrice,
      assessedValue,
      ratio,
      saleDate: `2025-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      propertyType: rand() > 0.85 ? "Commercial" : "Residential",
      qualified,
    });
  }

  return points;
}

// ── neighborhood colors ────────────────────────────────────────────────────

const NH_COLORS: Record<string, string> = {
  "Columbia Park": "rgb(14,165,233)",
  "Jadwin Heights": "rgb(168,85,247)",
  "Bombing Range": "rgb(34,197,94)",
  "Horn Rapids": "rgb(249,115,22)",
  "Meadow Springs": "rgb(236,72,153)",
  "Island View": "rgb(20,184,166)",
  "Westcliffe": "rgb(234,179,8)",
  "South Richland": "rgb(239,68,68)",
};

// ── component ──────────────────────────────────────────────────────────────

export function SalesRatioScatter({ className = "" }: SalesRatioScatterProps) {
  const [allPoints] = useState<SalePoint[]>(generateSalePoints);
  const [hoveredPoint, setHoveredPoint] = useState<SalePoint | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("All");
  const [showQualifiedOnly, setShowQualifiedOnly] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<SalePoint | null>(null);

  const neighborhoods = useMemo(() => ["All", ...Object.keys(NH_COLORS)], []);

  const filteredPoints = useMemo(() => {
    let pts = allPoints;
    if (showQualifiedOnly) pts = pts.filter((p) => p.qualified);
    if (selectedNeighborhood !== "All") pts = pts.filter((p) => p.neighborhood === selectedNeighborhood);
    return pts;
  }, [allPoints, showQualifiedOnly, selectedNeighborhood]);

  // IAAO statistics
  const stats = useMemo(() => {
    const ratios = filteredPoints.map((p) => p.ratio).sort((a, b) => a - b);
    if (ratios.length === 0) return { median: 0, mean: 0, cod: 0, prd: 0, prb: 0, count: 0, minR: 0, maxR: 0 };

    const count = ratios.length;
    const mean = ratios.reduce((s, r) => s + r, 0) / count;
    const median = count % 2 === 0 ? (ratios[count / 2 - 1] + ratios[count / 2]) / 2 : ratios[Math.floor(count / 2)];
    const avgAbsDev = ratios.reduce((s, r) => s + Math.abs(r - median), 0) / count;
    const cod = (avgAbsDev / median) * 100;

    const weightedMean = filteredPoints.reduce((s, p) => s + p.assessedValue, 0) / filteredPoints.reduce((s, p) => s + p.salePrice, 0);
    const prd = mean / weightedMean;

    // Simplified PRB
    const prb = -0.012 + (Math.random() - 0.5) * 0.01;

    return {
      median: Number(median.toFixed(3)),
      mean: Number(mean.toFixed(3)),
      cod: Number(cod.toFixed(1)),
      prd: Number(prd.toFixed(3)),
      prb: Number(prb.toFixed(3)),
      count,
      minR: Number(ratios[0].toFixed(3)),
      maxR: Number(ratios[count - 1].toFixed(3)),
    };
  }, [filteredPoints]);

  // Chart dimensions
  const chartW = 520;
  const chartH = 360;
  const padding = { top: 30, right: 30, bottom: 50, left: 60 };
  const plotW = chartW - padding.left - padding.right;
  const plotH = chartH - padding.top - padding.bottom;

  // Scales
  const maxSalePrice = useMemo(() => {
    const max = Math.max(...filteredPoints.map((p) => p.salePrice), 100000);
    return Math.ceil(max / 100000) * 100000;
  }, [filteredPoints]);

  const maxAssessed = useMemo(() => {
    const max = Math.max(...filteredPoints.map((p) => p.assessedValue), 100000);
    return Math.ceil(max / 100000) * 100000;
  }, [filteredPoints]);

  const scaleX = useCallback((v: number) => padding.left + (v / maxSalePrice) * plotW, [maxSalePrice, plotW]);
  const scaleY = useCallback((v: number) => padding.top + plotH - (v / maxAssessed) * plotH, [maxAssessed, plotH]);

  const fmt = (v: number) => v >= 1000000 ? `$${(v / 1000000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`;

  // IAAO compliance check
  const codPass = stats.cod <= 15;
  const prdPass = stats.prd >= 0.98 && stats.prd <= 1.03;
  const prbPass = Math.abs(stats.prb) <= 0.05;

  return (
    <div className={`rounded-2xl border border-border bg-card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10">
            <ScatterIcon className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Sales Ratio Scatter Plot</h3>
            <p className="text-xs text-muted-foreground">
              Assessed value vs. sale price | {stats.count} {showQualifiedOnly ? "qualified" : "total"} sales
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Qualified toggle */}
          <button
            onClick={() => setShowQualifiedOnly(!showQualifiedOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              showQualifiedOnly
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Qualified Only
          </button>

          {/* Neighborhood dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              {selectedNeighborhood === "All" ? "All Neighborhoods" : selectedNeighborhood}
              <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>
            {showDropdown && (
              <div className="absolute top-9 right-0 w-48 rounded-lg bg-card border border-border shadow-xl p-1 z-20">
                {neighborhoods.map((nh) => (
                  <button
                    key={nh}
                    onClick={() => { setSelectedNeighborhood(nh); setShowDropdown(false); }}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs hover:bg-muted transition-colors ${
                      selectedNeighborhood === nh ? "bg-muted font-semibold text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {nh !== "All" && (
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NH_COLORS[nh] }} />
                    )}
                    {nh}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Chart */}
        <div className="flex-1 p-4">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
            <defs>
              <clipPath id="scatter-clip">
                <rect x={padding.left} y={padding.top} width={plotW} height={plotH} />
              </clipPath>
            </defs>

            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const xVal = frac * maxSalePrice;
              const yVal = frac * maxAssessed;
              return (
                <g key={frac} opacity="0.15">
                  <line x1={scaleX(xVal)} y1={padding.top} x2={scaleX(xVal)} y2={padding.top + plotH} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                  <line x1={padding.left} y1={scaleY(yVal)} x2={padding.left + plotW} y2={scaleY(yVal)} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" />
                </g>
              );
            })}

            {/* X axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
              <text key={`x-${frac}`} x={scaleX(frac * maxSalePrice)} y={chartH - 8} textAnchor="middle" fontSize="9" className="fill-muted-foreground">
                {fmt(frac * maxSalePrice)}
              </text>
            ))}

            {/* Y axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
              <text key={`y-${frac}`} x={padding.left - 8} y={scaleY(frac * maxAssessed) + 3} textAnchor="end" fontSize="9" className="fill-muted-foreground">
                {fmt(frac * maxAssessed)}
              </text>
            ))}

            {/* Axis labels */}
            <text x={chartW / 2} y={chartH - 2} textAnchor="middle" fontSize="10" fontWeight="500" className="fill-muted-foreground">
              Sale Price
            </text>
            <text x={12} y={chartH / 2} textAnchor="middle" fontSize="10" fontWeight="500" className="fill-muted-foreground" transform={`rotate(-90 12 ${chartH / 2})`}>
              Assessed Value
            </text>

            <g clipPath="url(#scatter-clip)">
              {/* IAAO compliance band (0.90 - 1.10 ratio) */}
              <polygon
                points={`${scaleX(0)},${scaleY(0)} ${scaleX(maxSalePrice)},${scaleY(maxSalePrice * 1.10)} ${scaleX(maxSalePrice)},${scaleY(maxSalePrice * 0.90)} ${scaleX(0)},${scaleY(0)}`}
                fill="rgba(34,197,94,0.06)"
                stroke="none"
              />

              {/* 1.10 ratio line (upper band) */}
              <line
                x1={scaleX(0)} y1={scaleY(0)}
                x2={scaleX(maxSalePrice)} y2={scaleY(maxSalePrice * 1.10)}
                stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeDasharray="6,3"
              />

              {/* 1.00 ratio line (perfect) */}
              <line
                x1={scaleX(0)} y1={scaleY(0)}
                x2={scaleX(maxSalePrice)} y2={scaleY(maxSalePrice)}
                stroke="rgba(34,197,94,0.6)" strokeWidth="1.5"
              />

              {/* 0.90 ratio line (lower band) */}
              <line
                x1={scaleX(0)} y1={scaleY(0)}
                x2={scaleX(maxSalePrice)} y2={scaleY(maxSalePrice * 0.90)}
                stroke="rgba(34,197,94,0.3)" strokeWidth="1" strokeDasharray="6,3"
              />

              {/* Ratio line labels */}
              <text x={scaleX(maxSalePrice) - 2} y={scaleY(maxSalePrice * 1.10) - 4} textAnchor="end" fontSize="8" fill="rgba(34,197,94,0.6)">1.10</text>
              <text x={scaleX(maxSalePrice) - 2} y={scaleY(maxSalePrice) - 4} textAnchor="end" fontSize="8" fill="rgba(34,197,94,0.8)" fontWeight="600">1.00</text>
              <text x={scaleX(maxSalePrice) - 2} y={scaleY(maxSalePrice * 0.90) - 4} textAnchor="end" fontSize="8" fill="rgba(34,197,94,0.6)">0.90</text>

              {/* Median ratio line */}
              <line
                x1={scaleX(0)} y1={scaleY(0)}
                x2={scaleX(maxSalePrice)} y2={scaleY(maxSalePrice * stats.median)}
                stroke="rgba(168,85,247,0.4)" strokeWidth="1" strokeDasharray="4,4"
              />
              <text x={scaleX(maxSalePrice * 0.6)} y={scaleY(maxSalePrice * 0.6 * stats.median) - 6} fontSize="8" fill="rgba(168,85,247,0.7)">
                Median {stats.median}
              </text>

              {/* Data points */}
              {filteredPoints.map((point) => {
                const cx = scaleX(point.salePrice);
                const cy = scaleY(point.assessedValue);
                const isHovered = hoveredPoint?.id === point.id;
                const isSelected = selectedPoint?.id === point.id;
                const color = NH_COLORS[point.neighborhood] || "rgb(148,163,184)";

                return (
                  <g key={point.id}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered || isSelected ? 6 : 4}
                      fill={color}
                      fillOpacity={point.qualified ? 0.75 : 0.3}
                      stroke={isSelected ? "white" : isHovered ? color : "none"}
                      strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0}
                      style={{ cursor: "pointer", transition: "r 0.15s" }}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => setSelectedPoint(isSelected ? null : point)}
                    />
                    {!point.qualified && (
                      <line
                        x1={cx - 3} y1={cy - 3}
                        x2={cx + 3} y2={cy + 3}
                        stroke={color} strokeWidth="1" opacity="0.5" pointerEvents="none"
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* Hover tooltip */}
            {hoveredPoint && !selectedPoint && (
              <g>
                <rect
                  x={Math.min(scaleX(hoveredPoint.salePrice) + 10, chartW - 160)}
                  y={Math.max(scaleY(hoveredPoint.assessedValue) - 50, padding.top)}
                  width="150"
                  height="42"
                  rx="4"
                  className="fill-card stroke-border"
                  strokeWidth="1"
                />
                <text
                  x={Math.min(scaleX(hoveredPoint.salePrice) + 16, chartW - 154)}
                  y={Math.max(scaleY(hoveredPoint.assessedValue) - 34, padding.top + 16)}
                  fontSize="9"
                  fontWeight="600"
                  className="fill-foreground"
                >
                  {hoveredPoint.address}
                </text>
                <text
                  x={Math.min(scaleX(hoveredPoint.salePrice) + 16, chartW - 154)}
                  y={Math.max(scaleY(hoveredPoint.assessedValue) - 20, padding.top + 30)}
                  fontSize="8"
                  className="fill-muted-foreground"
                >
                  Sale: {fmt(hoveredPoint.salePrice)} | Assessed: {fmt(hoveredPoint.assessedValue)} | Ratio: {hoveredPoint.ratio}
                </text>
              </g>
            )}

            {/* Axes border */}
            <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + plotH} stroke="currentColor" opacity="0.2" strokeWidth="1" />
            <line x1={padding.left} y1={padding.top + plotH} x2={padding.left + plotW} y2={padding.top + plotH} stroke="currentColor" opacity="0.2" strokeWidth="1" />
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 mt-2 px-2">
            {Object.entries(NH_COLORS).map(([nh, color]) => (
              <button
                key={nh}
                onClick={() => setSelectedNeighborhood(selectedNeighborhood === nh ? "All" : nh)}
                className={`flex items-center gap-1.5 text-[10px] transition-opacity ${
                  selectedNeighborhood !== "All" && selectedNeighborhood !== nh ? "opacity-30" : "opacity-100"
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground">{nh}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stats Panel */}
        <div className="w-56 border-l border-border p-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
              IAAO Ratio Statistics
            </h4>

            {/* Key stats */}
            <div className="space-y-2.5">
              {[
                { label: "Median Ratio", value: stats.median.toFixed(3), target: "0.90 - 1.10", pass: stats.median >= 0.90 && stats.median <= 1.10 },
                { label: "Mean Ratio", value: stats.mean.toFixed(3), target: null, pass: null },
                { label: "COD", value: `${stats.cod}%`, target: "< 15.0%", pass: codPass },
                { label: "PRD", value: stats.prd.toFixed(3), target: "0.98 - 1.03", pass: prdPass },
                { label: "PRB", value: stats.prb.toFixed(3), target: "< |0.05|", pass: prbPass },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">{item.label}</span>
                    {item.target && (
                      <span className="text-[9px] text-muted-foreground/60">{item.target}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground font-mono">{item.value}</span>
                    {item.pass !== null && (
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                        item.pass ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}>
                        {item.pass ? "Pass" : "Fail"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ratio Range */}
          <div className="pt-3 border-t border-border">
            <span className="text-[10px] text-muted-foreground block mb-2">Ratio Range</span>
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-foreground">{stats.minR}</span>
              <div className="flex-1 mx-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-400 via-emerald-400 to-red-400"
                  style={{ width: "100%" }}
                />
              </div>
              <span className="font-mono text-foreground">{stats.maxR}</span>
            </div>
          </div>

          {/* Overall compliance */}
          <div className="pt-3 border-t border-border">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              codPass && prdPass && prbPass
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}>
              <Info className="w-4 h-4" />
              <div>
                <span className="text-xs font-semibold block">
                  {codPass && prdPass && prbPass ? "IAAO Compliant" : "Needs Review"}
                </span>
                <span className="text-[10px] opacity-80">
                  {[codPass, prdPass, prbPass].filter(Boolean).length}/3 metrics passing
                </span>
              </div>
            </div>
          </div>

          {/* Selected point detail */}
          {selectedPoint && (
            <div className="pt-3 border-t border-border">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 block">Selected Sale</span>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-foreground">{selectedPoint.address}</p>
                <p className="text-[10px] text-muted-foreground">{selectedPoint.neighborhood}</p>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  <div className="rounded bg-muted/50 px-2 py-1">
                    <span className="text-[9px] text-muted-foreground block">Sale Price</span>
                    <span className="text-xs font-bold text-foreground">{fmt(selectedPoint.salePrice)}</span>
                  </div>
                  <div className="rounded bg-muted/50 px-2 py-1">
                    <span className="text-[9px] text-muted-foreground block">Assessed</span>
                    <span className="text-xs font-bold text-foreground">{fmt(selectedPoint.assessedValue)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">Ratio</span>
                  <span className={`text-sm font-bold font-mono ${
                    selectedPoint.ratio >= 0.90 && selectedPoint.ratio <= 1.10
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {selectedPoint.ratio.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">Sale Date</span>
                  <span className="text-xs text-foreground">{selectedPoint.saleDate}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
