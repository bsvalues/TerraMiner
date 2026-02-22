"use client";

import { cn } from "@/lib/utils";
import type { SwarmTask } from "@/lib/types";
import { formatDuration } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  GitBranch,
  Merge,
} from "lucide-react";

interface SwarmVisualizerProps {
  task: SwarmTask | null;
}

const STATUS_ICON = {
  queued: Circle,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

const STATUS_COLOR = {
  queued: "text-muted-foreground",
  running: "text-primary",
  completed: "text-[hsl(var(--success))]",
  failed: "text-destructive",
};

export function SwarmVisualizer({ task }: SwarmVisualizerProps) {
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/50 py-12" role="region" aria-label="Swarm task visualizer">
        <GitBranch className="h-8 w-8 text-muted-foreground/40" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            No active swarm task
          </p>
          <p className="text-xs text-muted-foreground/60">
            Submit a query to see task decomposition
          </p>
        </div>
      </div>
    );
  }

  const completedCount = task.subtasks.filter(
    (s) => s.status === "completed"
  ).length;
  const totalCount = task.subtasks.length;
  const overallProgress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      {/* Task header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Task Decomposition
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                task.status === "completed"
                  ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                  : task.status === "failed"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary"
              )}
            >
              {task.status}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {task.query}
          </p>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
      </div>

      {/* Overall progress */}
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              task.status === "completed"
                ? "bg-[hsl(var(--success))]"
                : task.status === "failed"
                  ? "bg-destructive"
                  : "bg-primary"
            )}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Subtask list */}
      <div className="flex flex-col gap-2">
        {task.subtasks.map((subtask, index) => {
          const StatusIcon = STATUS_ICON[subtask.status];
          const statusColor = STATUS_COLOR[subtask.status];

          return (
            <div
              key={subtask.id}
              className={cn(
                "flex items-center gap-3 rounded-md border border-border/50 bg-background/50 px-3 py-2.5 transition-all duration-300",
                subtask.status === "running" && "border-primary/30 bg-primary/5",
                subtask.status === "completed" && "opacity-80"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Status icon */}
              <StatusIcon
                className={cn(
                  "h-4 w-4 shrink-0",
                  statusColor,
                  subtask.status === "running" && "animate-spin"
                )}
              />

              {/* Task info */}
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {subtask.agentName}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {subtask.action}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {subtask.description}
                </span>
              </div>

              {/* Progress / Duration */}
              <div className="shrink-0 text-right">
                {subtask.status === "running" && (
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500 progress-animated"
                        style={{ width: `${subtask.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-primary">
                      {subtask.progress}%
                    </span>
                  </div>
                )}
                {subtask.status === "completed" && subtask.duration && (
                  <span className="font-mono text-[10px] text-[hsl(var(--success))]">
                    {formatDuration(subtask.duration)}
                  </span>
                )}
                {subtask.status === "queued" && (
                  <span className="font-mono text-[10px] text-muted-foreground">
                    queued
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Synthesis indicator */}
      {task.status === "completed" && task.synthesizedResult && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Merge className="h-3.5 w-3.5 text-[hsl(var(--success))]" />
            <span className="text-xs font-semibold text-foreground">
              Synthesized Result
            </span>
            {task.totalDuration && (
              <span className="font-mono text-[10px] text-muted-foreground">
                Total: {formatDuration(task.totalDuration)}
              </span>
            )}
          </div>
          <p className="rounded-md bg-background/50 p-3 text-xs leading-relaxed text-foreground/90">
            {task.synthesizedResult}
          </p>
        </div>
      )}
    </div>
  );
}
