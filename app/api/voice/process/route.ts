import { NextResponse } from "next/server";
import { processVoiceCommand } from "@/lib/api-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.command || typeof body.command !== "string") {
      return NextResponse.json(
        { status: "error", message: "Command is required" },
        { status: 400 }
      );
    }

    const result = await processVoiceCommand(body.command);

    if (result.source === "live" && result.data) {
      return NextResponse.json({
        status: "success",
        source: "live",
        ...result.data,
        timestamp: new Date().toISOString(),
      });
    }

    // Mock voice processing fallback
    const command = body.command.toLowerCase();
    let intent = "unknown";
    let response = "I understood your command but the backend is offline.";

    if (command.includes("search") || command.includes("find")) {
      intent = "property_search";
      response = `Searching for properties matching: "${body.command}"`;
    } else if (command.includes("market") || command.includes("trend")) {
      intent = "market_analysis";
      response = `Analyzing market trends for your query: "${body.command}"`;
    } else if (command.includes("recommend") || command.includes("suggest")) {
      intent = "recommendation";
      response = `Getting property recommendations: "${body.command}"`;
    } else if (command.includes("value") || command.includes("worth")) {
      intent = "valuation";
      response = `Estimating property value for: "${body.command}"`;
    }

    return NextResponse.json({
      status: "success",
      source: "mock",
      success: true,
      intent,
      entities: {},
      response,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Failed to process voice command" },
      { status: 500 }
    );
  }
}
