import { NextResponse } from "next/server";
import { ETL_PIPELINES } from "@/lib/mock-data";
import { getDataSources } from "@/lib/db";

export async function GET() {
  try {
    const sources = await getDataSources();

    // Map DB data sources to the ETL pipeline format the UI expects
    const pipelines = sources.map((s: Record<string, unknown>) => ({
      id: s.id,
      name: s.display_name || s.name,
      sourceType: s.source_type,
      status: s.status,
      lastSync: s.last_sync,
      nextSync: s.next_sync,
      recordsProcessed: Number(s.records_synced) || 0,
      recordsTotal: Number(s.records_total) || 0,
      errorRate: Number(s.error_rate) || 0,
      avgProcessingTime: Number(s.avg_processing_ms) || 0,
    }));

    const healthyCount = pipelines.filter(
      (p: { status: string }) => p.status === "healthy"
    ).length;
    const totalRecords = pipelines.reduce(
      (sum: number, p: { recordsProcessed: number }) => sum + p.recordsProcessed,
      0
    );

    return NextResponse.json({
      status: "success",
      source: "database",
      pipelines,
      summary: {
        total: pipelines.length,
        healthy: healthyCount,
        degraded: pipelines.filter((p: { status: string }) => p.status === "degraded").length,
        down: pipelines.filter((p: { status: string }) => p.status === "down").length,
        totalRecordsProcessed: totalRecords,
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Fallback to mock data
    const healthyCount = ETL_PIPELINES.filter((p) => p.status === "healthy").length;
    const totalRecords = ETL_PIPELINES.reduce((sum, p) => sum + p.recordsProcessed, 0);

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
}
