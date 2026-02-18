"use client";

import { cn } from "@/lib/utils";
import type { Agent } from "@/lib/types";
import {
  TrendingUp,
  Search,
  Star,
  FileText,
  Loader2,
} from "lucide-react";

const AGENT_ICONS: Record<string, typeof TrendingUp> = {
  market_analyzer: TrendingUp,
  nl_search: Search,
  recommendation: Star,
  text_summarizer: FileText,
};

const STATUS_STYLES: Record<string, { dot: string; label: string; bg: string }> = {
  active: {
    dot: "bg-[hsl(var(--success))]",
    label: "Active",
    bg: "border-[hsl(var(--success))]/30",
  },
  idle: {
    dot: "bg-muted-foreground",
    label: "Idle",
    bg: "border-border",
  },
  processing: {
    dot: "bg-[hsl(var(--warning))]",
    label: "Processing",
    bg: "border-[hsl(var(--warning))]/30",
  },
  error: {
    dot: "bg-destructive",
    label: "Error",
    bg: "border-destructive/30",
  },
  offline: {
    dot: "bg-muted-foreground/50",
    label: "Offline",
    bg: "border-border",
  },
};

interface AgentCardProps {
  agent: Agent;
  isSwarmActive?: boolean;
}

export function AgentCard({ agent, isSwarmActive }: AgentCardProps) {
  const Icon = AGENT_ICONS[agent.type] || FileText;
  const statusStyle = STATUS_STYLES[agent.status] || STATUS_STYLES.idle;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-all duration-300",
        statusStyle.bg,
        agent.status === "active" && "agent-active",
        isSwarmActive && agent.status === "active" && "ring-1 ring-primary/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {agent.name}
            </h3>
            <p className="font-mono text-xs text-muted-foreground">
              {agent.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              statusStyle.dot,
              agent.status === "active" && "animate-pulse"
            )}
          />
          <span className="text-xs text-muted-foreground">
            {statusStyle.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
        {agent.description}
      </p>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1">
        {agent.capabilities.slice(0, 3).map((cap) => (
          <span
            key={cap}
            className="rounded-sm bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
          >
            {cap}
          </span>
        ))}
        {agent.capabilities.length > 3 && (
          <span className="rounded-sm bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            +{agent.capabilities.length - 3}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 border-t border-border pt-3">
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {agent.tasksCompleted.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-foreground">completed</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {(agent.avgResponseTime / 1000).toFixed(1)}s
          </span>
          <span className="text-[10px] text-muted-foreground">avg time</span>
        </div>
      </div>

      {/* Processing overlay */}
      {agent.status === "processing" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-xs font-medium text-primary">
              {agent.currentTask || "Processing..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
