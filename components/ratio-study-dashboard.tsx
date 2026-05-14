"use client";

import useSWR from "swr";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Scale, Building2, TrendingDown, AlertTriangle, CheckCircle2, Database } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const CHART_PRIMARY = "hsl(193 100% 42%)";
const CHART_SUCCESS = "hsl(134 61% 41%)";
const CHART_WARNING = "hsl(45 100% 51%)";
const CHART_ERROR = "hsl(354 70% 54%)";
const GRID_COLOR = "hsl(213 28% 26%)";
const TEXT_COLOR = "hsl(210 17% 57%)";

interface RatioStudy {
  median_ratio: number;
  mean_ratio: number;
  weighted_mean_ratio: number;
  cod: number;
  prd: number;
  prb: number;
  sample_size: number;
  cod_pass: boolean;
  prd_pass: boolean;
  prb_pass: boolean;
  overall_pass: boolean;
  ratios: number[];
}

interface Neighborhood {
  code: string;
  name: string;
  city: string;
  count: number;
  median_ratio: number;
  cod: number;
  prd: number;
  mean_assessed: number;
  mean_sale: number;
  pass: boolean;
}

interface Quintile {
  quintile: number;
  label: string;
  count: number;
  median_ratio: number;
  mean_ratio: number;
  price_range: [number, number];
}

interface EquityReport {
  overall: RatioStudy;
  by_neighborhood: Neighborhood[];
  by_city: Neighborhood[];
  quintiles: Quintile[];
  generated_at: string;
  tax_year: number;
}

