"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Terminal, Send, RotateCcw, Loader2 } from "lucide-react";

interface CommandInputProps {
  onSubmit: (query: string) => void;
  isExecuting: boolean;
  onReset?: () => void;
}

const EXAMPLE_QUERIES = [
  "Analyze investment opportunities in Richland WA under $400k",
  "Find 3BR homes near PNNL with good rental yield",
  "Compare market trends across the Tri-Cities",
  "Recommend top properties for first-time investors",
];

export function CommandInput({
  onSubmit,
  isExecuting,
  onReset,
}: CommandInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = query.trim();
    if (trimmed && !isExecuting) {
      onSubmit(trimmed);
      setQuery("");
    }
  }, [query, isExecuting, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Terminal className="h-4 w-4 shrink-0 text-primary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a query for the agent swarm..."
          disabled={isExecuting}
          className="flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Swarm command input"
        />
        {isExecuting && onReset ? (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isExecuting}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              query.trim() && !isExecuting
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isExecuting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
            Execute
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            onClick={() => {
              if (!isExecuting) {
                setQuery(example);
              }
            }}
            disabled={isExecuting}
            className="rounded-md border border-border bg-card/50 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
