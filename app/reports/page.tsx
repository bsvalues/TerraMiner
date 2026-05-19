"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  ChevronRight,
  BarChart3,
  TrendingUp,
  Scale,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  MapPin,
} from "lucide-react";
import { formatNumber, cn } from "@/lib/utils";

type ReportStatus = "ready" | "generating" | "scheduled" | "error";
type ReportCategory = "all" | "compliance" | "analysis" | "operations";

interface Report {
  id: string;
  name: string;
  description: string;
  category: "compliance" | "analysis" | "operations";
  lastGenerated: string;
  status: ReportStatus;
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "on-demand";
  format: "pdf" | "excel" | "csv";
  metrics?: {
    label: string;
    value: string;
    status?: "good" | "warning" | "critical";
  }[];
}

const mockReports: Report[] = [
  {
    id: "ratio-study",
    name: "IAAO Ratio Study Report",
    description: "Comprehensive assessment-to-sale ratio analysis with COD, PRD, and PRB metrics for IAAO compliance certification.",
    category: "compliance",
    lastGenerated: "2026-05-14T08:30:00Z",
    status: "ready",
    frequency: "quarterly",
    format: "pdf",
    metrics: [
      { label: "Median Ratio", value: "0.985", status: "good" },
      { label: "COD", value: "12.4%", status: "good" },
      { label: "PRD", value: "1.02", status: "good" },
    ],
  },
  {
    id: "uniformity-report",
    name: "Assessment Uniformity Analysis",
    description: "Statistical analysis of assessment uniformity across property classes and neighborhoods.",
    category: "compliance",
    lastGenerated: "2026-05-13T14:15:00Z",
    status: "ready",
    frequency: "monthly",
    format: "pdf",
    metrics: [
      { label: "Overall COD", value: "11.8%", status: "good" },
      { label: "Residential COD", value: "10.2%", status: "good" },
      { label: "Commercial COD", value: "14.5%", status: "warning" },
    ],
  },
  {
    id: "equity-report",
    name: "Vertical Equity Report",
    description: "PRD and PRB analysis to identify regressivity or progressivity in assessments by value range.",
    category: "compliance",
    lastGenerated: "2026-05-12T09:00:00Z",
    status: "ready",
    frequency: "quarterly",
    format: "pdf",
    metrics: [
      { label: "PRD", value: "1.02", status: "good" },
      { label: "PRB", value: "-0.008", status: "good" },
      { label: "Equity Score", value: "A", status: "good" },
    ],
  },
  {
    id: "sales-validation",
    name: "Sales Validation Summary",
    description: "Report of qualified and disqualified sales with rejection reasons and validation statistics.",
    category: "operations",
    lastGenerated: "2026-05-14T06:00:00Z",
    status: "ready",
    frequency: "weekly",
    format: "excel",
    metrics: [
      { label: "Total Sales", value: "247", status: "good" },
      { label: "Qualified", value: "198", status: "good" },
      { label: "Rejection Rate", value: "19.8%", status: "warning" },
    ],
  },
  {
    id: "market-trends",
    name: "Market Trend Analysis",
    description: "Time-adjusted sales analysis showing market trends by property type and geographic area.",
    category: "analysis",
    lastGenerated: "2026-05-13T10:30:00Z",
    status: "ready",
    frequency: "monthly",
    format: "pdf",
    metrics: [
      { label: "YoY Change", value: "+4.2%", status: "good" },
      { label: "Trend Factor", value: "1.035", status: "good" },
      { label: "Confidence", value: "High", status: "good" },
    ],
  },
  {
    id: "appeals-summary",
    name: "Appeals Activity Report",
    description: "Summary of assessment appeals including outcomes, value adjustments, and success rates.",
    category: "operations",
    lastGenerated: "2026-05-10T16:00:00Z",
    status: "ready",
    frequency: "monthly",
    format: "excel",
    metrics: [
      { label: "Total Appeals", value: "45", status: "good" },
      { label: "Resolved", value: "38", status: "good" },
      { label: "Avg Reduction", value: "8.3%", status: "warning" },
    ],
  },
  {
    id: "neighborhood-analysis",
    name: "Neighborhood Factor Report",
    description: "Analysis of neighborhood adjustment factors with market evidence and trend indicators.",
    category: "analysis",
    lastGenerated: "2026-05-11T11:00:00Z",
    status: "ready",
    frequency: "quarterly",
    format: "pdf",
    metrics: [
      { label: "Neighborhoods", value: "24", status: "good" },
      { label: "Factors Updated", value: "8", status: "good" },
      { label: "Avg Adjustment", value: "+2.1%", status: "good" },
    ],
  },
  {
    id: "exemptions-report",
    name: "Exemptions & Abatements",
    description: "Comprehensive report of all active exemptions, abatements, and their tax impact.",
    category: "operations",
    lastGenerated: "2026-05-08T09:30:00Z",
    status: "scheduled",
    frequency: "annual",
    format: "excel",
    metrics: [
      { label: "Active Exemptions", value: "1,247", status: "good" },
      { label: "Tax Impact", value: "$2.4M", status: "warning" },
      { label: "Pending Review", value: "23", status: "warning" },
    ],
  },
];

