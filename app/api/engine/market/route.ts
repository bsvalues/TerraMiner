import { NextResponse } from "next/server";
import { getProperties } from "@/lib/db";
import { analyzeMarket, type MarketDataPoint } from "@/lib/terra-engine";

// GET /api/engine/market -- run market analysis using the TerraFusion engine
// Agent Delta says "analyzing the market is like reading tea leaves but the tea leaves are SQL rows"
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || undefined;

  try {
    const result = await getProperties({ city, limit: 100 });

    const dataPoints: MarketDataPoint[] = result.properties.map((p: Record<string, unknown>) => ({
      price: Number(p.price),
      sqft: p.sqft ? Number(p.sqft) : undefined,
      year_built: p.year_built ? Number(p.year_built) : undefined,
      city: String(p.city),
    }));

    const analysis = analyzeMarket(dataPoints);

    return NextResponse.json({
      status: "success",
      engine: "terra-engine",
      analysis,
      propertyCount: result.total,
      filters: { city },
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Market analysis engine failed" },
      { status: 500 }
    );
  }
}
