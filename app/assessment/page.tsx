"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { cn, formatNumber } from "@/lib/utils";
import {
  Scale,
  TrendingUp,
  BarChart3,
  MapPin,
  CheckCircle2,
  XCircle,
  Database,
  ChevronRight,
  Download,
  Printer,
  FileText,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { EmptyStates } from "@/components/empty-state";
import { SalesValidation } from "@/components/sales-validation";
import { DataQualityDashboard } from "@/components/data-quality-dashboard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RatioStudyResult {
  median_ratio: number;
  mean_ratio: number;
  cod: number;
  prd: number;
  prb: number;
  cod_pass: boolean;
  prd_pass: boolean;
  prb_pass: boolean;
  overall_pass: boolean;
  sample_size: number;
  tax_year: number;
}

interface NeighborhoodResult {
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

interface QuintileResult {
  quintile: number;
  label: string;
  count: number;
  median_ratio: number;
  mean_ratio: number;
  price_range: [number, number];
}

const CITIES = ["All", "Kennewick", "Richland", "Pasco"];

function PassBadge({ pass }: { pass: boolean }) {
  return pass ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--success))]/15 px-2 py-0.5 text-[10px] font-bold text-[hsl(var(--success))]">
      <CheckCircle2 className="h-3 w-3" /> PASS
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-bold text-destructive">
      <XCircle className="h-3 w-3" /> FAIL
    </span>
  );
}

