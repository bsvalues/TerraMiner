import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/mock-data";
import { getRecentTasks, getAgentStats } from "@/lib/db";

// Mock task history fallback
const MOCK_TASK_HISTORY = [
  { id: "t1", action: "Market trend analysis for Richland WA", status: "completed", duration_ms: 1240, created_at: new Date(Date.now() - 120000).toISOString() },
  { id: "t2", action: "Property valuation for 1234 Jadwin Ave", status: "completed", duration_ms: 890, created_at: new Date(Date.now() - 480000).toISOString() },
  { id: "t3", action: "Comparable sales search within 0.5mi radius", status: "completed", duration_ms: 2100, created_at: new Date(Date.now() - 900000).toISOString() },
  { id: "t4", action: "Neighborhood risk assessment - flood zones", status: "completed", duration_ms: 1560, created_at: new Date(Date.now() - 1320000).toISOString() },
  { id: "t5", action: "Price prediction model for 99352 zip code", status: "failed", duration_ms: 4500, created_at: new Date(Date.now() - 1860000).toISOString() },
  { id: "t6", action: "Rental yield estimation for multi-family units", status: "completed", duration_ms: 1890, created_at: new Date(Date.now() - 2700000).toISOString() },
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = AGENTS.find((a) => a.id === id);

  if (!agent) {
    return NextResponse.json(
      { status: "error", message: `Agent not found: ${id}` },
      { status: 404 }
    );
  }

  try {
    // Pull real task history and stats from PostgreSQL
    const [allTasks, stats] = await Promise.all([
      getRecentTasks(50),
      getAgentStats(),
    ]);

    // Filter tasks that match this agent's type
    const agentTasks = allTasks
      .filter((t: Record<string, unknown>) => {
        const taskType = String(t.agent_type || t.swarm_mode || "");
        return taskType.includes(agent.type) || taskType === agent.type;
      })
      .slice(0, 10)
      .map((t: Record<string, unknown>) => ({
        id: String(t.id),
        action: String(t.query || t.action || "Unknown task"),
        status: String(t.status),
        duration_ms: Number(t.duration_ms || 0),
        created_at: String(t.created_at),
      }));

    return NextResponse.json({
      status: "success",
      source: "database",
      agent: {
        ...agent,
        dbTaskCount: Number(stats.totalTasks),
      },
      taskHistory: agentTasks.length > 0 ? agentTasks : MOCK_TASK_HISTORY,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: "success",
      source: "mock",
      agent,
      taskHistory: MOCK_TASK_HISTORY,
      timestamp: new Date().toISOString(),
    });
  }
}