const categoryLabels: Record<ReportCategory, string> = {
  all: "All Reports",
  compliance: "IAAO Compliance",
  analysis: "Market Analysis",
  operations: "Operations",
};

const categoryIcons: Record<Exclude<ReportCategory, "all">, typeof Scale> = {
  compliance: Scale,
  analysis: TrendingUp,
  operations: FileSpreadsheet,
};

export default function ReportsPage() {
  const [category, setCategory] = useState<ReportCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());

  const filteredReports = useMemo(() => {
    return mockReports.filter((report) => {
      const matchesCategory = category === "all" || report.category === category;
      const matchesSearch =
        searchQuery === "" ||
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [category, searchQuery]);

  const handleGenerateReport = (reportId: string) => {
    setGeneratingReports((prev) => new Set(prev).add(reportId));
    // Simulate report generation
    setTimeout(() => {
      setGeneratingReports((prev) => {
        const next = new Set(prev);
        next.delete(reportId);
        return next;
      });
    }, 2000);
  };

  const handleDownloadReport = (report: Report) => {
    // In production, this would trigger a download
    alert(`Downloading ${report.name} as ${report.format.toUpperCase()}. (Demo only)`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: ReportStatus, isGenerating: boolean) => {
    if (isGenerating) return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    switch (status) {
      case "ready":
        return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-[hsl(var(--warning))]" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMetricStatusColor = (status?: "good" | "warning" | "critical") => {
    switch (status) {
      case "good":
        return "text-[hsl(var(--success))]";
      case "warning":
        return "text-[hsl(var(--warning))]";
      case "critical":
        return "text-destructive";
      default:
        return "text-foreground";
    }
  };

  // Stats summary
  const stats = {
    totalReports: mockReports.length,
    readyReports: mockReports.filter((r) => r.status === "ready").length,
    complianceReports: mockReports.filter((r) => r.category === "compliance").length,
    lastUpdated: mockReports.reduce((latest, r) => {
      return new Date(r.lastGenerated) > new Date(latest) ? r.lastGenerated : latest;
    }, mockReports[0].lastGenerated),
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate and download IAAO compliance reports and analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Calendar className="h-4 w-4" />
            Schedule
          </button>
          <button className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <FileText className="h-4 w-4" />
            New Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Reports</p>
              <p className="text-xl font-bold text-foreground">{stats.totalReports}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--success))]/10">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ready</p>
              <p className="text-xl font-bold text-foreground">{stats.readyReports}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--warning))]/10">
              <Scale className="h-5 w-5 text-[hsl(var(--warning))]" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Compliance</p>
              <p className="text-xl font-bold text-foreground">{stats.complianceReports}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Last Updated</p>
              <p className="text-sm font-semibold text-foreground">{formatDate(stats.lastUpdated).split(",")[0]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {(["all", "compliance", "analysis", "operations"] as ReportCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium transition-colors",
                category === cat
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {cat !== "all" && (() => {
                const Icon = categoryIcons[cat];
                return <Icon className="h-3.5 w-3.5" />;
              })()}
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-64"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredReports.map((report) => {
          const isGenerating = generatingReports.has(report.id);
          const CategoryIcon = categoryIcons[report.category];

          return (
            <div
              key={report.id}
              className="group flex flex-col rounded-xl border border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
            >
              {/* Header */}
              <div className="flex items-start gap-3 p-4 pb-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  report.category === "compliance" && "bg-[hsl(var(--warning))]/10",
                  report.category === "analysis" && "bg-primary/10",
                  report.category === "operations" && "bg-[hsl(var(--success))]/10"
                )}>
                  <CategoryIcon className={cn(
                    "h-5 w-5",
                    report.category === "compliance" && "text-[hsl(var(--warning))]",
                    report.category === "analysis" && "text-primary",
                    report.category === "operations" && "text-[hsl(var(--success))]"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-foreground">{report.name}</h3>
                    {getStatusIcon(report.status, isGenerating)}
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {report.frequency} • {report.format.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className="px-4 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                {report.description}
              </p>

              {/* Metrics */}
              {report.metrics && (
                <div className="mt-3 flex items-center gap-3 px-4">
                  {report.metrics.slice(0, 3).map((metric, idx) => (
                    <div key={idx} className="flex flex-col">
                      <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        {metric.label}
                      </span>
                      <span className={cn("text-sm font-bold", getMetricStatusColor(metric.status))}>
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto flex items-center justify-between border-t border-border p-3 pt-3">
                <span className="text-[10px] text-muted-foreground">
                  Updated {formatDate(report.lastGenerated)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={isGenerating}
                    className="flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-3 w-3" />
                        Regenerate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadReport(report)}
                    disabled={report.status !== "ready" || isGenerating}
                    className="flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredReports.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-sm font-medium text-foreground">No reports found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
}
