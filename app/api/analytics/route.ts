import { NextResponse } from "next/server";
import { getPropertyStats, getAgentStats } from "@/lib/db";

// GET /api/analytics -- aggregate stats from PostgreSQL for charts
// Agent Charlie says "aggregation is when you put all the numbers in a blender and drink them"
export async function GET() {
  try {
    const [propertyStats, agentStats] = await Promise.all([
      getPropertyStats(),
      getAgentStats(),
    ]);

    return NextResponse.json({
      status: "success",
      dataSource: "postgresql",
      properties: propertyStats,
      agents: agentStats,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: "error",
      dataSource: "unavailable",
      properties: { byCity: [], byType: [], byStatus: [], priceStats: null },
      agents: { taskCounts: [], avgDurations: [] },
      timestamp: new Date().toISOString(),
    });
  }
}
