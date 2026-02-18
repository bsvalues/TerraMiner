import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({
    status: "success",
    agents: AGENTS,
    total: AGENTS.length,
    active: AGENTS.filter((a) => a.status === "active" || a.status === "processing").length,
    timestamp: new Date().toISOString(),
  });
}
