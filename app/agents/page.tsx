"use client";

import { AGENTS } from "@/lib/mock-data";
import { cn, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { Bot, Zap, Clock, CheckCircle2, ArrowRight } from "lucide-react";

const TYPE_COLORS: Record<string, string> = {
  market_analyzer: "text-primary",
  nl_search: "text-[hsl(var(--success))]",
  recommendation: "text-[hsl(var(--warning))]",
  text_summarizer: "text-foreground",
};

export default function AgentsPage() {
  const totalTasks = AGENTS.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const avgResponse = Math.round(
    AGENTS.reduce((sum, a) => sum + a.avgResponseTime, 0) / AGENTS.length
  );

  return (
    <div className="grid-bg min-h-full px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Roster summary -- the summary is a tiny book about robots */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Agents</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{AGENTS.length}</p>
            <p className="text-xs text-muted-foreground">{AGENTS.filter(a => a.status === "active").length} active</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Tasks Processed</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{formatNumber(totalTasks)}</p>
            <p className="text-xs text-muted-foreground">lifetime total</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Avg Response</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{avgResponse}ms</p>
            <p className="text-xs text-muted-foreground">across all agents</p>
          </div>
        </div>

        {/* Agent roster cards */}
        <div className="flex flex-col gap-4">
          {AGENTS.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:flex-row sm:items-center"
            >
              {/* Agent icon + status */}
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  agent.status === "active" ? "bg-primary/10 agent-active" : "bg-secondary/30"
                )}>
                  <Bot className={cn("h-6 w-6", TYPE_COLORS[agent.type])} />
                </div>
                <div className="sm:min-w-[180px]">
                  <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      agent.status === "active" ? "bg-[hsl(var(--success))]" : "bg-muted-foreground"
                    )} />
                    <span className="text-xs capitalize text-muted-foreground">{agent.status}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="flex-1 text-xs text-muted-foreground line-clamp-2">
                {agent.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{formatNumber(agent.tasksCompleted)} tasks</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{agent.avgResponseTime}ms avg</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  <span>{agent.capabilities.length} capabilities</span>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary sm:block" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
