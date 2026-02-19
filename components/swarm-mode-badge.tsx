"use client";

import { cn } from "@/lib/utils";
import type { SwarmMode } from "@/lib/types";
import { Zap, User } from "lucide-react";

interface SwarmModeBadgeProps {
  mode: SwarmMode;
  onToggle: () => void;
  isExecuting?: boolean;
}

export function SwarmModeBadge({ mode, onToggle, isExecuting }: SwarmModeBadgeProps) {
  const isSwarm = mode === "ralph-wiggum";

  return (
    <button
      onClick={onToggle}
      disabled={isExecuting}
      className={cn(
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-300",
        isSwarm
          ? "border-primary/50 bg-primary/10 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
        isExecuting && "cursor-not-allowed opacity-60"
      )}
      aria-label={`Switch to ${isSwarm ? "single agent" : "Ralph Wiggum"} mode`}
    >
      {isSwarm ? (
        <>
          <Zap className="h-3 w-3" />
          <span>Ralph Wiggum Mode</span>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[9px]">
            4
          </span>
        </>
      ) : (
        <>
          <User className="h-3 w-3" />
          <span>Single Agent</span>
        </>
      )}
    </button>
  );
}
