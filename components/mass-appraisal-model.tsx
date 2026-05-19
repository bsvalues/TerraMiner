"use client";

import { useState, useMemo } from "react";
import {
  BarChart3,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Target,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

type ModelStatus = "calibrated" | "needs_calibration" | "running" | "error";

interface ModelVariable {
  name: string;
  coefficient: number;
  standardError: number;
  tStatistic: number;
  pValue: number;
  significant: boolean;
  description: string;
}

interface ModelMetrics {
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  meanAbsoluteError: number;
  medianAbsolutePercentError: number;
  cod: number; // Coefficient of Dispersion
  prd: number; // Price-Related Differential
  prb: number; // Price-Related Bias
  sampleSize: number;
  outliers: number;
}

interface NeighborhoodModel {
  id: string;
  name: string;
  code: string;
  status: ModelStatus;
  lastCalibrated: string;
  metrics: ModelMetrics;
  variables: ModelVariable[];
  propertyCount: number;
  landBaseRate: number;
  timeTrendFactor: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const neighborhoodModels: NeighborhoodModel[] = [
  {
    id: "nm-1",
    name: "Columbia Park",
    code: "CP-01",
    status: "calibrated",
    lastCalibrated: "2026-04-28",
    propertyCount: 342,
    landBaseRate: 8.50,
    timeTrendFactor: 1.045,
    metrics: {
      rSquared: 0.924,
      adjustedRSquared: 0.918,
      fStatistic: 156.7,
      meanAbsoluteError: 12450,
      medianAbsolutePercentError: 3.2,
      cod: 8.7,
      prd: 1.012,
      prb: -0.008,
      sampleSize: 87,
      outliers: 3,
    },
    variables: [
      { name: "GLA (SF)", coefficient: 142.50, standardError: 8.23, tStatistic: 17.32, pValue: 0.0001, significant: true, description: "Gross Living Area in square feet" },
      { name: "Lot Size (SF)", coefficient: 2.85, standardError: 0.42, tStatistic: 6.79, pValue: 0.0001, significant: true, description: "Total lot size in square feet" },
      { name: "Age", coefficient: -1250.00, standardError: 185.0, tStatistic: -6.76, pValue: 0.0001, significant: true, description: "Effective age of structure" },
      { name: "Bedrooms", coefficient: 8500.00, standardError: 2100.0, tStatistic: 4.05, pValue: 0.0003, significant: true, description: "Number of bedrooms" },
      { name: "Bathrooms", coefficient: 18750.00, standardError: 3200.0, tStatistic: 5.86, pValue: 0.0001, significant: true, description: "Number of full bathrooms" },
      { name: "Garage (SF)", coefficient: 45.00, standardError: 12.5, tStatistic: 3.60, pValue: 0.0008, significant: true, description: "Garage area in square feet" },
      { name: "Condition (Good)", coefficient: 22500.00, standardError: 4500.0, tStatistic: 5.00, pValue: 0.0001, significant: true, description: "Good condition indicator" },
      { name: "Pool", coefficient: 15000.00, standardError: 6800.0, tStatistic: 2.21, pValue: 0.0312, significant: true, description: "Swimming pool indicator" },
      { name: "View Premium", coefficient: 12000.00, standardError: 5200.0, tStatistic: 2.31, pValue: 0.0245, significant: true, description: "View quality premium" },
    ],
  },
  {
    id: "nm-2",
    name: "Jadwin Heights",
    code: "JH-02",
    status: "needs_calibration",
    lastCalibrated: "2025-11-15",
    propertyCount: 218,
    landBaseRate: 7.25,
    timeTrendFactor: 1.032,
    metrics: {
      rSquared: 0.871,
      adjustedRSquared: 0.859,
      fStatistic: 98.4,
      meanAbsoluteError: 18920,
      medianAbsolutePercentError: 5.8,
      cod: 14.2,
      prd: 1.045,
      prb: -0.032,
      sampleSize: 52,
      outliers: 6,
    },
    variables: [
      { name: "GLA (SF)", coefficient: 128.75, standardError: 11.80, tStatistic: 10.91, pValue: 0.0001, significant: true, description: "Gross Living Area in square feet" },
      { name: "Lot Size (SF)", coefficient: 2.10, standardError: 0.65, tStatistic: 3.23, pValue: 0.0022, significant: true, description: "Total lot size in square feet" },
      { name: "Age", coefficient: -980.00, standardError: 220.0, tStatistic: -4.45, pValue: 0.0001, significant: true, description: "Effective age of structure" },
      { name: "Bedrooms", coefficient: 6200.00, standardError: 2800.0, tStatistic: 2.21, pValue: 0.0320, significant: true, description: "Number of bedrooms" },
      { name: "Bathrooms", coefficient: 15200.00, standardError: 4100.0, tStatistic: 3.71, pValue: 0.0006, significant: true, description: "Number of full bathrooms" },
      { name: "Garage (SF)", coefficient: 38.50, standardError: 18.2, tStatistic: 2.12, pValue: 0.0395, significant: true, description: "Garage area in square feet" },
      { name: "Condition (Good)", coefficient: 19800.00, standardError: 5800.0, tStatistic: 3.41, pValue: 0.0014, significant: true, description: "Good condition indicator" },
    ],
  },
  {
    id: "nm-3",
    name: "Bombing Range",
    code: "BR-03",
    status: "calibrated",
    lastCalibrated: "2026-05-01",
    propertyCount: 156,
    landBaseRate: 5.75,
    timeTrendFactor: 1.028,
    metrics: {
      rSquared: 0.908,
      adjustedRSquared: 0.897,
      fStatistic: 121.3,
      meanAbsoluteError: 9870,
      medianAbsolutePercentError: 4.1,
      cod: 10.3,
      prd: 1.008,
      prb: -0.005,
      sampleSize: 41,
      outliers: 2,
    },
    variables: [
      { name: "GLA (SF)", coefficient: 118.90, standardError: 9.45, tStatistic: 12.58, pValue: 0.0001, significant: true, description: "Gross Living Area in square feet" },
      { name: "Lot Size (SF)", coefficient: 1.95, standardError: 0.38, tStatistic: 5.13, pValue: 0.0001, significant: true, description: "Total lot size in square feet" },
      { name: "Age", coefficient: -875.00, standardError: 195.0, tStatistic: -4.49, pValue: 0.0001, significant: true, description: "Effective age of structure" },
      { name: "Bathrooms", coefficient: 14500.00, standardError: 3600.0, tStatistic: 4.03, pValue: 0.0003, significant: true, description: "Number of full bathrooms" },
      { name: "Garage (SF)", coefficient: 42.00, standardError: 14.0, tStatistic: 3.00, pValue: 0.0048, significant: true, description: "Garage area in square feet" },
      { name: "Condition (Good)", coefficient: 20100.00, standardError: 5100.0, tStatistic: 3.94, pValue: 0.0004, significant: true, description: "Good condition indicator" },
    ],
  },
  {
    id: "nm-4",
    name: "South Richland",
    code: "SR-04",
    status: "error",
    lastCalibrated: "2025-09-20",
    propertyCount: 89,
    landBaseRate: 6.10,
    timeTrendFactor: 1.015,
    metrics: {
      rSquared: 0.742,
      adjustedRSquared: 0.718,
      fStatistic: 42.1,
      meanAbsoluteError: 28400,
      medianAbsolutePercentError: 9.6,
      cod: 22.8,
      prd: 1.089,
      prb: -0.065,
      sampleSize: 18,
      outliers: 5,
    },
    variables: [
      { name: "GLA (SF)", coefficient: 105.20, standardError: 22.10, tStatistic: 4.76, pValue: 0.0003, significant: true, description: "Gross Living Area in square feet" },
      { name: "Lot Size (SF)", coefficient: 1.45, standardError: 0.89, tStatistic: 1.63, pValue: 0.1245, significant: false, description: "Total lot size in square feet" },
      { name: "Age", coefficient: -620.00, standardError: 380.0, tStatistic: -1.63, pValue: 0.1230, significant: false, description: "Effective age of structure" },
      { name: "Bathrooms", coefficient: 11200.00, standardError: 6200.0, tStatistic: 1.81, pValue: 0.0912, significant: false, description: "Number of full bathrooms" },
    ],
  },
];

// ── Component ──────────────────────────────────────────────────────────────

interface MassAppraisalModelProps {
  className?: string;
}

export function MassAppraisalModel({ className }: MassAppraisalModelProps) {
  const [expandedModel, setExpandedModel] = useState<string | null>("nm-1");
  const [selectedTab, setSelectedTab] = useState<"overview" | "variables" | "diagnostics">("overview");

  const summary = useMemo(() => {
    const total = neighborhoodModels.length;
    const calibrated = neighborhoodModels.filter((m) => m.status === "calibrated").length;
    const needsCalibration = neighborhoodModels.filter((m) => m.status === "needs_calibration").length;
    const errors = neighborhoodModels.filter((m) => m.status === "error").length;
    const avgCOD = neighborhoodModels.reduce((sum, m) => sum + m.metrics.cod, 0) / total;
    const totalProperties = neighborhoodModels.reduce((sum, m) => sum + m.propertyCount, 0);
    return { total, calibrated, needsCalibration, errors, avgCOD, totalProperties };
  }, []);

  const statusConfig: Record<ModelStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    calibrated: { label: "Calibrated", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
    needs_calibration: { label: "Needs Calibration", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertTriangle },
    running: { label: "Running", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: RefreshCw },
    error: { label: "Error", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: AlertTriangle },
  };

  function getMetricStatus(metric: string, value: number): "good" | "warning" | "poor" {
    switch (metric) {
      case "cod":
        return value <= 10 ? "good" : value <= 15 ? "warning" : "poor";
      case "prd":
        return value >= 0.98 && value <= 1.03 ? "good" : value >= 0.95 && value <= 1.05 ? "warning" : "poor";
      case "prb":
        return Math.abs(value) <= 0.02 ? "good" : Math.abs(value) <= 0.05 ? "warning" : "poor";
      case "rSquared":
        return value >= 0.9 ? "good" : value >= 0.8 ? "warning" : "poor";
      default:
        return "good";
    }
  }

  const metricStatusColors = {
    good: "text-emerald-700 bg-emerald-50",
    warning: "text-amber-700 bg-amber-50",
    poor: "text-red-700 bg-red-50",
  };

  return (
    <div className={`rounded-lg border border-border bg-card ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100">
            <Activity className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Mass Appraisal Model Calibration</h3>
            <p className="text-xs text-muted-foreground">
              MRA regression models by neighborhood | {summary.totalProperties} properties
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700">
            <Zap className="h-3.5 w-3.5" />
            Calibrate All
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 border-b border-border p-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Models</p>
          <p className="text-lg font-bold text-foreground">{summary.total}</p>
          <p className="text-xs text-emerald-600">{summary.calibrated} calibrated</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Avg COD</p>
          <p className="text-lg font-bold text-foreground">{summary.avgCOD.toFixed(1)}%</p>
          <p className={`text-xs ${summary.avgCOD <= 15 ? "text-emerald-600" : "text-amber-600"}`}>
            {summary.avgCOD <= 15 ? "IAAO Compliant" : "Review Needed"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Needs Review</p>
          <p className="text-lg font-bold text-amber-600">{summary.needsCalibration + summary.errors}</p>
          <p className="text-xs text-muted-foreground">
            {summary.needsCalibration} stale, {summary.errors} error
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Properties</p>
          <p className="text-lg font-bold text-foreground">{summary.totalProperties.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{neighborhoodModels.reduce((s, m) => s + m.metrics.sampleSize, 0)} sales used</p>
        </div>
      </div>

      {/* Neighborhood Models */}
      <div className="divide-y divide-border">
        {neighborhoodModels.map((model) => {
          const isExpanded = expandedModel === model.id;
          const sc = statusConfig[model.status];
          const StatusIcon = sc.icon;

          return (
            <div key={model.id} className="group">
              {/* Model Header Row */}
              <button
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30"
                onClick={() => setExpandedModel(isExpanded ? null : model.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{model.name}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">
                      {model.code}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${sc.bg} ${sc.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {sc.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {model.propertyCount} properties | {model.metrics.sampleSize} sales | Last: {new Date(model.lastCalibrated).toLocaleDateString()}
                  </p>
                </div>

                {/* Quick Metrics */}
                <div className="hidden items-center gap-4 md:flex">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">R&sup2;</p>
                    <p className={`text-sm font-semibold ${
                      getMetricStatus("rSquared", model.metrics.rSquared) === "good" ? "text-emerald-600" :
                      getMetricStatus("rSquared", model.metrics.rSquared) === "warning" ? "text-amber-600" : "text-red-600"
                    }`}>{model.metrics.rSquared.toFixed(3)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">COD</p>
                    <p className={`text-sm font-semibold ${
                      getMetricStatus("cod", model.metrics.cod) === "good" ? "text-emerald-600" :
                      getMetricStatus("cod", model.metrics.cod) === "warning" ? "text-amber-600" : "text-red-600"
                    }`}>{model.metrics.cod.toFixed(1)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">PRD</p>
                    <p className={`text-sm font-semibold ${
                      getMetricStatus("prd", model.metrics.prd) === "good" ? "text-emerald-600" :
                      getMetricStatus("prd", model.metrics.prd) === "warning" ? "text-amber-600" : "text-red-600"
                    }`}>{model.metrics.prd.toFixed(3)}</p>
                  </div>
                </div>
              </button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-border bg-muted/10 p-4">
                  {/* Tab Navigation */}
                  <div className="mb-4 flex gap-1 rounded-lg bg-muted/50 p-1">
                    {(["overview", "variables", "diagnostics"] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          selectedTab === tab
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        onClick={() => setSelectedTab(tab)}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Overview Tab */}
                  {selectedTab === "overview" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">R-Squared</p>
                          <p className="text-lg font-bold text-foreground">{model.metrics.rSquared.toFixed(3)}</p>
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${metricStatusColors[getMetricStatus("rSquared", model.metrics.rSquared)]}`}>
                            {getMetricStatus("rSquared", model.metrics.rSquared) === "good" ? "Strong" : getMetricStatus("rSquared", model.metrics.rSquared) === "warning" ? "Moderate" : "Weak"}
                          </span>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">COD</p>
                          <p className="text-lg font-bold text-foreground">{model.metrics.cod.toFixed(1)}%</p>
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${metricStatusColors[getMetricStatus("cod", model.metrics.cod)]}`}>
                            {"≤"}15% IAAO {getMetricStatus("cod", model.metrics.cod) === "good" ? "Pass" : "Fail"}
                          </span>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">PRD</p>
                          <p className="text-lg font-bold text-foreground">{model.metrics.prd.toFixed(3)}</p>
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${metricStatusColors[getMetricStatus("prd", model.metrics.prd)]}`}>
                            0.98-1.03 {getMetricStatus("prd", model.metrics.prd) === "good" ? "Pass" : "Fail"}
                          </span>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">PRB</p>
                          <p className="text-lg font-bold text-foreground">{model.metrics.prb.toFixed(3)}</p>
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${metricStatusColors[getMetricStatus("prb", model.metrics.prb)]}`}>
                            {"|"}{"≤"}0.05 {getMetricStatus("prb", model.metrics.prb) === "good" ? "Pass" : "Fail"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Mean Absolute Error</p>
                          <p className="text-base font-semibold text-foreground">${model.metrics.meanAbsoluteError.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">Median APE</p>
                          <p className="text-base font-semibold text-foreground">{model.metrics.medianAbsolutePercentError.toFixed(1)}%</p>
                        </div>
                        <div className="rounded-lg border border-border p-3">
                          <p className="text-xs text-muted-foreground">F-Statistic</p>
                          <p className="text-base font-semibold text-foreground">{model.metrics.fStatistic.toFixed(1)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-foreground">Model Parameters</p>
                          <p className="text-xs text-muted-foreground">
                            Land base rate: ${model.landBaseRate.toFixed(2)}/SF | Time trend: {((model.timeTrendFactor - 1) * 100).toFixed(1)}% annual | Outliers removed: {model.metrics.outliers}
                          </p>
                        </div>
                        <button className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                          Configure
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Variables Tab */}
                  {selectedTab === "variables" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="pb-2 pr-4 font-medium text-muted-foreground">Variable</th>
                            <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Coefficient</th>
                            <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">Std Error</th>
                            <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">t-Stat</th>
                            <th className="pb-2 pr-4 text-right font-medium text-muted-foreground">p-Value</th>
                            <th className="pb-2 text-right font-medium text-muted-foreground">Sig</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {model.variables.map((v) => (
                            <tr key={v.name} className="hover:bg-muted/30">
                              <td className="py-2 pr-4">
                                <div>
                                  <p className="font-medium text-foreground">{v.name}</p>
                                  <p className="text-muted-foreground">{v.description}</p>
                                </div>
                              </td>
                              <td className="py-2 pr-4 text-right font-mono text-foreground">
                                {v.coefficient >= 0 ? "+" : ""}{v.coefficient.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 pr-4 text-right font-mono text-muted-foreground">
                                {v.standardError.toFixed(2)}
                              </td>
                              <td className="py-2 pr-4 text-right font-mono text-foreground">
                                {v.tStatistic.toFixed(2)}
                              </td>
                              <td className="py-2 pr-4 text-right font-mono text-muted-foreground">
                                {v.pValue < 0.001 ? "<0.001" : v.pValue.toFixed(4)}
                              </td>
                              <td className="py-2 text-right">
                                {v.significant ? (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Yes
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 rounded bg-red-50 px-1.5 py-0.5 text-red-700">
                                    <AlertTriangle className="h-3 w-3" />
                                    No
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Diagnostics Tab */}
                  {selectedTab === "diagnostics" && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-border p-4">
                        <h4 className="mb-3 text-xs font-semibold text-foreground uppercase tracking-wide">IAAO Standard Compliance</h4>
                        <div className="space-y-3">
                          {[
                            { name: "Coefficient of Dispersion (COD)", value: model.metrics.cod, target: "5-15%", pass: model.metrics.cod <= 15, display: `${model.metrics.cod.toFixed(1)}%` },
                            { name: "Price-Related Differential (PRD)", value: model.metrics.prd, target: "0.98-1.03", pass: model.metrics.prd >= 0.98 && model.metrics.prd <= 1.03, display: model.metrics.prd.toFixed(3) },
                            { name: "Price-Related Bias (PRB)", value: model.metrics.prb, target: "|x| ≤ 0.05", pass: Math.abs(model.metrics.prb) <= 0.05, display: model.metrics.prb.toFixed(3) },
                            { name: "Sample Size Adequacy", value: model.metrics.sampleSize, target: "≥ 30 sales", pass: model.metrics.sampleSize >= 30, display: `${model.metrics.sampleSize} sales` },
                            { name: "Model Fit (R-Squared)", value: model.metrics.rSquared, target: "≥ 0.85", pass: model.metrics.rSquared >= 0.85, display: model.metrics.rSquared.toFixed(3) },
                          ].map((check) => (
                            <div key={check.name} className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                              <div className="flex items-center gap-2">
                                {check.pass ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                                <div>
                                  <p className="text-xs font-medium text-foreground">{check.name}</p>
                                  <p className="text-xs text-muted-foreground">Target: {check.target}</p>
                                </div>
                              </div>
                              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                check.pass ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                              }`}>
                                {check.display}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {model.status === "error" && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <p className="text-sm font-medium text-red-700">Model Calibration Issues</p>
                          </div>
                          <ul className="mt-2 space-y-1 text-xs text-red-600">
                            <li>Insufficient sample size ({model.metrics.sampleSize} sales, minimum 30 required)</li>
                            <li>Multiple insignificant variables detected</li>
                            <li>COD exceeds IAAO standard of 15% (current: {model.metrics.cod}%)</li>
                            <li>PRD indicates vertical inequity (current: {model.metrics.prd})</li>
                          </ul>
                          <button className="mt-3 flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">
                            <RefreshCw className="h-3.5 w-3.5" />
                            Re-calibrate with Extended Sample
                          </button>
                        </div>
                      )}

                      {model.status !== "error" && (
                        <div className="flex items-center gap-2">
                          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                            <BarChart3 className="h-3.5 w-3.5" />
                            Residual Analysis
                          </button>
                          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                            <Target className="h-3.5 w-3.5" />
                            Predicted vs Actual
                          </button>
                          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/50">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Time Trend Analysis
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
