"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  Calendar,
  Flag,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkItem {
  id: string;
  title: string;
  description: string;
  type: "review" | "inspection" | "appeal" | "report" | "data_entry" | "approval";
  priority: "urgent" | "high" | "medium" | "low";
  assignee: string;
  dueDate: string;
  status: "pending" | "in_progress" | "blocked";
  propertyAddress?: string;
  link: string;
}

interface Deadline {
  id: string;
  title: string;
  date: string;
  daysUntil: number;
  type: "statutory" | "operational" | "reporting";
  description: string;
  critical: boolean;
}

const WORK_ITEMS: WorkItem[] = [
  {
    id: "wq-1",
    title: "Review flagged sales ratios",
    description: "3 properties outside IAAO threshold",
    type: "review",
    priority: "urgent",
    assignee: "Sarah Chen",
    dueDate: "2026-05-14",
    status: "pending",
    link: "/assessment",
  },
  {
    id: "wq-2",
    title: "Complete field inspection",
    description: "New construction verification",
    type: "inspection",
    priority: "high",
    assignee: "James Wilson",
    dueDate: "2026-05-15",
    status: "in_progress",
    propertyAddress: "1425 Columbia Park Trail",
    link: "/audit",
  },
  {
    id: "wq-3",
    title: "Appeal hearing preparation",
    description: "Gather comparable sales for hearing",
    type: "appeal",
    priority: "high",
    assignee: "Mike Rodriguez",
    dueDate: "2026-05-16",
    status: "pending",
    propertyAddress: "2890 Bombing Range Rd",
    link: "/assessment",
  },
  {
    id: "wq-4",
    title: "Generate Q2 ratio study report",
    description: "Quarterly IAAO compliance report",
    type: "report",
    priority: "medium",
    assignee: "Lisa Park",
    dueDate: "2026-05-20",
    status: "pending",
    link: "/reports",
  },
  {
    id: "wq-5",
    title: "Approve exemption applications",
    description: "12 pending senior exemptions",
    type: "approval",
    priority: "medium",
    assignee: "Sarah Chen",
    dueDate: "2026-05-18",
    status: "blocked",
    link: "/notifications",
  },
];

const DEADLINES: Deadline[] = [
  {
    id: "dl-1",
    title: "Assessment Roll Certification",
    date: "2026-06-01",
    daysUntil: 18,
    type: "statutory",
    description: "Certify 2026 assessment roll to county treasurer",
    critical: true,
  },
  {
    id: "dl-2",
    title: "Appeal Filing Window Closes",
    date: "2026-06-15",
    daysUntil: 32,
    type: "statutory",
    description: "60-day appeal window for 2026 assessments",
    critical: true,
  },
  {
    id: "dl-3",
    title: "Q2 IAAO Report Due",
    date: "2026-05-31",
    daysUntil: 17,
    type: "reporting",
    description: "Quarterly ratio study and equity analysis",
    critical: false,
  },
  {
    id: "dl-4",
    title: "Exemption Renewal Notices",
    date: "2026-07-01",
    daysUntil: 48,
    type: "operational",
    description: "Mail renewal notices for expiring exemptions",
    critical: false,
  },
];

const TYPE_LABELS: Record<WorkItem["type"], string> = {
  review: "Review",
  inspection: "Inspection",
  appeal: "Appeal",
  report: "Report",
  data_entry: "Data Entry",
  approval: "Approval",
};

const PRIORITY_STYLES: Record<WorkItem["priority"], string> = {
  urgent: "text-destructive",
  high: "text-amber-500",
  medium: "text-primary",
  low: "text-muted-foreground",
};

const STATUS_STYLES: Record<WorkItem["status"], { label: string; class: string }> = {
  pending: { label: "Pending", class: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", class: "bg-primary/15 text-primary" },
  blocked: { label: "Blocked", class: "bg-destructive/15 text-destructive" },
};

export function WorkflowQueue({ className }: { className?: string }) {
  const [filter, setFilter] = useState<"all" | "urgent" | "my">("all");

  const filtered = WORK_ITEMS.filter((item) => {
    if (filter === "urgent") return item.priority === "urgent" || item.priority === "high";
    if (filter === "my") return item.assignee === "Sarah Chen";
    return true;
  });

  return (
    <div className={cn("grid gap-3 lg:grid-cols-5", className)}>
      {/* Work Queue (3 cols) */}
      <div className="rounded-lg border border-border bg-card lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Work Queue</h3>
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
              {WORK_ITEMS.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {(["all", "urgent", "my"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {f === "all" ? "All" : f === "urgent" ? "Urgent" : "My Tasks"}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border">
          {filtered.map((item) => (
            <Link
              key={item.id}
              href={item.link}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
            >
              <Flag className={cn("h-3.5 w-3.5 shrink-0", PRIORITY_STYLES[item.priority])} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs font-medium text-foreground">{item.title}</p>
                  <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium", STATUS_STYLES[item.status].class)}>
                    {STATUS_STYLES[item.status].label}
                  </span>
                </div>
                <p className="truncate text-[10px] text-muted-foreground">
                  {item.description}
                  {item.propertyAddress && ` - ${item.propertyAddress}`}
                </p>
              </div>
              <div className="hidden shrink-0 items-center gap-3 text-[10px] text-muted-foreground sm:flex">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.assignee.split(" ")[0]}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Deadlines (2 cols) */}
      <div className="rounded-lg border border-border bg-card lg:col-span-2">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">Upcoming Deadlines</h3>
          </div>
        </div>

        <div className="divide-y divide-border">
          {DEADLINES.map((deadline) => (
            <div key={deadline.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground">{deadline.title}</p>
                    {deadline.critical && (
                      <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{deadline.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={cn(
                    "text-xs font-bold",
                    deadline.daysUntil <= 14 ? "text-destructive" : deadline.daysUntil <= 30 ? "text-amber-500" : "text-muted-foreground"
                  )}>
                    {deadline.daysUntil}d
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {new Date(deadline.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              {/* Progress bar for time remaining */}
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    deadline.daysUntil <= 14 ? "bg-destructive" : deadline.daysUntil <= 30 ? "bg-amber-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.max(5, 100 - (deadline.daysUntil / 60) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-4 py-2">
          <Link href="/reports" className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline">
            View all deadlines <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
