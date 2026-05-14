"use client";

import { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Download,
  Filter,
  Search,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileWarning,
  Database,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: "completeness" | "accuracy" | "consistency" | "timeliness" | "uniqueness";
  severity: "critical" | "warning" | "info";
  field?: string;
  condition: string;
  passCount: number;
  failCount: number;
  lastRun: string;
  enabled: boolean;
}

interface DataIssue {
  id: string;
  ruleId: string;
  ruleName: string;
  propertyId: string;
  address: string;
  field: string;
  currentValue: string;
  expectedValue?: string;
  severity: "critical" | "warning" | "info";
  detectedAt: string;
  status: "open" | "acknowledged" | "resolved" | "ignored";
}

interface DataQualityDashboardProps {
  className?: string;
}

const MOCK_RULES: ValidationRule[] = [
  {
    id: "rule-001",
    name: "Missing Square Footage",
    description: "Properties must have square footage > 0",
    category: "completeness",
    severity: "critical",
    field: "sqft",
    condition: "sqft > 0",
    passCount: 12450,
    failCount: 23,
    lastRun: "2026-05-14T14:00:00Z",
    enabled: true,
  },
  {
    id: "rule-002",
    name: "Invalid Year Built",
    description: "Year built must be between 1800 and current year",
    category: "accuracy",
    severity: "warning",
    field: "year_built",
    condition: "year_built >= 1800 AND year_built <= 2026",
    passCount: 12468,
    failCount: 5,
    lastRun: "2026-05-14T14:00:00Z",
    enabled: true,
  },
  {
    id: "rule-003",
    name: "Assessment Ratio Outlier",
    description: "Assessment ratio should be between 0.80 and 1.20",
    category: "accuracy",
    severity: "critical",
    field: "ratio",
    condition: "ratio >= 0.80 AND ratio <= 1.20",
    passCount: 12389,
    failCount: 84,
    lastRun: "2026-05-14T14:00:00Z",
    enabled: true,
  },
  {
    id: "rule-004",
    name: "Duplicate Parcel Number",
    description: "Parcel numbers must be unique",
    category: "uniqueness",
    severity: "critical",
    field: "parcel_number",
    condition: "COUNT(parcel_number) = 1",
    passCount: 12471,
    failCount: 2,
    lastRun: "2026-05-14T14:00:00Z",
    enabled: true,
  },
  {
    id: "rule-005",
    name: "Stale Assessment Date",
    description: "Assessment date should be within last 3 years",
    category: "timeliness",
    severity: "warning",
    field: "last_assessed",
    condition: "last_assessed >= DATE_SUB(NOW(), INTERVAL 3 YEAR)",
    passCount: 12102,
    failCount: 371,
    lastRun: "2026-05-14T14:00:00Z",
    enabled: true,
  },
  {
    id: "rule-006",
    name: "Value-Size Consistency",
    description: "Value per sqft should be reasonable for property type",
    category: "consistency",
    severity: "warning",
    field: "value_per_sqft",
    condition: "value_per_sqft >= 50 AND value_per_sqft <= 1000",
    passCount: 12412,
    failCount: 61,
    lastRun: "2026-05-14T14:00:00Z",
    enabled: true,
  },
];

