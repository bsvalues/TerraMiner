"use client";

import { useState, useMemo } from "react";
import {
  Map,
  Layers,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type HeatmapMetric = "median_value" | "cod" | "prd" | "value_change" | "appeal_rate";

interface NeighborhoodZone {
  id: string;
  name: string;
  code: string;
  parcelCount: number;
  medianValue: number;
  medianValuePerSF: number;
  cod: number;
  prd: number;
  valueChangePercent: number;
  appealRate: number;
  totalAssessedValue: number;
  salesCount: number;
  // SVG path coordinates for rendering the zone on the map
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Mock neighborhood zones for Richland, WA ───────────────────────────────

const neighborhoodZones: NeighborhoodZone[] = [
  { id: "nz-1", name: "Columbia Park", code: "CP-01", parcelCount: 342, medianValue: 385000, medianValuePerSF: 175, cod: 8.7, prd: 1.012, valueChangePercent: 4.5, appealRate: 2.1, totalAssessedValue: 131670000, salesCount: 87, x: 260, y: 50, width: 140, height: 110 },
  { id: "nz-2", name: "Jadwin Heights", code: "JH-02", parcelCount: 218, medianValue: 295000, medianValuePerSF: 148, cod: 14.2, prd: 1.045, valueChangePercent: 3.2, appealRate: 4.8, totalAssessedValue: 64310000, salesCount: 52, x: 420, y: 30, width: 130, height: 100 },
  { id: "nz-3", name: "Bombing Range", code: "BR-03", parcelCount: 156, medianValue: 225000, medianValuePerSF: 132, cod: 10.3, prd: 1.008, valueChangePercent: 2.8, appealRate: 1.5, totalAssessedValue: 35100000, salesCount: 41, x: 100, y: 180, width: 160, height: 120 },
  { id: "nz-4", name: "South Richland", code: "SR-04", parcelCount: 89, medianValue: 198000, medianValuePerSF: 118, cod: 22.8, prd: 1.089, valueChangePercent: 1.5, appealRate: 7.2, totalAssessedValue: 17622000, salesCount: 18, x: 50, y: 320, width: 140, height: 90 },
  { id: "nz-5", name: "Horn Rapids", code: "HR-05", parcelCount: 275, medianValue: 445000, medianValuePerSF: 195, cod: 7.4, prd: 1.005, valueChangePercent: 5.8, appealRate: 1.2, totalAssessedValue: 122375000, salesCount: 68, x: 280, y: 180, width: 150, height: 130 },
  { id: "nz-6", name: "Meadow Springs", code: "MS-06", parcelCount: 312, medianValue: 520000, medianValuePerSF: 210, cod: 6.9, prd: 0.998, valueChangePercent: 6.2, appealRate: 0.8, totalAssessedValue: 162240000, salesCount: 92, x: 450, y: 150, width: 130, height: 140 },
  { id: "nz-7", name: "Westcliffe", code: "WC-07", parcelCount: 198, medianValue: 362000, medianValuePerSF: 168, cod: 9.5, prd: 1.018, valueChangePercent: 3.9, appealRate: 2.5, totalAssessedValue: 71676000, salesCount: 55, x: 40, y: 60, width: 120, height: 100 },
  { id: "nz-8", name: "Island View", code: "IV-08", parcelCount: 145, medianValue: 675000, medianValuePerSF: 245, cod: 11.2, prd: 1.025, valueChangePercent: 7.1, appealRate: 3.4, totalAssessedValue: 97875000, salesCount: 34, x: 170, y: 40, width: 80, height: 80 },
];

// ── Component ──────────────────────────────────────────────────────────────

interface NeighborhoodAssessmentMapProps {
  className?: string;
}

export function NeighborhoodAssessmentMap({ className }: NeighborhoodAssessmentMapProps) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>("median_value");
  const [showLabels, setShowLabels] = useState(true);

  const metricConfigs: Record<HeatmapMetric, { label: string; format: (z: NeighborhoodZone) => string; getValue: (z: NeighborhoodZone) => number; colorScale: (val: number, min: number, max: number) => string; legend: string[] }> = {
    median_value: {
      label: "Median Value",
      format: (z) => `$${(z.medianValue / 1000).toFixed(0)}K`,
      getValue: (z) => z.medianValue,
      colorScale: (val, min, max) => {
        const t = (val - min) / (max - min || 1);
        if (t < 0.25) return "fill-blue-200 stroke-blue-400";
        if (t < 0.5) return "fill-blue-300 stroke-blue-500";
        if (t < 0.75) return "fill-blue-400 stroke-blue-600";
        return "fill-blue-500 stroke-blue-700";
      },
      legend: ["$198K", "$317K", "$437K", "$675K"],
    },
    cod: {
      label: "COD",
      format: (z) => `${z.cod.toFixed(1)}%`,
      getValue: (z) => z.cod,
      colorScale: (val) => {
        if (val <= 10) return "fill-emerald-300 stroke-emerald-500";
        if (val <= 15) return "fill-amber-200 stroke-amber-400";
        if (val <= 20) return "fill-orange-300 stroke-orange-500";
        return "fill-red-400 stroke-red-600";
      },
      legend: ["<10 Pass", "10-15 OK", "15-20 Warn", ">20 Fail"],
    },
    prd: {
      label: "PRD",
      format: (z) => z.prd.toFixed(3),
      getValue: (z) => z.prd,
      colorScale: (val) => {
        if (val >= 0.98 && val <= 1.03) return "fill-emerald-300 stroke-emerald-500";
        if (val >= 0.95 && val <= 1.05) return "fill-amber-200 stroke-amber-400";
        return "fill-red-400 stroke-red-600";
      },
      legend: ["0.98-1.03", "0.95-1.05", ">1.05 Fail"],
    },
    value_change: {
      label: "Value Change %",
      format: (z) => `${z.valueChangePercent > 0 ? "+" : ""}${z.valueChangePercent.toFixed(1)}%`,
      getValue: (z) => z.valueChangePercent,
      colorScale: (val) => {
        if (val >= 5) return "fill-emerald-400 stroke-emerald-600";
        if (val >= 3) return "fill-emerald-200 stroke-emerald-400";
        if (val >= 1) return "fill-amber-200 stroke-amber-400";
        return "fill-red-300 stroke-red-500";
      },
      legend: ["<1%", "1-3%", "3-5%", ">5%"],
    },
    appeal_rate: {
      label: "Appeal Rate",
      format: (z) => `${z.appealRate.toFixed(1)}%`,
      getValue: (z) => z.appealRate,
      colorScale: (val) => {
        if (val <= 2) return "fill-emerald-300 stroke-emerald-500";
        if (val <= 4) return "fill-amber-200 stroke-amber-400";
        if (val <= 6) return "fill-orange-300 stroke-orange-500";
        return "fill-red-400 stroke-red-600";
      },
      legend: ["<2% Low", "2-4%", "4-6%", ">6% High"],
    },
  };

  const activeConfig = metricConfigs[heatmapMetric];

  const { min, max } = useMemo(() => {
    const vals = neighborhoodZones.map(activeConfig.getValue);
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [heatmapMetric, activeConfig]);

  const selected = useMemo(
    () => neighborhoodZones.find((z) => z.id === selectedZone),
    [selectedZone]
  );

  const totals = useMemo(() => ({
    parcels: neighborhoodZones.reduce((s, z) => s + z.parcelCount, 0),
    value: neighborhoodZones.reduce((s, z) => s + z.totalAssessedValue, 0),
    avgCOD: neighborhoodZones.reduce((s, z) => s + z.cod, 0) / neighborhoodZones.length,
  }), []);

  return (
    <div className={`rounded-lg border border-border bg-card ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100">
            <Map className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Neighborhood Assessment Map</h3>
            <p className="text-xs text-muted-foreground">
              {neighborhoodZones.length} neighborhoods | {totals.parcels.toLocaleString()} parcels | ${(totals.value / 1e9).toFixed(2)}B total assessed
            </p>
          </div>
        </div>
        <button
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50"
          onClick={() => setShowLabels(!showLabels)}
        >
          {showLabels ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showLabels ? "Hide Labels" : "Show Labels"}
        </button>
      </div>

      {/* Metric Selector */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Heatmap:</span>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(metricConfigs) as HeatmapMetric[]).map((key) => (
            <button
              key={key}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                heatmapMetric === key
                  ? "bg-teal-600 text-white"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
              onClick={() => setHeatmapMetric(key)}
            >
              {metricConfigs[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* SVG Map */}
        <div className="flex-1 p-4">
          <svg viewBox="0 0 620 450" className="h-auto w-full" role="img" aria-label="Neighborhood assessment heatmap">
            {/* Background */}
            <rect x="0" y="0" width="620" height="450" rx="8" className="fill-muted/20" />

            {/* Grid lines */}
            {[100, 200, 300, 400, 500].map((x) => (
              <line key={`vl-${x}`} x1={x} y1="0" x2={x} y2="450" className="stroke-border/30" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            {[100, 200, 300, 400].map((y) => (
              <line key={`hl-${y}`} x1="0" y1={y} x2="620" y2={y} className="stroke-border/30" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}

            {/* River / Columbia River */}
            <path
              d="M 0 20 Q 80 10, 160 25 Q 240 40, 320 30 Q 400 20, 480 35 Q 560 50, 620 40"
              className="fill-none stroke-blue-300"
              strokeWidth="12"
              strokeLinecap="round"
              opacity="0.4"
            />
            <text x="310" y="18" textAnchor="middle" className="fill-blue-400 text-[9px] font-medium">Columbia River</text>

            {/* Neighborhood Zones */}
            {neighborhoodZones.map((zone) => {
              const isSelected = selectedZone === zone.id;
              const val = activeConfig.getValue(zone);
              const colorClass = activeConfig.colorScale(val, min, max);
              const fillClasses = colorClass.split(" ");

              return (
                <g key={zone.id}>
                  <rect
                    x={zone.x}
                    y={zone.y}
                    width={zone.width}
                    height={zone.height}
                    rx="6"
                    className={`${fillClasses[0]} ${fillClasses[1]} cursor-pointer transition-opacity ${
                      isSelected ? "opacity-100" : "opacity-75 hover:opacity-100"
                    }`}
                    strokeWidth={isSelected ? 2.5 : 1}
                    onClick={() => setSelectedZone(isSelected ? null : zone.id)}
                  />
                  {showLabels && (
                    <>
                      <text
                        x={zone.x + zone.width / 2}
                        y={zone.y + zone.height / 2 - 8}
                        textAnchor="middle"
                        className="pointer-events-none fill-foreground text-[10px] font-semibold"
                      >
                        {zone.name}
                      </text>
                      <text
                        x={zone.x + zone.width / 2}
                        y={zone.y + zone.height / 2 + 6}
                        textAnchor="middle"
                        className="pointer-events-none fill-foreground/70 text-[9px] font-medium"
                      >
                        {activeConfig.format(zone)}
                      </text>
                      <text
                        x={zone.x + zone.width / 2}
                        y={zone.y + zone.height / 2 + 18}
                        textAnchor="middle"
                        className="pointer-events-none fill-foreground/50 text-[8px]"
                      >
                        {zone.parcelCount} parcels
                      </text>
                    </>
                  )}
                </g>
              );
            })}

            {/* Compass Rose */}
            <g transform="translate(580, 420)">
              <circle r="15" className="fill-card stroke-border" strokeWidth="1" />
              <text y="-4" textAnchor="middle" className="fill-foreground text-[8px] font-bold">N</text>
              <line x1="0" y1="-2" x2="0" y2="6" className="stroke-foreground" strokeWidth="1.5" />
            </g>
          </svg>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">{activeConfig.label}:</span>
            {activeConfig.legend.map((label, i) => {
              const colors = ["bg-blue-200", "bg-blue-300", "bg-blue-400", "bg-blue-500"];
              if (heatmapMetric === "cod") {
                colors[0] = "bg-emerald-300"; colors[1] = "bg-amber-200"; colors[2] = "bg-orange-300"; colors[3] = "bg-red-400";
              } else if (heatmapMetric === "appeal_rate") {
                colors[0] = "bg-emerald-300"; colors[1] = "bg-amber-200"; colors[2] = "bg-orange-300"; colors[3] = "bg-red-400";
              } else if (heatmapMetric === "value_change") {
                colors[0] = "bg-red-300"; colors[1] = "bg-amber-200"; colors[2] = "bg-emerald-200"; colors[3] = "bg-emerald-400";
              } else if (heatmapMetric === "prd") {
                colors[0] = "bg-emerald-300"; colors[1] = "bg-amber-200"; colors[2] = "bg-red-400";
              }
              return (
                <div key={label} className="flex items-center gap-1">
                  <div className={`h-3 w-3 rounded-sm ${colors[i] || colors[colors.length - 1]}`} />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="w-full border-t border-border lg:w-72 lg:border-l lg:border-t-0">
          {selected ? (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{selected.name}</h4>
                  <p className="text-xs text-muted-foreground">{selected.code} | {selected.parcelCount} parcels</p>
                </div>
                <button
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted/50"
                  onClick={() => setSelectedZone(null)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Median Assessed Value</p>
                  <p className="text-lg font-bold text-foreground">${selected.medianValue.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-xs">
                    {selected.valueChangePercent > 0 ? (
                      <TrendingUp className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={selected.valueChangePercent > 0 ? "text-emerald-600" : "text-red-600"}>
                      {selected.valueChangePercent > 0 ? "+" : ""}{selected.valueChangePercent}% YoY
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border p-2">
                    <p className="text-[10px] text-muted-foreground">$/SF</p>
                    <p className="text-sm font-semibold text-foreground">${selected.medianValuePerSF}</p>
                  </div>
                  <div className="rounded-lg border border-border p-2">
                    <p className="text-[10px] text-muted-foreground">Sales</p>
                    <p className="text-sm font-semibold text-foreground">{selected.salesCount}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">IAAO Metrics</h5>
                  {[
                    { label: "COD", value: selected.cod, target: "<=15%", pass: selected.cod <= 15, display: `${selected.cod.toFixed(1)}%` },
                    { label: "PRD", value: selected.prd, target: "0.98-1.03", pass: selected.prd >= 0.98 && selected.prd <= 1.03, display: selected.prd.toFixed(3) },
                    { label: "Appeal Rate", value: selected.appealRate, target: "<3%", pass: selected.appealRate < 3, display: `${selected.appealRate.toFixed(1)}%` },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between rounded-md border border-border/50 px-2.5 py-1.5">
                      <div className="flex items-center gap-1.5">
                        {m.pass ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className="text-xs text-foreground">{m.label}</span>
                      </div>
                      <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                        m.pass ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      }`}>
                        {m.display}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total Assessed Value</p>
                  <p className="text-sm font-semibold text-foreground">
                    ${(selected.totalAssessedValue / 1e6).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center">
              <Map className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">Select a neighborhood</p>
              <p className="mt-1 text-xs text-muted-foreground/70">Click on any zone to view detailed assessment metrics</p>

              <div className="mt-4 w-full space-y-2">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Summary</h5>
                <div className="rounded-lg border border-border p-2.5 text-left">
                  <p className="text-xs text-muted-foreground">Avg COD</p>
                  <p className={`text-sm font-semibold ${totals.avgCOD <= 15 ? "text-emerald-600" : "text-amber-600"}`}>
                    {totals.avgCOD.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border border-border p-2.5 text-left">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-sm font-semibold text-foreground">${(totals.value / 1e9).toFixed(2)}B</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
