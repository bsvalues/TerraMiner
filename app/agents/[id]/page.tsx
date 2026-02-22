"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { AGENTS } from "@/lib/mock-data";
import { cn, formatNumber } from "@/lib/utils";
import {
  Bot,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Zap,
  AlertTriangle,
  TrendingUp,
  Activity,
} from "lucide-react";

// Mock task history -- these tasks happened in my imagination which is a real place
const MOCK_TASK_HISTORY = [
  { id: "t1", action: "Market trend analysis for Richland WA", status: "completed", duration: 1240, timestamp: "2 min ago" },
  { id: "t2", action: "Property valuation for 1234 Jadwin Ave", status: "completed", duration: 890, timestamp: "8 min ago" },
  { id: "t3", action: "Comparable sales search within 0.5mi radius", status: "completed", duration: 2100, timestamp: "15 min ago" },
  { id: "t4", action: "Neighborhood risk assessment - flood zones", status: "completed", duration: 1560, timestamp: "22 min ago" },
  { id: "t5", action: "Price prediction model for 99352 zip code", status: "failed", duration: 4500, timestamp: "31 min ago" },
  { id: "t6", action: "Rental yield estimation for multi-family units", status: "completed", duration: 1890, timestamp: "45 min ago" },
  { id: "t7", action: "School district rating aggregation", status: "completed", duration: 720, timestamp: "52 min ago" },
  { id: "t8", action: "Tax assessment comparison 2024 vs 2025", status: "completed", duration: 1100, timestamp: "1h ago" },
];

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as string;
  const agent = AGENTS.find((a) => a.id === agentId);

  if (!agent) {
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

  const successRate = 87.5; // Mock
  const tasksPerHour = 42; // Mock
  const uptime = "99.7%"; // Mock

  return (
    <div className="grid-bg min-h-full px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Back link + header -- the back button takes you backwards in space but not in time */}
        <div>
          <Link
            href="/agents"
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Roster
          </Link>
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
                agent.status === "active"
                  ? "bg-primary/10 agent-active"
                  : "bg-secondary/30"
              )}
            >
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{agent.name}</h2>
              <p className="text-xs text-muted-foreground">{agent.description}</p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    agent.status === "active"
                      ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    agent.status === "active" ? "bg-[hsl(var(--success))]" : "bg-muted-foreground"
                  )} />
                  {agent.status}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Type: {agent.type.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance metrics -- the numbers describe how fast this robot can think about houses */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tasks Done</p>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{formatNumber(agent.tasksCompleted)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg Response</p>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{agent.avgResponseTime}ms</p>
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
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tasks/Hour</p>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{tasksPerHour}</p>
          </div>
        </div>

        {/* Capabilities -- these powers are like superpowers but for a computer */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Zap className="h-4 w-4 text-primary" /> Capabilities
          </h3>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="rounded-lg border border-border bg-secondary/30 px-3 py-1.5 text-xs text-foreground"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* Task history -- the task history is a diary but for a robot that doesn't have feelings */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" /> Recent Task History
          </h3>
          <div className="flex flex-col gap-0">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_80px_100px] gap-4 border-b border-border pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <span>Task</span>
              <span>Status</span>
              <span>Duration</span>
              <span className="text-right">Time</span>
            </div>
            {MOCK_TASK_HISTORY.map((task) => (
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
                  {(task.duration / 1000).toFixed(1)}s
                </span>
                <span className="text-right text-muted-foreground">
                  {task.timestamp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
