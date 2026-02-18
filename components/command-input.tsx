"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Send, Loader2, RotateCcw } from "lucide-react";
import { EXAMPLE_QUERIES } from "@/lib/mock-data";

interface CommandInputProps {
  onSubmit: (query: string) => void;
  isExecuting: boolean;
  onReset?: () => void;
}

export function CommandInput({ onSubmit, isExecuting, onReset }: CommandInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = useCallback(() => {
    if (query.trim() && !isExecuting) {
      onSubmit(query.trim());
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
    <div className="flex flex-col gap-3">
      {/* Input area */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a query for the agent swarm..."
          disabled={isExecuting}
          className="flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Swarm command input"
        />
        <div className="flex items-center gap-1">
          {onReset && (
            <button
              onClick={onReset}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isExecuting}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-all",
              query.trim() && !isExecuting
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground"
            )}
            aria-label="Execute swarm task"
          >
            {isExecuting ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Executing</span>
              </>
            ) : (
              <>
                <Send className="h-3 w-3" />
                <span>Execute</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Example queries */}
      {!isExecuting && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_QUERIES.slice(0, 3).map((example) => (
            <button
              key={example}
              onClick={() => setQuery(example)}
              className="rounded-md border border-border bg-card/50 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
            >
              {example.length > 60 ? example.slice(0, 57) + "..." : example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