function PassFail({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold ${pass ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
      {pass ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  );
}

function MetricCard({
  label,
  value,
  standard,
  pass,
  description,
}: {
  label: string;
  value: string;
  standard: string;
  pass: boolean;
  description: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-lg border p-4 ${pass ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5" : "border-destructive/30 bg-destructive/5"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <PassFail pass={pass} label={pass ? "PASS" : "FAIL"} />
      </div>
      <span className={`text-2xl font-bold ${pass ? "text-[hsl(var(--success))]" : "text-destructive"}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground">IAAO: {standard}</span>
      <span className="text-[10px] text-muted-foreground/70">{description}</span>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RatioTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-[10px] text-muted-foreground">{d.address}</p>
      <p className="text-xs font-semibold text-foreground">
        Sale: ${(d.sale / 1000).toFixed(0)}k | Ratio: {d.ratio.toFixed(3)}
      </p>
    </div>
  );
}

export function RatioStudyDashboard() {
  const { data, isLoading } = useSWR<{ report: EquityReport }>(
    "/api/assessment/equity-report",
    fetcher,
    { revalidateOnFocus: false }
  );

  const report = data?.report;

  if (isLoading || !report) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Benton County Ratio Study</h2>
          <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
            <Database className="h-2.5 w-2.5" /> Loading...
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-4">
              <div className="mb-2 h-3 w-16 rounded bg-muted" />
              <div className="mb-1 h-7 w-20 rounded bg-muted" />
              <div className="h-2 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { overall, by_neighborhood, quintiles } = report;

  // Scatter plot data: sale_price vs ratio
  // We don't have individual property data in the report, so build from quintile midpoints
  const scatterData = by_neighborhood.map((n) => ({
    sale: n.mean_sale,
    ratio: n.median_ratio,
    address: n.name,
    size: Math.max(n.count * 3, 8),
    pass: n.pass,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Benton County Ratio Study &mdash; Tax Year {report.tax_year}
        </h2>
        <span className={cn(
          "ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium",
          overall.overall_pass
            ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
            : "bg-destructive/15 text-destructive"
        )}>
          <Database className="h-2.5 w-2.5" /> {overall.overall_pass ? "IAAO Compliant" : "IAAO Noncompliant"}
        </span>
      </div>

      {/* IAAO Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Median Ratio"
          value={overall.median_ratio.toFixed(4)}
          standard="0.90 - 1.10"
          pass={overall.median_ratio >= 0.9 && overall.median_ratio <= 1.1}
          description="Central tendency of A/S ratios"
        />
        <MetricCard
          label="COD"
          value={overall.cod.toFixed(2)}
          standard="&le; 15.00"
          pass={overall.cod_pass}
          description="Horizontal equity (uniformity)"
        />
        <MetricCard
          label="PRD"
          value={overall.prd.toFixed(4)}
          standard="0.98 - 1.03"
          pass={overall.prd_pass}
          description="Vertical equity (regressivity)"
        />
        <MetricCard
          label="PRB"
          value={overall.prb.toFixed(4)}
          standard="-0.05 to 0.05"
          pass={overall.prb_pass}
          description="Price-related bias"
        />
      </div>

      {/* Charts Row: Neighborhood Scatter + Quintile Bars */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Neighborhood Assessment Ratio Scatter */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Neighborhood Ratios vs. Sale Price</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis
                dataKey="sale"
                name="Avg Sale"
                tick={{ fontSize: 9, fill: TEXT_COLOR }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="ratio"
                name="Median Ratio"
                tick={{ fontSize: 10, fill: TEXT_COLOR }}
                axisLine={false}
                tickLine={false}
                domain={[0.7, 1.0]}
              />
              <Tooltip content={<RatioTooltip />} />
              <ReferenceLine y={1.0} stroke={CHART_SUCCESS} strokeDasharray="4 4" label={{ value: "1.00", fill: CHART_SUCCESS, fontSize: 9 }} />
              <ReferenceLine y={0.9} stroke={CHART_WARNING} strokeDasharray="4 4" label={{ value: "0.90", fill: CHART_WARNING, fontSize: 9 }} />
              <Scatter data={scatterData} name="Neighborhoods">
                {scatterData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.pass ? CHART_PRIMARY : CHART_ERROR}
                    r={entry.size}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Quintile Analysis */}
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Value Segment Analysis (Quintiles)</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={quintiles}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
              <XAxis dataKey="label" tick={{ fontSize: 8, fill: TEXT_COLOR }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: TEXT_COLOR }}
                axisLine={false}
                tickLine={false}
                domain={[0.7, 1.0]}
              />
              <Tooltip
                formatter={(value: number) => value.toFixed(4)}
                contentStyle={{ backgroundColor: "hsl(215 28% 17%)", border: "1px solid hsl(213 28% 26%)", borderRadius: 8, fontSize: 11 }}
              />
              <ReferenceLine y={1.0} stroke={CHART_SUCCESS} strokeDasharray="4 4" />
              <ReferenceLine y={0.9} stroke={CHART_WARNING} strokeDasharray="4 4" />
              <Bar dataKey="median_ratio" name="Median Ratio" radius={[4, 4, 0, 0]}>
                {quintiles.map((q, i) => (
                  <Cell
                    key={i}
                    fill={q.median_ratio >= 0.9 ? CHART_PRIMARY : q.median_ratio >= 0.8 ? CHART_WARNING : CHART_ERROR}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Neighborhood Equity Table */}
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Neighborhood Equity Analysis</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">{by_neighborhood.length} segments</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Neighborhood</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2 text-right">Count</th>
                <th className="px-3 py-2 text-right">Median Ratio</th>
                <th className="px-3 py-2 text-right">COD</th>
                <th className="px-3 py-2 text-right">PRD</th>
                <th className="px-3 py-2 text-right">Avg Assessed</th>
                <th className="px-3 py-2 text-right">Avg Sale</th>
                <th className="px-3 py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {by_neighborhood.map((n) => (
                <tr key={n.code} className="border-b border-border/50 transition-colors hover:bg-accent/20">
                  <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-primary">{n.code}</td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{n.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{n.city}</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">{n.count}</td>
                  <td className={`px-3 py-2.5 text-right font-mono font-bold ${n.median_ratio >= 0.9 ? "text-[hsl(var(--success))]" : n.median_ratio >= 0.8 ? "text-[hsl(var(--warning))]" : "text-destructive"}`}>
                    {n.median_ratio.toFixed(4)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${n.cod <= 15 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {n.cod.toFixed(2)}
                  </td>
                  <td className={`px-3 py-2.5 text-right font-mono ${n.prd >= 0.98 && n.prd <= 1.03 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {n.prd.toFixed(4)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">${(n.mean_assessed / 1000).toFixed(0)}k</td>
                  <td className="px-3 py-2.5 text-right text-muted-foreground">${(n.mean_sale / 1000).toFixed(0)}k</td>
                  <td className="px-3 py-2.5 text-center">
                    <PassFail pass={n.pass} label={n.pass ? "PASS" : "FAIL"} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
