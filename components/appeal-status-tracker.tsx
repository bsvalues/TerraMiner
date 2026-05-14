"use client";

import { useState, useMemo } from "react";
import {
  Scale,
  Plus,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Upload,
  User,
  Building2,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";

type AppealStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "hearing_scheduled"
  | "hearing_complete"
  | "decided"
  | "withdrawn";

type AppealDecision = "pending" | "approved" | "denied" | "partial";

interface AppealTimeline {
  date: string;
  status: AppealStatus;
  note?: string;
  actor?: string;
}

interface Appeal {
  id: string;
  caseNumber: string;
  taxYear: number;
  originalValue: number;
  contestedValue: number;
  requestedValue: number;
  status: AppealStatus;
  decision: AppealDecision;
  finalValue?: number;
  filingDate: string;
  hearingDate?: string;
  decisionDate?: string;
  reason: string;
  timeline: AppealTimeline[];
}

const STATUS_CONFIG: Record<
  AppealStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Draft", color: "text-muted-foreground", bgColor: "bg-muted" },
  submitted: { label: "Submitted", color: "text-primary", bgColor: "bg-primary/10" },
  under_review: { label: "Under Review", color: "text-[hsl(var(--warning))]", bgColor: "bg-[hsl(var(--warning))]/10" },
  hearing_scheduled: { label: "Hearing Scheduled", color: "text-[hsl(var(--warning))]", bgColor: "bg-[hsl(var(--warning))]/10" },
  hearing_complete: { label: "Hearing Complete", color: "text-primary", bgColor: "bg-primary/10" },
  decided: { label: "Decided", color: "text-[hsl(var(--success))]", bgColor: "bg-[hsl(var(--success))]/10" },
  withdrawn: { label: "Withdrawn", color: "text-muted-foreground", bgColor: "bg-muted" },
};

const DECISION_CONFIG: Record<
  AppealDecision,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  pending: { label: "Pending", color: "text-muted-foreground", icon: Clock },
  approved: { label: "Approved", color: "text-[hsl(var(--success))]", icon: CheckCircle2 },
  denied: { label: "Denied", color: "text-destructive", icon: XCircle },
  partial: { label: "Partial Reduction", color: "text-[hsl(var(--warning))]", icon: AlertCircle },
};

// Status step order for progress indicator
const STATUS_STEPS: AppealStatus[] = [
  "submitted",
  "under_review",
  "hearing_scheduled",
  "hearing_complete",
  "decided",
];

// Generate mock appeals based on property ID
function generateMockAppeals(propertyId: string): Appeal[] {
  const seed = propertyId.charCodeAt(propertyId.length - 1) % 10;
  
  if (seed < 6) return []; // 60% have no appeals
  
  const appeals: Appeal[] = [];
  
  if (seed >= 6) {
    appeals.push({
      id: `${propertyId}-appeal-1`,
      caseNumber: `AP-2025-${1000 + seed * 123}`,
      taxYear: 2025,
      originalValue: 285000,
      contestedValue: 285000,
      requestedValue: 245000,
      status: seed >= 8 ? "decided" : "under_review",
      decision: seed >= 8 ? "partial" : "pending",
      finalValue: seed >= 8 ? 265000 : undefined,
      filingDate: "2025-02-15",
      hearingDate: seed >= 7 ? "2025-04-10" : undefined,
      decisionDate: seed >= 8 ? "2025-04-25" : undefined,
      reason: "Comparable sales in neighborhood show lower market values",
      timeline: [
        { date: "2025-02-15", status: "submitted", note: "Appeal filed online", actor: "Property Owner" },
        { date: "2025-02-18", status: "under_review", note: "Assigned to reviewer", actor: "Assessment Office" },
        ...(seed >= 7 ? [{
          date: "2025-03-20",
          status: "hearing_scheduled" as AppealStatus,
          note: "Hearing scheduled for April 10, 2025",
          actor: "Board of Equalization",
        }] : []),
        ...(seed >= 8 ? [
          { date: "2025-04-10", status: "hearing_complete" as AppealStatus, note: "Hearing conducted", actor: "Board of Equalization" },
          { date: "2025-04-25", status: "decided" as AppealStatus, note: "Partial reduction granted - $20,000", actor: "Board of Equalization" },
        ] : []),
      ],
    });
  }
  
  if (seed >= 9) {
    appeals.push({
      id: `${propertyId}-appeal-2`,
      caseNumber: `AP-2024-${2000 + seed * 45}`,
      taxYear: 2024,
      originalValue: 275000,
      contestedValue: 275000,
      requestedValue: 240000,
      status: "decided",
      decision: "denied",
      finalValue: 275000,
      filingDate: "2024-02-10",
      hearingDate: "2024-04-05",
      decisionDate: "2024-04-20",
      reason: "Property condition issues not reflected in assessment",
      timeline: [
        { date: "2024-02-10", status: "submitted", note: "Appeal filed", actor: "Property Owner" },
        { date: "2024-02-15", status: "under_review", note: "Under review", actor: "Assessment Office" },
        { date: "2024-03-10", status: "hearing_scheduled", note: "Hearing scheduled", actor: "Board of Equalization" },
        { date: "2024-04-05", status: "hearing_complete", note: "Hearing conducted", actor: "Board of Equalization" },
        { date: "2024-04-20", status: "decided", note: "Appeal denied - insufficient evidence", actor: "Board of Equalization" },
      ],
    });
  }
  
  return appeals;
}

