import { NextResponse } from "next/server";
import { SYSTEM_METRICS } from "@/lib/mock-data";
import { getSystemMetrics } from "@/lib/db";

export async function GET() {
  try {
    const dbMetrics = await getSystemMetrics();

    return NextResponse.json({
      status: "success",
      source: "database",
      metrics: {
        ...SYSTEM_METRICS,
        totalProperties: dbMetrics.totalProperties,
        totalTasks: dbMetrics.totalTasks,
        healthySources: dbMetrics.healthySources,
        recentActivity: dbMetrics.recentActivity,
        cpuUsage: Math.round(SYSTEM_METRICS.cpuUsage + (Math.random() - 0.5) * 10),
        memoryUsage: Math.round(SYSTEM_METRICS.memoryUsage + (Math.random() - 0.5) * 5),
        uptime: SYSTEM_METRICS.uptime + (Math.floor(Date.now() / 1000) % 3600),
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: "success",
      source: "mock",
      metrics: {
        ...SYSTEM_METRICS,
        cpuUsage: Math.round(SYSTEM_METRICS.cpuUsage + (Math.random() - 0.5) * 10),
        memoryUsage: Math.round(SYSTEM_METRICS.memoryUsage + (Math.random() - 0.5) * 5),
        uptime: SYSTEM_METRICS.uptime + (Math.floor(Date.now() / 1000) % 3600),
      },
      timestamp: new Date().toISOString(),
    });
  }
}
