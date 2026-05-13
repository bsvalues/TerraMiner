import { NextResponse } from "next/server";
import { SYSTEM_METRICS } from "@/lib/mock-data";
import { getSystemStatus } from "@/lib/api-client";

export async function GET() {
  // Try to get live system status from Flask
  const liveStatus = await getSystemStatus();

  const liveMetrics = {
    ...SYSTEM_METRICS,
    cpuUsage: Math.round(
      SYSTEM_METRICS.cpuUsage + (Math.random() - 0.5) * 10
    ),
    memoryUsage: Math.round(
      SYSTEM_METRICS.memoryUsage + (Math.random() - 0.5) * 5
    ),
    uptime:
      SYSTEM_METRICS.uptime + (Math.floor(Date.now() / 1000) % 3600),
  };

  return NextResponse.json({
    status: "success",
    metrics: liveMetrics,
    backend: {
      connected: liveStatus.source === "live",
      availableSources: liveStatus.data?.available_sources ?? [],
      primarySource: liveStatus.data?.primary_source ?? "none",
      error: liveStatus.error,
    },
    timestamp: new Date().toISOString(),
  });
}