interface AppealStatusTrackerProps {
  propertyId: string;
  currentAssessedValue?: number;
}

export function AppealStatusTracker({ propertyId, currentAssessedValue = 285000 }: AppealStatusTrackerProps) {
  const [appeals] = useState<Appeal[]>(() => generateMockAppeals(propertyId));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewAppeal, setShowNewAppeal] = useState(false);

  const activeAppeals = appeals.filter((a) => a.status !== "decided" && a.status !== "withdrawn");
  const hasActiveAppeal = activeAppeals.length > 0;

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            hasActiveAppeal ? "bg-[hsl(var(--warning))]/10" : "bg-muted"
          )}>
            <Scale className={cn(
              "h-4 w-4",
              hasActiveAppeal ? "text-[hsl(var(--warning))]" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Assessment Appeals</h3>
            <p className="text-[10px] text-muted-foreground">
              {hasActiveAppeal
                ? `${activeAppeals.length} active appeal${activeAppeals.length > 1 ? "s" : ""}`
                : "No active appeals"}
            </p>
          </div>
        </div>
        {!hasActiveAppeal && (
          <button
            onClick={() => setShowNewAppeal(!showNewAppeal)}
            className="flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            File Appeal
          </button>
        )}
      </div>

      {/* New Appeal Form (simplified) */}
      {showNewAppeal && (
        <div className="border-b border-border bg-muted/30 p-4">
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-[hsl(var(--warning))]" />
                <span>Appeals must be filed within 60 days of assessment notice.</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Current Value
                </label>
                <p className="text-sm font-semibold text-foreground">
                  ${formatNumber(currentAssessedValue)}
                </p>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Requested Value
                </label>
                <input
                  type="number"
                  placeholder="Enter amount"
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Reason for Appeal
              </label>
              <textarea
                rows={2}
                placeholder="Describe why you believe the assessment is incorrect..."
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewAppeal(false)}
                className="h-7 rounded-md border border-border px-3 text-[10px] font-medium text-muted-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button className="h-7 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground hover:bg-primary/90">
                Submit Appeal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appeals List */}
      <div className="divide-y divide-border">
        {appeals.length === 0 ? (
          <div className="p-6 text-center">
            <Scale className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-xs text-muted-foreground">No appeals on record</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Property owners may appeal their assessment within 60 days of notice.
            </p>
          </div>
        ) : (
          appeals.map((appeal) => {
            const statusConfig = STATUS_CONFIG[appeal.status];
            const decisionConfig = DECISION_CONFIG[appeal.decision];
            const DecisionIcon = decisionConfig.icon;
            const isExpanded = expandedId === appeal.id;
            const currentStepIndex = STATUS_STEPS.indexOf(appeal.status);
            const savings = appeal.finalValue
              ? appeal.originalValue - appeal.finalValue
              : appeal.originalValue - appeal.requestedValue;

            return (
              <div key={appeal.id} className="p-4">
                {/* Appeal Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : appeal.id)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", statusConfig.bgColor)}>
                    <Scale className={cn("h-4 w-4", statusConfig.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">
                        {appeal.caseNumber}
                      </span>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-medium", statusConfig.bgColor, statusConfig.color)}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Tax Year {appeal.taxYear} • Filed {new Date(appeal.filingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {appeal.decision !== "pending" ? (
                      <div className={cn("flex items-center gap-1 text-[10px] font-medium", decisionConfig.color)}>
                        <DecisionIcon className="h-3 w-3" />
                        {decisionConfig.label}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        In Progress
                      </div>
                    )}
                    {savings > 0 && appeal.decision !== "denied" && (
                      <p className="text-[9px] text-[hsl(var(--success))]">
                        {appeal.finalValue ? "Saved" : "Potential"}: ${formatNumber(savings)}
                      </p>
                    )}
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 ml-11 space-y-4">
                    {/* Progress Steps */}
                    <div className="relative">
                      <div className="absolute left-0 top-3 h-0.5 w-full bg-border" />
                      <div
                        className="absolute left-0 top-3 h-0.5 bg-primary transition-all"
                        style={{
                          width: `${Math.max(0, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
                        }}
                      />
                      <div className="relative flex justify-between">
                        {STATUS_STEPS.map((step, i) => {
                          const isComplete = i <= currentStepIndex;
                          const isCurrent = i === currentStepIndex;
                          return (
                            <div key={step} className="flex flex-col items-center">
                              <div
                                className={cn(
                                  "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-bold",
                                  isComplete
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-muted-foreground"
                                )}
                              >
                                {isComplete ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                              </div>
                              <span
                                className={cn(
                                  "mt-1 text-[8px]",
                                  isCurrent ? "font-medium text-primary" : "text-muted-foreground"
                                )}
                              >
                                {STATUS_CONFIG[step].label.split(" ")[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Value Summary */}
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/30 p-3">
                      <div className="text-center">
                        <p className="text-[9px] text-muted-foreground">Original</p>
                        <p className="text-xs font-semibold text-foreground">
                          ${formatNumber(appeal.originalValue)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-muted-foreground">Requested</p>
                        <p className="text-xs font-semibold text-primary">
                          ${formatNumber(appeal.requestedValue)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-muted-foreground">
                          {appeal.finalValue ? "Final" : "Reduction"}
                        </p>
                        <p
                          className={cn(
                            "text-xs font-semibold",
                            appeal.finalValue
                              ? appeal.finalValue < appeal.originalValue
                                ? "text-[hsl(var(--success))]"
                                : "text-foreground"
                              : "text-[hsl(var(--success))]"
                          )}
                        >
                          {appeal.finalValue
                            ? `$${formatNumber(appeal.finalValue)}`
                            : `-$${formatNumber(appeal.originalValue - appeal.requestedValue)}`}
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-[10px] font-medium text-muted-foreground">Reason for Appeal</p>
                      <p className="mt-1 text-xs text-foreground">{appeal.reason}</p>
                    </div>

                    {/* Timeline */}
                    <div>
                      <p className="mb-2 text-[10px] font-medium text-muted-foreground">Activity Timeline</p>
                      <div className="space-y-2">
                        {appeal.timeline.map((event, i) => (
                          <div key={i} className="flex gap-2">
                            <div className="flex flex-col items-center">
                              <div className="h-2 w-2 rounded-full bg-primary" />
                              {i < appeal.timeline.length - 1 && (
                                <div className="h-full w-px bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-foreground">
                                  {event.note}
                                </span>
                              </div>
                              <p className="text-[9px] text-muted-foreground">
                                {new Date(event.date).toLocaleDateString()} • {event.actor}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {appeal.status !== "decided" && appeal.status !== "withdrawn" && (
                      <div className="flex gap-2">
                        <button className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md border border-border text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                          <Upload className="h-3 w-3" />
                          Upload Documents
                        </button>
                        <button className="flex h-7 flex-1 items-center justify-center gap-1 rounded-md border border-border text-[10px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
                          <MessageSquare className="h-3 w-3" />
                          Add Comment
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
