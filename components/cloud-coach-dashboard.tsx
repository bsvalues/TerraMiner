"use client";

import { useState, useCallback, useRef } from "react";
import type { SwarmTask, SwarmMode, Agent, ActivityLogEntry } from "@/lib/types";
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
import { SwarmVisualizer } from "@/components/swarm-visualizer";
import { ETLStatus } from "@/components/etl-status";
import { ActivityLog } from "@/components/activity-log";
import {
  Bot,
  Activity,
  Clock,
  Gauge,
  Zap,
} from "lucide-react";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

export default function CloudCoachDashboard() {
  const [swarmMode, setSwarmMode] = useState<SwarmMode>("ralph-wiggum");
  const [currentTask, setCurrentTask] = useState<SwarmTask | null>(null);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>(
    INITIAL_ACTIVITY_LOG
  );
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const addLogEntry = useCallback(
    (
      type: ActivityLogEntry["type"],
      message: string,
      severity: ActivityLogEntry["severity"],
      agent: string | null = null
    ) => {
      setActivityLog((prev) => [
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
          const agentObj = AGENTS.find((a) => a.id === d.agentId);
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

          // Completion
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
                value={`${SYSTEM_METRICS.activeAgents}/${SYSTEM_METRICS.totalAgents}`}
                subtitle="online"
                icon={Bot}
                accentColor="text-primary"
              />
              <MetricCard
                label="Tasks Processed"
                value={formatNumber(SYSTEM_METRICS.tasksProcessed)}
                subtitle={`${SYSTEM_METRICS.tasksToday} today`}
                icon={Activity}
                trend={{ value: 12.4, label: "vs last week" }}
              />
              <MetricCard
                label="Uptime"
                value={formatUptime(SYSTEM_METRICS.uptime)}
                subtitle="continuous"
                icon={Clock}
                accentColor="text-[hsl(var(--success))]"
              />
              <MetricCard
                label="Swarm Efficiency"
                value={`${SYSTEM_METRICS.swarmEfficiency}%`}
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

          {/* Command Interface */}
          <section aria-label="Command Interface">
            <CommandInput
              onSubmit={executeSwarmTask}
              isExecuting={isExecuting}
              onReset={currentTask ? handleReset : undefined}
            />
          </section>

          {/* Task Decomposition Visualizer */}
          <section aria-label="Task Decomposition">
            <SwarmVisualizer task={currentTask} />
          </section>

          {/* Bottom Grid: ETL + Activity */}
          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-label="ETL Health">
              <ETLStatus pipelines={ETL_PIPELINES} />
            </section>
            <section aria-label="Activity">
              <ActivityLog entries={activityLog.slice(0, 15)} />
            </section>
          </div>
        </div>
    </div>
  );
}
