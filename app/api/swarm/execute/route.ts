import { NextResponse } from "next/server";
import type { SwarmExecutionRequest } from "@/lib/types";
import {
  decomposeTask,
  createSwarmTask,
  getMockResult,
  getSimulatedDuration,
} from "@/lib/swarm-engine";
import { createAgentTask, addActivityEntry } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SwarmExecutionRequest;

    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        { status: "error", message: "Query is required" },
        { status: 400 }
      );
    }

    const mode = body.mode || "ralph-wiggum";
    const decomposed = decomposeTask(body.query, mode);
    const task = createSwarmTask(body.query, mode, decomposed);

    // Simulate completed execution for API response
    const completedSubtasks = task.subtasks.map((subtask, index) => {
      const d = decomposed[index];
      const duration = getSimulatedDuration(d.agentType);
      return {
        ...subtask,
        status: "completed" as const,
        progress: 100,
        result: getMockResult(d.action),
        startedAt: new Date().toISOString(),
        completedAt: new Date(Date.now() + duration).toISOString(),
        duration,
      };
    });

    const synthesizedResult = completedSubtasks
      .map((s) => s.result)
      .filter(Boolean)
      .join(" | ");

    const maxDuration = Math.max(
      ...completedSubtasks.map((s) => s.duration || 0)
    );

    // Persist to PostgreSQL (fire-and-forget, don't block response)
    try {
      const subtaskData = decomposed.map((d) => ({
        agent_type: d.agentType,
        action: d.action,
      }));
      await createAgentTask(body.query, mode, subtaskData);
      await addActivityEntry(
        "task",
        `Swarm completed: "${body.query.slice(0, 60)}" (${decomposed.length} subtasks)`,
        "info",
        "Swarm"
      );
    } catch {
      // DB persistence is best-effort -- don't fail the request
    }

    return NextResponse.json({
      status: "success",
      task: {
        ...task,
        status: "completed",
        subtasks: completedSubtasks,
        synthesizedResult,
        completedAt: new Date().toISOString(),
        totalDuration: maxDuration,
      },
      execution: {
        taskId: task.id,
        mode,
        phases: [
          {
            name: "decomposition",
            status: "completed",
            subtaskIds: [],
            startedAt: task.createdAt,
            completedAt: task.createdAt,
          },
          {
            name: "parallel_execution",
            status: "completed",
            subtaskIds: completedSubtasks.map((s) => s.id),
            startedAt: task.createdAt,
            completedAt: new Date().toISOString(),
          },
          {
            name: "synthesis",
            status: "completed",
            subtaskIds: [],
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        ],
        currentPhase: 2,
        metrics: {
          totalSubtasks: completedSubtasks.length,
          completedSubtasks: completedSubtasks.length,
          failedSubtasks: 0,
          parallelism: completedSubtasks.length,
          estimatedTimeRemaining: null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to process swarm request" },
      { status: 500 }
    );
  }
}
