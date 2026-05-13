"use client";

import { useState, useCallback, useRef } from "react";
import useSWR from "swr";
import type { SwarmTask, SwarmMode, Agent, ActivityLogEntry, ETLPipeline } from "@/lib/types";
import {
  AGENTS,
  ETL_PIPELINES,
  SYSTEM_METRICS,
  INITIAL_ACTIVITY_LOG,
} from "@/lib/mock-data";
import {
  decomposeTask,
  createSwarmTask,
  getMockResult,
  getSimulatedDuration,
} from "@/lib/swarm-engine";
import { generateId, formatNumber } from "@/lib/utils";

import { MetricCard } from "@/components/metric-card";
import { AgentCard } from "@/components/agent-card";
import { SwarmModeBadge } from "@/components/swarm-mode-badge";
import { CommandInput } from "@/components/command-input";
import { RecentQueries } from "@/components/recent-queries";
import { SwarmVisualizer } from "@/components/swarm-visualizer";
import { ETLStatus } from "@/components/etl-status";
import { ActivityLog } from "@/components/activity-log";
import Link from "next/link";
import {
  Bot,
  Activity,
  Clock,
  Gauge,
  Zap,
  TrendingUp,
  DollarSign,
  MapPin,
} from "lucide-react";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function CloudCoachDashboard() {
  // SWR hooks -- fetch from PostgreSQL-backed APIs, fall back to mock data
  const { data: etlData } = useSWR<{ pipelines: ETLPipeline[] }>(
    "/api/etl/status",
    fetcher,
    { refreshInterval: 30000, fallbackData: { pipelines: ETL_PIPELINES } }
  );
  const { data: activityData } = useSWR<{ entries: ActivityLogEntry[] }>(
    "/api/activity",
    fetcher,
    { refreshInterval: 10000, fallbackData: { entries: INITIAL_ACTIVITY_LOG } }
  );
  const { data: rawMetrics } = useSWR<{
    source: string;
    metrics: Record<string, number>;
  }>("/api/system/metrics", fetcher, {
    refreshInterval: 15000,
  });

  const { data: topPicksData } = useSWR<{
    picks: Array<{
      id: string;
      address: string;
      city: string;
      price: number;
      beds: number;
      baths: number;
      sqft: number;
      score: { total_score: number; investment_grade: string; recommendation: string };
    }>;
  }>("/api/engine/top-picks", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: false,
  });

  // Unwrap the nested metrics object for easy access
  const metricsData = rawMetrics?.metrics;
  const dbSource = rawMetrics?.source;

  const livePipelines = etlData?.pipelines ?? ETL_PIPELINES;
  const liveActivity = activityData?.entries ?? INITIAL_ACTIVITY_LOG;

  const [swarmMode, setSwarmMode] = useState<SwarmMode>("ralph-wiggum");
  const [currentTask, setCurrentTask] = useState<SwarmTask | null>(null);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [isExecuting, setIsExecuting] = useState(false);
  const [localActivity, setLocalActivity] = useState<ActivityLogEntry[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const persistedRef = useRef(false);

  // Merge live DB activity with local session activity
  const activityLog = [...localActivity, ...liveActivity].slice(0, 50);

  const addLogEntry = useCallback(
    (
      type: ActivityLogEntry["type"],
      message: string,
      severity: ActivityLogEntry["severity"],
      agent: string | null = null
    ) => {
      setLocalActivity((prev) => [
        {
          id: generateId(),
          timestamp: new Date().toISOString(),
          type,
          agent,
          message,
          severity,
        },
        ...prev,
      ]);
    },
    []
  );

  const executeSwarmTask = useCallback(
    (query: string) => {
      // Clear any existing timeouts
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      persistedRef.current = false;

      setIsExecuting(true);

      // Step 1: Decompose the task
      const decomposed = decomposeTask(query, swarmMode);
      const task = createSwarmTask(query, swarmMode, decomposed);
      setCurrentTask(task);

      addLogEntry(
        "swarm_event",
        `Task decomposed into ${decomposed.length} subtask${decomposed.length > 1 ? "s" : ""}: "${query.slice(0, 80)}..."`,
        "info"
      );

      // Step 2: Start all subtasks (parallel execution)
      const startDelay = 500; // Delay before execution starts
      const t1 = setTimeout(() => {
        setCurrentTask((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: "executing",
            subtasks: prev.subtasks.map((s) => ({
              ...s,
              status: "running" as const,
              startedAt: new Date().toISOString(),
              progress: 0,
            })),
          };
        });

        // Update agents to show processing
        setAgents((prev) =>
          prev.map((a) => {
            const assigned = decomposed.find((d) => d.agentId === a.id);
            if (assigned) {
              return {
                ...a,
                status: "processing" as const,
                currentTask: assigned.action,
              };
            }
            return a;
          })
        );

        addLogEntry(
          "swarm_event",
          `Parallel execution started - ${decomposed.length} agents engaged`,
          "info"
        );

        // Step 3: Simulate progress updates for each subtask
        decomposed.forEach((d, index) => {
          const duration = getSimulatedDuration(d.agentType);
          const progressIntervals = 5;
          const intervalTime = duration / progressIntervals;

          // Progress ticks
          for (let tick = 1; tick <= progressIntervals; tick++) {
            const t = setTimeout(() => {
              const progress = Math.min(
                Math.round((tick / progressIntervals) * 100),
                99
              );
              setCurrentTask((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  subtasks: prev.subtasks.map((s, i) =>
                    i === index ? { ...s, progress } : s
                  ),
                };
              });
            }, intervalTime * tick);
            timeoutsRef.current.push(t);
          }

          // Completion -- generate result via engine
          const tComplete = setTimeout(() => {
            const result = getMockResult(d.action);

            setCurrentTask((prev) => {
              if (!prev) return prev;
              const updatedSubtasks = prev.subtasks.map((s, i) =>
                i === index
                  ? {
                      ...s,
                      status: "completed" as const,
                      progress: 100,
                      result,
                      completedAt: new Date().toISOString(),
                      duration,
                    }
                  : s
              );

              // Check if all subtasks are completed
              const allCompleted = updatedSubtasks.every(
                (s) => s.status === "completed"
              );

              if (allCompleted) {
                // Synthesize results
                const synthesized = updatedSubtasks
                  .map((s) => s.result)
                  .filter(Boolean)
                  .join(" | ");

                setIsExecuting(false);

                // Reset agents
                setAgents(AGENTS);

                addLogEntry(
                  "task_completed",
                  `Swarm task completed: all ${updatedSubtasks.length} subtasks finished successfully`,
                  "success"
                );

                // Persist to PostgreSQL -- use ref guard to prevent duplicate POSTs
                if (!persistedRef.current) {
                  persistedRef.current = true;
                  fetch("/api/swarm/execute", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query, mode: swarmMode }),
                  }).catch(() => {});
                }

                return {
                  ...prev,
                  status: "completed",
                  subtasks: updatedSubtasks,
                  synthesizedResult: synthesized,
                  completedAt: new Date().toISOString(),
                  totalDuration: Math.max(
                    ...updatedSubtasks.map((s) => s.duration || 0)
                  ),
                };
              }

              return { ...prev, subtasks: updatedSubtasks };
            });

            // Reset individual agent
            setAgents((prev) =>
              prev.map((a) =>
                a.id === d.agentId
                  ? {
                      ...a,
                      status: "active" as const,
                      currentTask: null,
                      tasksCompleted: a.tasksCompleted + 1,
                      lastActive: new Date().toISOString(),
                    }
                  : a
              )
            );

            addLogEntry(
              "agent_action",
              `${d.agentName}: ${d.action} completed in ${(duration / 1000).toFixed(1)}s`,
              "success",
              d.agentName
            );
          }, duration);
          timeoutsRef.current.push(tComplete);
        });
      }, startDelay);
      timeoutsRef.current.push(t1);
    },
    [swarmMode, addLogEntry]
  );

  const handleReset = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    persistedRef.current = false;
    setCurrentTask(null);
    setIsExecuting(false);
    setAgents(AGENTS);
  }, []);

  return (
    <div className="grid-bg min-h-full px-6 py-6">
        <div className="flex flex-col gap-6">
          {/* System Vitals */}
          <section aria-label="System Metrics">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                label="Active Agents"
                value={`${metricsData?.activeAgents ?? SYSTEM_METRICS.activeAgents}/${metricsData?.totalAgents ?? SYSTEM_METRICS.totalAgents}`}
                subtitle="online"
                icon={Bot}
                accentColor="text-primary"
              />
              <MetricCard
                label="Tasks Processed"
                value={formatNumber(metricsData?.tasksProcessed ?? SYSTEM_METRICS.tasksProcessed)}
                subtitle={`${metricsData?.tasksToday ?? SYSTEM_METRICS.tasksToday} today`}
                icon={Activity}
                trend={{ value: 12.4, label: "vs last week" }}
              />
              <MetricCard
                label="Uptime"
                value={formatUptime(metricsData?.uptime ?? SYSTEM_METRICS.uptime)}
                subtitle="continuous"
                icon={Clock}
                accentColor="text-[hsl(var(--success))]"
              />
              <MetricCard
                label="Swarm Efficiency"
                value={`${metricsData?.swarmEfficiency ?? SYSTEM_METRICS.swarmEfficiency}%`}
                subtitle="parallel gain"
                icon={Gauge}
                trend={{ value: 3.1, label: "vs sequential" }}
                accentColor="text-[hsl(var(--warning))]"
              />
            </div>
          </section>

          {/* Agent Swarm Grid */}
          <section aria-label="Agent Swarm">
            <div className="mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Agent Swarm
              </h2>
              <span className="text-xs text-muted-foreground">
                {swarmMode === "ralph-wiggum"
                  ? "All agents available for parallel execution"
                  : "Single agent routing mode"}
              </span>
              <div className="ml-auto">
                <SwarmModeBadge
                  mode={swarmMode}
                  onToggle={() =>
                    setSwarmMode((m) =>
                      m === "ralph-wiggum" ? "single" : "ralph-wiggum"
                    )
                  }
                  isExecuting={isExecuting}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {agents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSwarmActive={swarmMode === "ralph-wiggum"}
                />
              ))}
            </div>
          </section>

          {/* Top Investment Picks */}
          {topPicksData?.picks && topPicksData.picks.length > 0 && (
            <section aria-label="Top Investment Picks">
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />
                <h2 className="text-sm font-semibold text-foreground">
                  Top Investment Picks
                </h2>
                <span className="text-xs text-muted-foreground">
                  Ranked by TerraFusion Engine score
                </span>
                <Link
                  href="/properties?sort=score"
                  className="ml-auto text-[10px] font-medium text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {topPicksData.picks.map((pick, i) => {
                  const gradeColor: Record<string, string> = {
                    A: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
                    B: "bg-primary/15 text-primary border-primary/30",
                    C: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
                    D: "bg-destructive/15 text-destructive border-destructive/30",
                    F: "bg-destructive/15 text-destructive border-destructive/30",
                  };
                  const gc = gradeColor[pick.score.investment_grade] || gradeColor.C;
                  return (
                    <Link
                      key={pick.id}
                      href={`/properties/${pick.id}`}
                      className="group flex flex-col gap-2 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          #{i + 1} Pick
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${gc}`}>
                          {pick.score.investment_grade} &middot; {pick.score.total_score.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                        <span className="text-lg font-bold text-foreground">
                          {formatNumber(pick.price)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate text-[11px]">
                          {pick.address}, {pick.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{pick.beds}bd / {pick.baths}ba</span>
                        <span>&middot;</span>
                        <span>{formatNumber(pick.sqft)} sqft</span>
                      </div>
                      <span className={`mt-auto text-[10px] font-semibold ${
                        pick.score.recommendation === "Strong Buy" ? "text-[hsl(var(--success))]"
                        : pick.score.recommendation === "Buy" ? "text-primary"
                        : "text-[hsl(var(--warning))]"
                      }`}>
                        {pick.score.recommendation}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Command Interface */}
          <section aria-label="Command Interface">
            <CommandInput
              onSubmit={executeSwarmTask}
              isExecuting={isExecuting}
              onReset={currentTask ? handleReset : undefined}
            />
          </section>

          {/* Recent Queries */}
          {!currentTask && (
            <section aria-label="Recent Queries">
              <RecentQueries />
            </section>
          )}

          {/* Task Decomposition Visualizer */}
          <section aria-label="Task Decomposition">
            <SwarmVisualizer task={currentTask} />
          </section>

          {/* Bottom Grid: ETL + Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-label="ETL Health">
              <ETLStatus pipelines={livePipelines} />
            </section>
            <section aria-label="Activity">
              <ActivityLog entries={activityLog.slice(0, 15)} />
            </section>
          </div>
        </div>
    </div>
  );
}
