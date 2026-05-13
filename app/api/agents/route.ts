import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/mock-data";
import { getAgentToolStatus } from "@/lib/api-client";

export async function GET() {
  // Try Flask backend first, fall back to mock data
  const liveStatus = await getAgentToolStatus();

  // Always return agent metadata (names, types, capabilities come from our config)
  // Enrich with live status when Flask is available
  const enrichedAgents = AGENTS.map((agent) => ({
    ...agent,
    backendConnected: liveStatus.source === "live",
    toolsAvailable: liveStatus.data?.agent_tools_available ?? false,
  }));

  return NextResponse.json({
    status: "success",
    agents: enrichedAgents,
    total: enrichedAgents.length,
    active: enrichedAgents.filter(
      (a) => a.status === "active" || a.status === "processing"
    ).length,
    backendSource: liveStatus.source,
    backendError: liveStatus.error,
    timestamp: new Date().toISOString(),
  });
}
