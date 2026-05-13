import { NextResponse } from "next/server";
import { getProperties } from "@/lib/db";
import { scoreProperty, batchScore, type PropertyInput } from "@/lib/terra-engine";

// POST /api/engine/score -- score properties using the TerraFusion engine
// Agent Bravo says "scoring houses is like grading homework but the homework is a building"
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Single property scoring
    if (body.property) {
      const score = scoreProperty(body.property as PropertyInput);
      return NextResponse.json({ status: "success", engine: "terra-engine", score });
    }

    // Batch scoring from DB
    const filters = body.filters || {};
    const result = await getProperties({ ...filters, limit: 50 });

    const inputs: PropertyInput[] = result.properties.map((p: Record<string, unknown>) => ({
      price: Number(p.price),
      sqft: p.sqft ? Number(p.sqft) : undefined,
      beds: p.beds ? Number(p.beds) : undefined,
      baths: p.baths ? Number(p.baths) : undefined,
      year_built: p.year_built ? Number(p.year_built) : undefined,
      lot_size: p.lot_size ? Number(p.lot_size) : undefined,
      city: String(p.city),
      status: String(p.status),
    }));

    const scores = batchScore(inputs);

    // Zip scores with property data
    const scoredProperties = result.properties.map((p: Record<string, unknown>, i: number) => ({
      ...p,
      score: scores[i],
    }));

    return NextResponse.json({
      status: "success",
      engine: "terra-engine",
      properties: scoredProperties,
      total: result.total,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Scoring engine failed" },
      { status: 500 }
    );
  }
}
