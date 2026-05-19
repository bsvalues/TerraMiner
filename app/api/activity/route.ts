import { NextResponse } from "next/server";
import { getActivityLog } from "@/lib/db";

// GET /api/activity -- recent activity log entries from PostgreSQL
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

  try {
    const rows = await getActivityLog(limit);

    // Map DB rows to ActivityLogEntry shape the UI expects
    const entries = rows.map((r: Record<string, unknown>) => ({
      id: String(r.id),
      timestamp: String(r.created_at || new Date().toISOString()),
      type: String(r.type),
      agent: r.agent ? String(r.agent) : null,
      message: String(r.message),
      severity: String(r.severity),
    }));

    return NextResponse.json({
      status: "success",
      dataSource: "postgresql",
      entries,
      total: entries.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      status: "success",
      dataSource: "unavailable",
      entries: [],
      total: 0,
      timestamp: new Date().toISOString(),
    });
  }
}
