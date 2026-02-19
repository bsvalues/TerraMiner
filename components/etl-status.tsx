"use client";

import { cn, formatNumber } from "@/lib/utils";
import type { ETLPipeline } from "@/lib/types";
import { Database, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ETLStatusProps {
  pipelines: ETLPipeline[];
}

const HEALTH_STYLES: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  healthy: {
    icon: CheckCircle2,
    color: "text-[hsl(var(--success))]",
    bg: "bg-[hsl(var(--success))]/10",
  },
  degraded: {
    icon: AlertTriangle,
    color: "text-[hsl(var(--warning))]",
    bg: "bg-[hsl(var(--warning))]/10",
  },
  down: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
};

function formatRunTime(isoString: string): string {
  const d = new Date(isoString);
  const h = String(d.getUTCHours()).padStart(2, "0");
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m} UTC`;
}

export function ETLStatus({ pipelines }: ETLStatusProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          ETL Pipeline Health
        </h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {pipelines.map((pipeline) => {
          const style = HEALTH_STYLES[pipeline.status] || HEALTH_STYLES.healthy;
          const StatusIcon = style.icon;
          const completionRate =
            pipeline.recordsTotal > 0
              ? Math.round(
                  (pipeline.recordsProcessed / pipeline.recordsTotal) * 100
                )
              : 100;

          return (
            <div
              key={pipeline.id}
              className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {pipeline.displayName}
                </span>
                <div className={cn("flex items-center gap-1 rounded-full px-1.5 py-0.5", style.bg)}>
                  <StatusIcon className={cn("h-3 w-3", style.color)} />
                  <span className={cn("text-[10px] font-medium", style.color)}>
                    {pipeline.status}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex flex-col gap-1">
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      pipeline.status === "healthy"
                        ? "bg-[hsl(var(--success))]"
                        : pipeline.status === "degraded"
                          ? "bg-[hsl(var(--warning))]"
                          : "bg-destructive"
                    )}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {formatNumber(pipeline.recordsProcessed)} /{" "}
                    {formatNumber(pipeline.recordsTotal)}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {completionRate}%
                  </span>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  <span>{formatRunTime(pipeline.lastRun)}</span>
                </div>
                {pipeline.errorRate > 1 && (
                  <span className="text-[hsl(var(--warning))]">
                    {pipeline.errorRate.toFixed(1)}% errors
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
