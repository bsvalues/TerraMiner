import { NextResponse } from "next/server";
import { ETL_PIPELINES } from "@/lib/mock-data";
import { getETLPlugins, getETLJobs } from "@/lib/api-client";

export async function GET() {
  // Attempt live ETL data from Flask
  const [pluginsRes, jobsRes] = await Promise.all([
    getETLPlugins(),
    getETLJobs({ limit: 20 }),
  ]);

  const isLive = pluginsRes.source === "live";

  if (isLive && pluginsRes.data && jobsRes.data) {
    return NextResponse.json({
      status: "success",
      source: "live",
      plugins: pluginsRes.data.plugins,
      jobs: jobsRes.data.jobs,
      // Also include mock pipelines for UI display compatibility
      pipelines: ETL_PIPELINES,
      summary: {
        totalPlugins: (pluginsRes.data.plugins || []).length,
        recentJobs: (jobsRes.data.jobs || []).length,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback to mock data
  const healthyCount = ETL_PIPELINES.filter(
    (p) => p.status === "healthy"
  ).length;
  const totalRecords = ETL_PIPELINES.reduce(
    (sum, p) => sum + p.recordsProcessed,
    0
  );

  return NextResponse.json({
    status: "success",
    source: "mock",
    pipelines: ETL_PIPELINES,
    summary: {
      total: ETL_PIPELINES.length,
      healthy: healthyCount,
      degraded: ETL_PIPELINES.filter((p) => p.status === "degraded").length,
      down: ETL_PIPELINES.filter((p) => p.status === "down").length,
      totalRecordsProcessed: totalRecords,
    },
    timestamp: new Date().toISOString(),
  });
}
