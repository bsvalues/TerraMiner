import { NextResponse } from "next/server";
import { getProperties } from "@/lib/db";
import { parseIntent } from "@/lib/terra-engine";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "/api/voice/process",
    method: "POST",
    description: "Process a natural-language voice command",
    usage: { command: "string" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.command || typeof body.command !== "string") {
      return NextResponse.json(
        { status: "error", message: "Command is required" },
        { status: 400 }
      );
    }

    const command = body.command;

    // Use the Rust engine (TS mirror) to parse intent
    const intent = parseIntent(command);

    // If it's a property search, actually query the database
    if (intent.intent === "property_search") {
      try {
        const result = await getProperties({
          city: intent.entities.city || undefined,
          min_beds: intent.entities.min_beds || undefined,
          max_price: intent.entities.max_price || undefined,
          limit: 5,
        });

        return NextResponse.json({
          status: "success",
          source: "database",
          intent: intent.intent,
          entities: intent.entities,
          confidence: intent.confidence,
          response: `Found ${result.total} properties matching your query.`,
          properties: result.properties,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // DB unavailable, return intent without results
      }
    }

    // Return parsed intent for non-search queries or when DB is down
    let response = `Understood: "${command}"`;
    if (intent.intent === "market_analysis") {
      response = `Analyzing market trends for: "${command}"`;
    } else if (intent.intent === "property_valuation") {
      response = `Estimating property value for: "${command}"`;
    } else if (intent.intent === "recommendation") {
      response = `Getting recommendations for: "${command}"`;
    } else if (intent.intent === "property_search") {
      response = `Searching properties: "${command}"`;
    }

    return NextResponse.json({
      status: "success",
      source: "engine",
      intent: intent.intent,
      entities: intent.entities,
      confidence: intent.confidence,
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
