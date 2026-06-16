"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Scale,
  Search,
  Clock,
  Gavel,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingDown,
  Calendar,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type AppealStatus =
  | "submitted"
  | "under_review"
  | "hearing_scheduled"
  | "hearing_complete"
  | "decided";

type AppealDecision = "approved" | "denied" | "partial" | "pending" | null;

interface Appeal {
  id: string;
  property_id: string;
  address?: string;
  city?: string;
  status: AppealStatus;
  decision: AppealDecision;
  original_value: string | number;
  requested_value: string | number;
  final_value: string | number | null;
  reason: string | null;
  hearing_date: string | null;
  filed_date: string;
  decided_date: string | null;
  appellant_name: string | null;
  appellant_email: string | null;
}

interface AppealStats {
  submitted: string;
  under_review: string;
  hearing_scheduled: string;
  decided: string;
  total: string;
  approved: string;
  denied_count: string;
  partial: string;
}

const STATUS_CONFIG: Record<
  AppealStatus,
  { label: string; icon: typeof Clock; className: string }
> = {
  submitted: {
    label: "Submitted",
    icon: Clock,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  under_review: {
    label: "Under Review",
    icon: Search,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  hearing_scheduled: {
    label: "Hearing Scheduled",
    icon: Calendar,
    className: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  hearing_complete: {
    label: "Hearing Complete",
    icon: Gavel,
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  decided: {
    label: "Decided",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
};

const DECISION_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  denied: { label: "Denied", className: "bg-destructive/10 text-destructive" },
  partial: { label: "Partial", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
};

const STATUS_FLOW: AppealStatus[] = [
  "submitted",
  "under_review",
  "hearing_scheduled",
  "hearing_complete",
  "decided",
];

function formatCurrency(value: string | number | null): string {
  if (value === null || value === undefined) return "--";
  const num = typeof value === "string" ? Number(value) : value;
  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatDate(value: string | null): string {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All Appeals" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "hearing_scheduled", label: "Hearing Scheduled" },
  { value: "decided", label: "Decided" },
];

export function AppealsManagement() {
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { data: statsData } = useSWR<{ stats: AppealStats }>(
    "/api/assessment/appeals?stats=true",
    fetcher
  );
  const { data, mutate, isLoading } = useSWR<{ appeals: Appeal[] }>(
    filter === "all"
      ? "/api/assessment/appeals"
      : `/api/assessment/appeals?status=${filter}`,
    fetcher
  );

  const appeals = useMemo(() => data?.appeals ?? [], [data]);
  const stats = statsData?.stats;

  const filteredAppeals = useMemo(() => {
    if (!search.trim()) return appeals;
    const q = search.toLowerCase();
    return appeals.filter(
      (a) =>
        a.address?.toLowerCase().includes(q) ||
        a.city?.toLowerCase().includes(q) ||
        a.appellant_name?.toLowerCase().includes(q) ||
        a.reason?.toLowerCase().includes(q)
    );
  }, [appeals, search]);

  async function advanceStatus(appeal: Appeal) {
    const currentIdx = STATUS_FLOW.indexOf(appeal.status);
    if (currentIdx >= STATUS_FLOW.length - 1) return;
    const nextStatus = STATUS_FLOW[currentIdx + 1];
    setUpdatingId(appeal.id);
    try {
      await fetch("/api/assessment/appeals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appeal.id, status: nextStatus }),
      });
      await mutate();
    } finally {
      setUpdatingId(null);
    }
  }

  async function decide(appeal: Appeal, decision: "approved" | "denied" | "partial") {
    setUpdatingId(appeal.id);
    try {
      const finalValue =
        decision === "approved"
          ? Number(appeal.requested_value)
          : decision === "partial"
            ? Math.round(
                (Number(appeal.original_value) + Number(appeal.requested_value)) / 2
              )
            : Number(appeal.original_value);
      await fetch("/api/assessment/appeals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: appeal.id,
          status: "decided",
          decision,
          final_value: finalValue,
        }),
      });
      await mutate();
    } finally {
      setUpdatingId(null);
    }
  }

  const statCards = [
    {
      label: "Open Appeals",
      value: stats
        ? Number(stats.submitted) +
          Number(stats.under_review) +
          Number(stats.hearing_scheduled)
        : 0,
      icon: Scale,
      className: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Hearings Scheduled",
      value: stats ? Number(stats.hearing_scheduled) : 0,
      icon: Calendar,
      className: "text-purple-600 dark:text-purple-400",
    },
    {
      label: "Decided",
      value: stats ? Number(stats.decided) : 0,
      icon: Gavel,
      className: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Approval Rate",
      value: stats && Number(stats.decided) > 0
        ? `${Math.round(
            ((Number(stats.approved) + Number(stats.partial)) /
              Number(stats.decided)) *
              100
          )}%`
        : "--",
      icon: TrendingDown,
      className: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </span>
                <Icon className={cn("h-4 w-4", card.className)} />
              </div>
              <span className="text-2xl font-bold text-foreground">
                {card.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address, appellant..."
            className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Appeals list */}
      <div className="flex flex-col gap-3">
        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading appeals...
          </div>
        )}

        {!isLoading && filteredAppeals.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card py-12 text-center">
            <Scale className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No appeals found</p>
            <p className="text-xs text-muted-foreground">
              {search ? "Try adjusting your search." : "No appeals match this filter."}
            </p>
          </div>
        )}

        {!isLoading &&
          filteredAppeals.map((appeal) => {
            const statusCfg = STATUS_CONFIG[appeal.status];
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedId === appeal.id;
            const isUpdating = updatingId === appeal.id;
            const reductionPct =
              ((Number(appeal.original_value) - Number(appeal.requested_value)) /
                Number(appeal.original_value)) *
              100;

            return (
              <div
                key={appeal.id}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : appeal.id)}
                  className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-accent/50"
                >
                  <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {appeal.address ?? "Unknown property"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {appeal.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{appeal.appellant_name ?? "Unknown appellant"}</span>
                      <span>&middot;</span>
                      <span>Filed {formatDate(appeal.filed_date)}</span>
                    </div>
                  </div>

                  <div className="hidden items-center gap-1 text-right sm:flex sm:flex-col">
                    <span className="text-xs text-muted-foreground">Requested</span>
                    <span className="text-sm font-medium text-foreground">
                      {formatCurrency(appeal.requested_value)}
                    </span>
                    <span className="text-[10px] text-destructive">
                      -{reductionPct.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusCfg.className
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </span>
                    {appeal.decision && appeal.decision !== "pending" && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          DECISION_CONFIG[appeal.decision]?.className
                        )}
                      >
                        {DECISION_CONFIG[appeal.decision]?.label}
                      </span>
                    )}
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-muted/30 p-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          Original Value
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(appeal.original_value)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          Requested Value
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(appeal.requested_value)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          Final Value
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(appeal.final_value)}
                        </span>
                      </div>
                    </div>

                    {appeal.reason && (
                      <div className="mt-4 flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          Reason for Appeal
                        </span>
                        <p className="text-sm text-foreground">{appeal.reason}</p>
                      </div>
                    )}

                    {appeal.hearing_date && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Hearing: {formatDate(appeal.hearing_date)}
                      </div>
                    )}

                    {/* Workflow actions */}
                    {appeal.status !== "decided" && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                        {appeal.status !== "hearing_complete" && (
                          <button
                            onClick={() => advanceStatus(appeal)}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            Advance to {STATUS_CONFIG[STATUS_FLOW[STATUS_FLOW.indexOf(appeal.status) + 1]]?.label}
                          </button>
                        )}
                        {(appeal.status === "hearing_complete" ||
                          appeal.status === "hearing_scheduled") && (
                          <>
                            <button
                              onClick={() => decide(appeal, "approved")}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Approve
                            </button>
                            <button
                              onClick={() => decide(appeal, "partial")}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Partial
                            </button>
                            <button
                              onClick={() => decide(appeal, "denied")}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Deny
                            </button>
                          </>
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