export default function AssessmentPage() {
  const [selectedCity, setSelectedCity] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { mutate } = useSWRConfig();
  const cityParam = selectedCity === "All" ? "" : `?city=${selectedCity}`;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      mutate(`/api/assessment/ratio-study${cityParam}`),
      mutate(`/api/assessment/neighborhoods${cityParam}`),
      mutate(`/api/assessment/equity-report${cityParam}`),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const { data: ratioData, isLoading: ratioLoading } = useSWR<{ study: RatioStudyResult }>(
    `/api/assessment/ratio-study${cityParam}`,
    fetcher
  );
  const { data: neighborhoodData, isLoading: isLoadingNbhd } = useSWR<{ neighborhoods: NeighborhoodResult[] }>(
    `/api/assessment/neighborhoods${cityParam}`,
    fetcher
  );
  const { data: equityData } = useSWR<{ report: { quintiles: QuintileResult[] } }>(
    `/api/assessment/equity-report${cityParam}`,
    fetcher
  );

  const study = ratioData?.study;
  const neighborhoods = neighborhoodData?.neighborhoods ?? [];
  const quintiles = equityData?.report?.quintiles ?? [];

  return (
    <div className="grid-bg min-h-full px-6 py-6 print:px-0 print:py-0">
      {/* Print-only report header */}
      <div className="print-header print-only hidden">
        <div>
          <h1>Benton County Assessment Ratio Study</h1>
          <p className="text-sm">IAAO Compliance Report - {selectedCity === "All" ? "All Areas" : selectedCity}</p>
        </div>
        <div className="print-meta">
          <p>Tax Year: 2025</p>
          <p suppressHydrationWarning>Generated: {new Date().toLocaleDateString()}</p>
          <p>Source: TerraFusion Analytics</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 print:gap-4">
        {/* Header */}
        <div>
          <nav className="mb-2 flex items-center gap-1 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground">Dashboard</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Assessment</span>
          </nav>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <h1 className="text-base font-bold text-foreground">
                Benton County Ratio Study
              </h1>
              {study && (
                <span className={cn(
                  "ml-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                  study.overall_pass
                    ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                    : "bg-destructive/15 text-destructive"
                )}>
                  {study.overall_pass ? "IAAO Compliant" : "IAAO Noncompliant"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 no-print">
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <Database className="h-3 w-3" /> PostgreSQL
              </span>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
                {isRefreshing ? "Refreshing" : "Refresh"}
              </button>
              <a
                href={`/api/assessment/export-report${cityParam}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-md border border-primary/50 bg-primary/5 px-2 py-1 text-[10px] font-medium text-primary hover:bg-primary/10"
              >
                <FileText className="h-3 w-3" /> Report
              </a>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Printer className="h-3 w-3" /> Print
              </button>
              <a
                href="/api/properties/export"
                download
                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Download className="h-3 w-3" /> Export
              </a>
            </div>
          </div>
        </div>

        {/* City filter tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => setSelectedCity(city)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                selectedCity === city
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {city === "All" ? "All Cities" : city}
            </button>
          ))}
        </div>

        {/* IAAO Metrics Cards */}
        {ratioLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        ) : study ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:print-metrics avoid-break">
            <MetricCard
              label="Median Ratio"
              value={study.median_ratio?.toFixed(4) ?? "--"}
              standard="IAAO: 0.90 - 1.10"
              pass={(study.median_ratio ?? 0) >= 0.9 && (study.median_ratio ?? 0) <= 1.1}
              icon={TrendingUp}
              color="text-primary"
            />
            <MetricCard
              label="COD"
              value={study.cod?.toFixed(2) ?? "--"}
              standard={"IAAO: <= 15.00"}
              pass={study.cod_pass}
              icon={BarChart3}
              color="text-[hsl(var(--success))]"
              sub="Coefficient of Dispersion"
            />
            <MetricCard
              label="PRD"
              value={study.prd?.toFixed(4) ?? "--"}
              standard="IAAO: 0.98 - 1.03"
              pass={study.prd_pass}
              icon={Scale}
              color="text-[hsl(var(--warning))]"
              sub="Price-Related Differential"
            />
            <MetricCard
              label="PRB"
              value={study.prb?.toFixed(4) ?? "--"}
              standard="IAAO: -0.05 to 0.05"
              pass={study.prb_pass}
              icon={TrendingUp}
              color="text-destructive"
              sub="Price-Related Bias"
            />
          </div>
        ) : null}

        {/* Study Summary */}
        {study && (
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              {"Study Summary \u2014 "}{selectedCity === "All" ? "Benton County" : selectedCity}
            </h2>
            <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sample Size</p>
                <p className="mt-0.5 text-lg font-bold text-foreground">{study.sample_size ?? 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tax Year</p>
                <p className="mt-0.5 text-lg font-bold text-foreground">{study.tax_year ?? 2025}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Mean Ratio</p>
                <p className="mt-0.5 text-lg font-bold text-foreground">{study.mean_ratio?.toFixed(4) ?? "--"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall</p>
                <div className="mt-0.5">
                  <PassBadge pass={study.overall_pass} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quintile Analysis */}
        {quintiles.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                {"Vertical Equity \u2014 Value Quintile Analysis"}
              </h2>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {quintiles.map((q) => {
                const barHeight = Math.round(((q.median_ratio ?? 0) / 1.0) * 100);
                const isPass = (q.median_ratio ?? 0) >= 0.9 && (q.median_ratio ?? 0) <= 1.1;
                const priceMin = Array.isArray(q.price_range) ? q.price_range[0] : 0;
                const priceMax = Array.isArray(q.price_range) ? q.price_range[1] : 0;
                return (
                  <div key={q.quintile} className="flex flex-col items-center gap-2">
                    <span className={cn(
                      "font-mono text-sm font-bold",
                      isPass ? "text-[hsl(var(--success))]" : (q.median_ratio ?? 0) < 0.85 ? "text-destructive" : "text-[hsl(var(--warning))]"
                    )}>
                      {q.median_ratio?.toFixed(3) ?? "--"}
                    </span>
                    <div className="relative h-24 w-full rounded-md bg-muted/20">
                      <div
                        className={cn(
                          "absolute bottom-0 w-full rounded-md transition-all",
                          isPass ? "bg-[hsl(var(--success))]/40" : (q.median_ratio ?? 0) < 0.85 ? "bg-destructive/40" : "bg-[hsl(var(--warning))]/40"
                        )}
                        style={{ height: `${Math.max(barHeight, 10)}%` }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-medium text-foreground">{(q.label ?? "").replace("20%", "")}</p>
                      <p className="text-[9px] text-muted-foreground">{"n="}{q.count ?? 0}</p>
                      <p className="font-mono text-[8px] text-muted-foreground">
                        {"$"}{formatNumber(priceMin)}{"-$"}{formatNumber(priceMax)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 rounded-md bg-muted/10 px-3 py-2 text-[10px] text-muted-foreground">
              <strong className="text-foreground">Interpretation:</strong>{" "}
              {"A regressive pattern exists when lower-value properties have higher assessment ratios than higher-value properties. IAAO standards require PRB between -0.05 and 0.05."}
              {study && !study.prb_pass && (
                <span className="ml-1 text-destructive">
                  {"Current PRB of "}{study.prb?.toFixed(4) ?? "--"}{" indicates significant regressivity."}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Neighborhood Equity Table */}
        {neighborhoods.length === 0 && !isLoadingNbhd && (
          <EmptyStates.NoNeighborhoods
            variant="card"
            className="min-h-[200px]"
          />
        )}
        {neighborhoods.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-5 page-break-before print:mt-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Neighborhood Equity Analysis
              </h2>
              <span className="ml-auto text-[9px] text-muted-foreground">{neighborhoods.length} segments</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2.5">Code</th>
                    <th className="px-3 py-2.5">Neighborhood</th>
                    <th className="px-3 py-2.5">City</th>
                    <th className="px-3 py-2.5 text-center">Count</th>
                    <th className="px-3 py-2.5 text-right">Median Ratio</th>
                    <th className="px-3 py-2.5 text-right">COD</th>
                    <th className="px-3 py-2.5 text-right">PRD</th>
                    <th className="px-3 py-2.5 text-right">Avg Assessed</th>
                    <th className="px-3 py-2.5 text-right">Avg Sale</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {neighborhoods.map((n, idx) => (
                    <tr
                      key={n.code}
                      tabIndex={0}
                      role="row"
                      className="border-b border-border/50 transition-colors hover:bg-accent/10 focus:bg-accent/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          const next = e.currentTarget.nextElementSibling as HTMLElement;
                          next?.focus();
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          const prev = e.currentTarget.previousElementSibling as HTMLElement;
                          prev?.focus();
                        }
                      }}
                      aria-rowindex={idx + 1}
                    >
                      <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-primary">{n.code}</td>
                      <td className="px-3 py-2.5 font-medium text-foreground">{n.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{n.city}</td>
                      <td className="px-3 py-2.5 text-center text-muted-foreground">{n.count}</td>
                      <td className={cn(
                        "px-3 py-2.5 text-right font-mono font-bold",
                        (n.median_ratio ?? 0) >= 0.9 ? "text-[hsl(var(--success))]" : (n.median_ratio ?? 0) >= 0.8 ? "text-[hsl(var(--warning))]" : "text-destructive"
                      )}>
                        {n.median_ratio?.toFixed(4) ?? "--"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{n.cod?.toFixed(2) ?? "--"}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{n.prd?.toFixed(4) ?? "--"}</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">{"$"}{formatNumber(n.mean_assessed ?? 0)}</td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground">{"$"}{formatNumber(n.mean_sale ?? 0)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <PassBadge pass={n.pass} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sales Validation Section */}
        <SalesValidation className="page-break-before print:mt-4" />

        {/* Data Quality Dashboard */}
        <DataQualityDashboard className="page-break-before print:mt-4" />
      </div>
    </div>
  );
}

function MetricCard({
  label, value, standard, pass, icon: Icon, color, sub
}: {
  label: string; value: string; standard: string; pass: boolean;
  icon: React.ComponentType<{ className?: string }>; color: string; sub?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-3.5 w-3.5", color)} />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        </div>
        <PassBadge pass={pass} />
      </div>
      <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
      <p className="text-[9px] font-mono text-muted-foreground">{standard}</p>
    </div>
  );
}
