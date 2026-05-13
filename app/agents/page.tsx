"use client";

import useSWR from "swr";
import { AGENTS } from "@/lib/mock-data";
import type { Agent } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import Link from "next/link";
import { Bot, Zap, Clock, CheckCircle2, ArrowRight, Database } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TYPE_COLORS: Record<string, string> = {
  market_analyzer: "text-primary",
  nl_search: "text-[hsl(var(--success))]",
  recommendation: "text-[hsl(var(--warning))]",
  text_summarizer: "text-foreground",
};

export default function AgentsPage() {
  const { data, isLoading } = useSWR<{
    agents: Agent[];
    source: string;
    active: number;
  }>("/api/agents", fetcher, { revalidateOnFocus: false });

  const agents = data?.agents ?? AGENTS;
  const isFromDB = data?.source === "database";
  const activeCount = data?.active ?? agents.filter((a) => a.status === "active").length;

  const totalTasks = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const avgResponse = Math.round(
    agents.reduce((sum, a) => sum + a.avgResponseTime, 0) / agents.length
  );

  return (
    <div className="grid-bg min-h-full px-6 py-6">
      <div className="flex flex-col gap-6">
        {/* Roster summary */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Agent Roster</h2>
          {isFromDB && (
            <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
              <Database className="h-3 w-3" /> PostgreSQL
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Total Agents</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{agents.length}</p>
            <p className="text-xs text-muted-foreground">{activeCount} active</p>
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
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border bg-card p-5">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-secondary/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-secondary/50" />
                    <div className="h-3 w-20 rounded bg-secondary/30" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {agents.map((agent) => (
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
        )}
      </div>
    </div>
  );
}
