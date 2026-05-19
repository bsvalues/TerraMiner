import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/mock-data";
import { getRecentTasks } from "@/lib/db";

export async function GET() {
  try {
    // Pull task stats from PostgreSQL
    const tasks = await getRecentTasks(100);
    const totalDbTasks = tasks.length;

    const enrichedAgents = AGENTS.map((agent) => ({
      ...agent,
      backendConnected: true,
      dbTasks: totalDbTasks,
    }));

    return NextResponse.json({
      status: "success",
      source: "database",
      agents: enrichedAgents,
      total: enrichedAgents.length,
      active: enrichedAgents.filter(
        (a) => a.status === "active" || a.status === "processing"
      ).length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Fallback to mock data if DB is unavailable
    return NextResponse.json({
      status: "success",
      source: "mock",
      agents: AGENTS,
      total: AGENTS.length,
      active: AGENTS.filter((a) => a.status === "active").length,
      timestamp: new Date().toISOString(),
    });
  }
}