const MOCK_ISSUES: DataIssue[] = [
  {
    id: "issue-001",
    ruleId: "rule-003",
    ruleName: "Assessment Ratio Outlier",
    propertyId: "prop-234",
    address: "456 Keene Rd, Richland",
    field: "ratio",
    currentValue: "0.614",
    expectedValue: "0.80 - 1.20",
    severity: "critical",
    detectedAt: "2026-05-14T10:23:00Z",
    status: "open",
  },
  {
    id: "issue-002",
    ruleId: "rule-001",
    ruleName: "Missing Square Footage",
    propertyId: "prop-567",
    address: "789 Van Giesen St, Richland",
    field: "sqft",
    currentValue: "0",
    expectedValue: "> 0",
    severity: "critical",
    detectedAt: "2026-05-14T10:23:00Z",
    status: "open",
  },
  {
    id: "issue-003",
    ruleId: "rule-005",
    ruleName: "Stale Assessment Date",
    propertyId: "prop-891",
    address: "321 Jadwin Ave, Richland",
    field: "last_assessed",
    currentValue: "2022-03-15",
    expectedValue: "Within 3 years",
    severity: "warning",
    detectedAt: "2026-05-14T10:23:00Z",
    status: "acknowledged",
  },
  {
    id: "issue-004",
    ruleId: "rule-006",
    ruleName: "Value-Size Consistency",
    propertyId: "prop-445",
    address: "555 George Washington Way, Richland",
    field: "value_per_sqft",
    currentValue: "$1,250",
    expectedValue: "$50 - $1,000",
    severity: "warning",
    detectedAt: "2026-05-14T10:23:00Z",
    status: "open",
  },
  {
    id: "issue-005",
    ruleId: "rule-004",
    ruleName: "Duplicate Parcel Number",
    propertyId: "prop-112",
    address: "100 Columbia Point Dr, Richland",
    field: "parcel_number",
    currentValue: "1-2345-678-9012-001",
    severity: "critical",
    detectedAt: "2026-05-13T16:45:00Z",
    status: "open",
  },
];

const CATEGORIES = [
  { id: "completeness", label: "Completeness", icon: Database, color: "text-blue-500" },
  { id: "accuracy", label: "Accuracy", icon: ShieldCheck, color: "text-green-500" },
  { id: "consistency", label: "Consistency", icon: RefreshCw, color: "text-purple-500" },
  { id: "timeliness", label: "Timeliness", icon: Clock, color: "text-amber-500" },
  { id: "uniqueness", label: "Uniqueness", icon: FileWarning, color: "text-cyan-500" },
];

