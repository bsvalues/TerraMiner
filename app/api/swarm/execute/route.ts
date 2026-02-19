import { NextResponse } from "next/server";
import type { SwarmExecutionRequest } from "@/lib/types";
import {
  decomposeTask,
  createSwarmTask,
  getMockResult,
  getSimulatedDuration,
} from "@/lib/swarm-engine";

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
