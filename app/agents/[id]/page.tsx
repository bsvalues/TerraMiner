"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { AGENTS } from "@/lib/mock-data";
import { cn, formatNumber } from "@/lib/utils";
import {
  Bot,
  CheckCircle2,
  Clock,
  Zap,
  AlertTriangle,
  TrendingUp,
  Activity,
  Database,
  ChevronRight,
  Scale,
  MapPin,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TaskEntry {
  id: string;
  action: string;
  status: string;
  duration_ms: number;
  created_at: string;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;

  const { data, isLoading } = useSWR<{
    agent: Record<string, unknown>;
    taskHistory: TaskEntry[];
    source: string;
  }>(`/api/agents/${agentId}`, fetcher, { revalidateOnFocus: false });

  // Use API agent data merged with local mock for full fields
  const mockAgent = AGENTS.find((a) => a.id === agentId);
  const agent = mockAgent
    ? { ...mockAgent, ...(data?.agent || {}) }
    : data?.agent;

  const isFromDB = data?.source === "database";
  const taskHistory = data?.taskHistory ?? [];

  if (!isLoading && !agent) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-8 w-8 text-[hsl(var(--warning))]" />
        <p className="text-sm text-muted-foreground">Agent not found</p>
        <Link href="/agents" className="text-xs text-primary hover:underline">
          Back to Agent Roster
        </Link>
      </div>
    );
  }

  if (isLoading || !agent) {
    return (
      <div className="grid-bg min-h-full px-6 py-6">
        <div className="flex flex-col gap-6">
          <div className="h-4 w-24 animate-pulse rounded bg-secondary/50" />
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 animate-pulse rounded-xl bg-secondary/50" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 animate-pulse rounded bg-secondary/50" />
              <div className="h-3 w-64 animate-pulse rounded bg-secondary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const successRate = taskHistory.length > 0
    ? Math.round((taskHistory.filter((t) => t.status === "completed").length / taskHistory.length) * 100)
    : 87;
  const avgDuration = taskHistory.length > 0
    ? Math.round(taskHistory.reduce((sum, t) => sum + t.duration_ms, 0) / taskHistory.length)
    : 0;

  return (
    <div className="grid-bg min-h-full px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back link + header */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <nav className="flex items-center gap-1 text-[11px] text-muted-foreground" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-foreground">Dashboard</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/agents" className="hover:text-foreground">Agents</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{mockAgent?.name || "Agent"}</span>
            </nav>
            {isFromDB && (
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
                <Database className="h-3 w-3" /> PostgreSQL
              </span>
            )}
          </div>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
                mockAgent?.status === "active"
                  ? "bg-primary/10 agent-active"
                  : "bg-secondary/30"
              )}
            >
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">
                {mockAgent?.name || String(agent.name || "Agent")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {mockAgent?.description || String(agent.description || "")}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    mockAgent?.status === "active"
                      ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    mockAgent?.status === "active" ? "bg-[hsl(var(--success))]" : "bg-muted-foreground"
                  )} />
                  {mockAgent?.status || "idle"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Type: {(mockAgent?.type || "").replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance metrics */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tasks Done</p>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{formatNumber(mockAgent?.tasksCompleted ?? 0)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg Response</p>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              {avgDuration > 0 ? `${avgDuration}ms` : `${mockAgent?.avgResponseTime ?? 0}ms`}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Success Rate</p>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{successRate}%</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-foreground" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">History</p>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{taskHistory.length} tasks</p>
          </div>
        </div>

        {/* Capabilities */}
        {mockAgent?.capabilities && (
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Zap className="h-4 w-4 text-primary" /> Capabilities
            </h3>
            <div className="flex flex-wrap gap-2">
              {mockAgent.capabilities.map((cap) => (
                <span
                  key={cap}
                  className="rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Assessment Capabilities (for market_analyzer) */}
        {mockAgent?.type === "market_analyzer" && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Scale className="h-4 w-4 text-primary" /> Assessment Capabilities
              <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">Benton Method</span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-md border border-border/50 bg-background/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--success))]/10">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">IAAO Ratio Study</p>
                  <p className="text-[10px] text-muted-foreground">Compute COD, PRD, PRB metrics with compliance checks</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-border/50 bg-background/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Vertical Equity</p>
                  <p className="text-[10px] text-muted-foreground">Analyze assessment fairness across value ranges</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-border/50 bg-background/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--warning))]/10">
                  <MapPin className="h-4 w-4 text-[hsl(var(--warning))]" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Neighborhood Analysis</p>
                  <p className="text-[10px] text-muted-foreground">Compare ratio metrics by geographic area</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-md border border-border/50 bg-background/50 p-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Outlier Detection</p>
                  <p className="text-[10px] text-muted-foreground">Flag over/under-assessed properties for review</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task history */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" /> Recent Task History
            {isFromDB && (
              <span className="ml-auto text-[9px] font-normal text-muted-foreground">from database</span>
            )}
          </h3>
          {taskHistory.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No task history yet</p>
          ) : (
            <div className="flex flex-col gap-0">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_80px_100px] gap-4 border-b border-border pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <span>Task</span>
                <span>Status</span>
                <span>Duration</span>
                <span className="text-right">Time</span>
              </div>
              {taskHistory.map((task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-[1fr_80px_80px_100px] gap-4 border-b border-border/50 py-2.5 text-xs last:border-0"
                >
                  <span className="truncate text-foreground">{task.action}</span>
                  <span
                    className={cn(
                      "font-medium",
                      task.status === "completed"
                        ? "text-[hsl(var(--success))]"
                        : "text-destructive"
                    )}
                  >
                    {task.status}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {(task.duration_ms / 1000).toFixed(1)}s
                  </span>
                  <span className="text-right text-muted-foreground">
                    {formatTimeAgo(task.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