export function DataQualityDashboard({ className }: DataQualityDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "rules" | "issues">("overview");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRules = MOCK_RULES.filter((rule) => {
    if (selectedCategory && rule.category !== selectedCategory) return false;
    if (searchQuery && !rule.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredIssues = MOCK_ISSUES.filter((issue) => {
    if (selectedSeverity && issue.severity !== selectedSeverity) return false;
    if (searchQuery && !issue.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalProperties = 12473;
  const totalIssues = MOCK_ISSUES.filter((i) => i.status === "open").length;
  const criticalIssues = MOCK_ISSUES.filter((i) => i.severity === "critical" && i.status === "open").length;
  const qualityScore = Math.round(((totalProperties - totalIssues) / totalProperties) * 100 * 10) / 10;

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "warning":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "info":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-500/10 text-red-500";
      case "acknowledged":
        return "bg-amber-500/10 text-amber-500";
      case "resolved":
        return "bg-green-500/10 text-green-500";
      case "ignored":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Data Quality Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              {totalProperties.toLocaleString()} properties monitored
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
            <RefreshCw className="h-3.5 w-3.5" />
            Run All Rules
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
            <Settings className="h-3.5 w-3.5" />
            Configure
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border px-4">
        {[
          { id: "overview", label: "Overview" },
          { id: "rules", label: `Rules (${MOCK_RULES.length})` },
          { id: "issues", label: `Issues (${totalIssues})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="p-4">
          {/* Quality Score Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quality Score</span>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-500">{qualityScore}%</span>
                <span className="text-xs text-green-500">+0.3%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${qualityScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Open Issues</span>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{totalIssues}</span>
                <span className="text-xs text-red-500">+2 today</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {criticalIssues} critical, {totalIssues - criticalIssues} warnings
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rules Active</span>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  {MOCK_RULES.filter((r) => r.enabled).length}
                </span>
                <span className="text-xs text-muted-foreground">of {MOCK_RULES.length}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Last run: 2 hours ago</p>
            </div>

            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pass Rate</span>
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">99.6%</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                74,292 of 74,546 checks passed
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <h4 className="mb-3 text-sm font-medium text-foreground">Quality by Category</h4>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORIES.map((category) => {
              const categoryRules = MOCK_RULES.filter((r) => r.category === category.id);
              const totalPass = categoryRules.reduce((sum, r) => sum + r.passCount, 0);
              const totalFail = categoryRules.reduce((sum, r) => sum + r.failCount, 0);
              const passRate = totalPass + totalFail > 0 ? (totalPass / (totalPass + totalFail)) * 100 : 100;
              const Icon = category.icon;

              return (
                <div
                  key={category.id}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", category.color)} />
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-xl font-bold">{passRate.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", {
                        "bg-emerald-500": passRate >= 99,
                        "bg-amber-500": passRate >= 95 && passRate < 99,
                        "bg-red-500": passRate < 95,
                      })}
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {totalFail} issues in {categoryRules.length} rules
                  </p>
                </div>
              );
            })}
          </div>

          {/* Recent Issues */}
          <h4 className="mb-3 mt-6 text-sm font-medium text-foreground">Recent Issues</h4>
          <div className="space-y-2">
            {MOCK_ISSUES.slice(0, 3).map((issue) => (
              <div
                key={issue.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-center gap-3">
                  {issue.severity === "critical" ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{issue.address}</p>
                    <p className="text-xs text-muted-foreground">{issue.ruleName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded px-2 py-0.5 text-xs", getStatusStyles(issue.status))}>
                    {issue.status}
                  </span>
                  <button className="text-xs text-primary hover:underline">View</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <div className="p-4">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium",
                  !selectedCategory ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium",
                    selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rules List */}
          <div className="space-y-2">
            {filteredRules.map((rule) => {
              const isExpanded = expandedRule === rule.id;
              const passRate = ((rule.passCount / (rule.passCount + rule.failCount)) * 100).toFixed(1);

              return (
                <div key={rule.id} className="rounded-lg border border-border bg-background">
                  <div
                    className="flex cursor-pointer items-center justify-between p-3"
                    onClick={() => setExpandedRule(isExpanded ? null : rule.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded",
                          rule.enabled ? "bg-emerald-500/10" : "bg-muted"
                        )}
                      >
                        <ShieldCheck
                          className={cn("h-4 w-4", rule.enabled ? "text-emerald-500" : "text-muted-foreground")}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("rounded border px-2 py-0.5 text-xs", getSeverityStyles(rule.severity))}>
                        {rule.severity}
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-medium">{passRate}%</p>
                        <p className="text-xs text-muted-foreground">{rule.failCount} failed</p>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border bg-muted/30 p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Field</p>
                          <p className="text-sm">{rule.field || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Condition</p>
                          <code className="text-xs text-primary">{rule.condition}</code>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Pass / Fail</p>
                          <p className="text-sm">
                            {rule.passCount.toLocaleString()} / {rule.failCount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Last Run</p>
                          <p className="text-sm">
                            {new Date(rule.lastRun).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                          Run Now
                        </button>
                        <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
                          View Failures
                        </button>
                        <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
                          Edit Rule
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === "issues" && (
        <div className="p-4">
          {/* Filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setSelectedSeverity(null)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium",
                  !selectedSeverity ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                All
              </button>
              {["critical", "warning", "info"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(selectedSeverity === sev ? null : sev)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium capitalize",
                    selectedSeverity === sev ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Issues List */}
          <div className="space-y-2">
            {filteredIssues.map((issue) => (
              <div key={issue.id} className="rounded-lg border border-border bg-background p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {issue.severity === "critical" ? (
                      <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                    ) : issue.severity === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium">{issue.address}</p>
                      <p className="text-sm text-muted-foreground">{issue.ruleName}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Field: </span>
                          <span className="font-medium">{issue.field}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span className="font-medium text-red-500">{issue.currentValue}</span>
                        </div>
                        {issue.expectedValue && (
                          <div>
                            <span className="text-muted-foreground">Expected: </span>
                            <span className="font-medium text-green-500">{issue.expectedValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn("rounded px-2 py-0.5 text-xs capitalize", getStatusStyles(issue.status))}>
                      {issue.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(issue.detectedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90">
                    Fix Issue
                  </button>
                  <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
                    View Property
                  </button>
                  <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
                    Acknowledge
                  </button>
                  <button className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
                    Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Export */}
          <div className="mt-4 flex justify-end">
            <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">
              <Download className="h-3.5 w-3.5" />
              Export Issues CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
