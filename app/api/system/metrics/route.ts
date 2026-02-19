import { NextResponse } from "next/server";
import { SYSTEM_METRICS } from "@/lib/mock-data";

export async function GET() {
  // Return metrics with slightly randomized current values for realism
  const liveMetrics = {
    ...SYSTEM_METRICS,
    cpuUsage: Math.round(SYSTEM_METRICS.cpuUsage + (Math.random() - 0.5) * 10),
    memoryUsage: Math.round(
      SYSTEM_METRICS.memoryUsage + (Math.random() - 0.5) * 5
    ),
    uptime: SYSTEM_METRICS.uptime + Math.floor(Date.now() / 1000) % 3600,
  };

  return NextResponse.json({
    status: "success",
    metrics: liveMetrics,
    timestamp: new Date().toISOString(),
  });
}
