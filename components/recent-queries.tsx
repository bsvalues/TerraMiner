"use client";

import useSWR from "swr";
import { History, Clock, Bot, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ActivityEntry {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity?: string;
}

export function RecentQueries() {
  const { data } = useSWR<{ entries: ActivityEntry[]; source: string }>(
    "/api/activity",
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  // Filter for swarm-completed entries from the DB
  // The swarm execute API logs with type "task" and message:
  //   Swarm completed: "query text" (N subtasks)
  const swarmEntries =
    data?.entries
      ?.filter(
        (e) =>
          e.message.includes("Swarm completed") ||
          e.message.includes("decomposed into")
      )
      .slice(0, 6) ?? [];

  // Parse query objects from activity entries
  const queries: Array<{
    query: string;
    timestamp: string;
    subtaskCount: number;
    status: "completed" | "running";
  }> = [];

  for (const entry of swarmEntries) {
    // Match: Swarm completed: "query text" (N subtasks)
    const completedMatch = entry.message.match(
      /Swarm completed:\s*"([^"]+)"\s*\((\d+)\s*subtasks?\)/
    );
    if (completedMatch) {
      queries.push({
        query: completedMatch[1].replace(/\.{3}$/, ""),
        timestamp: entry.timestamp,
        subtaskCount: parseInt(completedMatch[2], 10),
        status: "completed",
      });
      continue;
    }

    // Fallback: Task decomposed into N subtask(s): "query..."
    const decomposedMatch = entry.message.match(
      /decomposed into (\d+) subtasks?:\s*"([^"]+)/
    );
    if (decomposedMatch) {
      queries.push({
        query: decomposedMatch[2].replace(/\.{3}$/, ""),
        timestamp: entry.timestamp,
        subtaskCount: parseInt(decomposedMatch[1], 10),
        status: "completed",
      });
    }
  }

  if (queries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <History className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Recent Queries
        </h2>
        <span className="text-[10px] text-muted-foreground">
          {queries.length} recent
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {queries.slice(0, 3).map((q, i) => (
          <button
            key={i}
            onClick={() => {
              const input = document.querySelector<HTMLInputElement>(
                'input[placeholder*="swarm"]'
              );
              if (input) {
                input.value = q.query;
                input.focus();
                input.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }}
            className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary">
                {q.query}
              </p>
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Bot className="h-2.5 w-2.5" />
                {q.subtaskCount} agents
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {formatDistanceToNow(q.timestamp)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
