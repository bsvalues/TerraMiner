"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  ClipboardList,
  Eye,
  ChevronRight,
  ArrowUpRight,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppealSummary {
  total: number;
  pending: number;
  inHearing: number;
  decided: number;
  approvalRate: number;
  avgReduction: number;
}

interface ExemptionSummary {
  total: number;
  active: number;
  pendingReview: number;
  expiringSoon: number;
  totalReduction: number;
}

interface InspectionSummary {
  scheduledToday: number;
  completedThisWeek: number;
  overdue: number;
  avgPerDay: number;
}

interface PermitSummary {
  active: number;
  pendingInspection: number;
  totalValue: number;
  newThisMonth: number;
}

// Mock data for dashboard widgets
const APPEAL_SUMMARY: AppealSummary = {
  total: 47,
  pending: 12,
  inHearing: 8,
  decided: 27,
  approvalRate: 34.2,
  avgReduction: 8500,
};

const EXEMPTION_SUMMARY: ExemptionSummary = {
  total: 2834,
  active: 2612,
  pendingReview: 45,
  expiringSoon: 23,
  totalReduction: 42500000,
};

const INSPECTION_SUMMARY: InspectionSummary = {
  scheduledToday: 6,
  completedThisWeek: 28,
  overdue: 3,
  avgPerDay: 5.6,
};

const PERMIT_SUMMARY: PermitSummary = {
  active: 156,
  pendingInspection: 23,
  totalValue: 12400000,
  newThisMonth: 34,
};

function formatCompact(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function AssessmentOpsWidgets({ className }: { className?: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section aria-label="Assessment Operations" className={className}>
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">
          Assessment Operations
        </h2>
        <span className="text-xs text-muted-foreground">
          Today&apos;s workflow summary
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto text-[10px] font-medium text-primary hover:underline"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      {/* Compact row -- always visible */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Appeals Widget */}
        <Link
          href="/assessment"
          className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Scale className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Appeals
                </p>
                <p className="text-lg font-bold text-foreground">
                  {APPEAL_SUMMARY.pending}
                </p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5 text-amber-500">
              <Clock className="h-3 w-3" />
              {APPEAL_SUMMARY.pending} pending
            </span>
            <span>&middot;</span>
            <span>{APPEAL_SUMMARY.inHearing} in hearing</span>
          </div>
        </Link>

        {/* Exemptions Widget */}
        <Link
          href="/notifications"
          className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                <Shield className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Exemptions
                </p>
                <p className="text-lg font-bold text-foreground">
                  {EXEMPTION_SUMMARY.active.toLocaleString()}
                </p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5 text-amber-500">
              <AlertTriangle className="h-3 w-3" />
              {EXEMPTION_SUMMARY.pendingReview} to review
            </span>
            <span>&middot;</span>
            <span>{EXEMPTION_SUMMARY.expiringSoon} expiring</span>
          </div>
        </Link>

        {/* Inspections Widget */}
        <Link
          href="/audit"
          className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Inspections
                </p>
                <p className="text-lg font-bold text-foreground">
                  {INSPECTION_SUMMARY.scheduledToday}
                </p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>today</span>
            <span>&middot;</span>
            {INSPECTION_SUMMARY.overdue > 0 ? (
              <span className="flex items-center gap-0.5 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {INSPECTION_SUMMARY.overdue} overdue
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[hsl(var(--success))]">
                <CheckCircle2 className="h-3 w-3" />
                on track
              </span>
            )}
          </div>
        </Link>

        {/* Permits Widget */}
        <Link
          href="/reports"
          className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3.5 transition-colors hover:border-primary/40"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <FileText className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Permits
                </p>
                <p className="text-lg font-bold text-foreground">
                  {PERMIT_SUMMARY.active}
                </p>
              </div>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{PERMIT_SUMMARY.pendingInspection} pending inspection</span>
            <span>&middot;</span>
            <span>{formatCompact(PERMIT_SUMMARY.totalValue)}</span>
          </div>
        </Link>
      </div>

      {/* Expanded details -- toggleable */}
      {expanded && (
        <div className="mt-3 grid gap-3 animate-slide-in lg:grid-cols-2">
          {/* Appeal Details */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Scale className="h-3.5 w-3.5 text-amber-500" />
                Appeal Pipeline
              </h3>
              <Link href="/assessment" className="text-[10px] font-medium text-primary hover:underline">
                View all <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {/* Pipeline stages */}
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="flex h-full">
                    <div
                      className="bg-amber-500 transition-all"
                      style={{ width: `${(APPEAL_SUMMARY.pending / APPEAL_SUMMARY.total) * 100}%` }}
                    />
                    <div
                      className="bg-primary transition-all"
                      style={{ width: `${(APPEAL_SUMMARY.inHearing / APPEAL_SUMMARY.total) * 100}%` }}
                    />
                    <div
                      className="bg-[hsl(var(--success))] transition-all"
                      style={{ width: `${(APPEAL_SUMMARY.decided / APPEAL_SUMMARY.total) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{APPEAL_SUMMARY.total}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending ({APPEAL_SUMMARY.pending})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary" /> In Hearing ({APPEAL_SUMMARY.inHearing})
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--success))]" /> Decided ({APPEAL_SUMMARY.decided})
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 rounded-md bg-muted/50 p-2 text-[10px]">
                <div>
                  <span className="text-muted-foreground">Approval Rate</span>
                  <p className="font-semibold text-foreground">{APPEAL_SUMMARY.approvalRate}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg Reduction</span>
                  <p className="font-semibold text-foreground">${APPEAL_SUMMARY.avgReduction.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                Weekly Activity
              </h3>
              <Link href="/audit" className="text-[10px] font-medium text-primary hover:underline">
                Full audit trail <ArrowUpRight className="ml-0.5 inline h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Properties Updated", value: 142, trend: 12, icon: TrendingUp, color: "text-[hsl(var(--success))]" },
                { label: "Sales Validated", value: 38, trend: -3, icon: TrendingDown, color: "text-amber-500" },
                { label: "Inspections Completed", value: INSPECTION_SUMMARY.completedThisWeek, trend: 5, icon: TrendingUp, color: "text-[hsl(var(--success))]" },
                { label: "Reports Generated", value: 7, trend: 2, icon: TrendingUp, color: "text-[hsl(var(--success))]" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{item.value}</span>
                    <span className={cn("flex items-center gap-0.5 text-[10px]", item.color)}>
                      <item.icon className="h-3 w-3" />
                      {item.trend > 0 ? "+" : ""}{item.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
