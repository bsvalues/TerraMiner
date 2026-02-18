import { NextResponse } from "next/server";
import { ETL_PIPELINES } from "@/lib/mock-data";

export async function GET() {
  const healthyCount = ETL_PIPELINES.filter((p) => p.status === "healthy").length;
  const totalRecords = ETL_PIPELINES.reduce(
    (sum, p) => sum + p.recordsProcessed,
    0
  );

  return NextResponse.json({
    status: "success",
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
