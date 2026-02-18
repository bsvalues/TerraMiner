"use client";

import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/utils";
import type { ActivityLogEntry } from "@/lib/types";
import { ScrollText } from "lucide-react";

interface ActivityLogProps {
  entries: ActivityLogEntry[];
}

const SEVERITY_STYLES: Record<string, string> = {
  info: "text-primary",
  success: "text-[hsl(var(--success))]",
  warning: "text-[hsl(var(--warning))]",
  error: "text-destructive",
};

const SEVERITY_DOT: Record<string, string> = {
  info: "bg-primary",
  success: "bg-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]",
  error: "bg-destructive",
};

export function ActivityLog({ entries }: ActivityLogProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          Activity Log
        </h3>
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {entries.length}
        </span>
      </div>
      <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto rounded-lg border border-border bg-card">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 border-b border-border/50 px-3 py-2 last:border-0"
          >
            <span
              className={cn(
                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                SEVERITY_DOT[entry.severity]
              )}
            />
            <div className="flex flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                {entry.agent && (
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      SEVERITY_STYLES[entry.severity]
                    )}
                  >
                    {entry.agent}
                  </span>
                )}
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {formatTimestamp(new Date(entry.timestamp))}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{entry.message}</p>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No activity recorded
          </div>
        )}
      </div>
    </div>
  );
}
