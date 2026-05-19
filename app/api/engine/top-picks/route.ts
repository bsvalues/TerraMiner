import { NextResponse } from "next/server";
import { getProperties } from "@/lib/db";
import { batchScore, type PropertyInput } from "@/lib/terra-engine";

// GET /api/engine/top-picks -- return top 4 investment-scored properties
export async function GET() {
  try {
    const result = await getProperties({ limit: 25 });

    const inputs: PropertyInput[] = result.properties.map(
      (p: Record<string, unknown>) => ({
        price: Number(p.price),
        sqft: p.sqft ? Number(p.sqft) : undefined,
        beds: p.beds ? Number(p.beds) : undefined,
        baths: p.baths ? Number(p.baths) : undefined,
        year_built: p.year_built ? Number(p.year_built) : undefined,
        lot_size: p.lot_size ? Number(p.lot_size) : undefined,
        city: String(p.city),
        status: String(p.status),
        grade: p.grade ? String(p.grade) : undefined,
        condition_code: p.condition_code ? String(p.condition_code) : undefined,
        assessed_value: p.assessed_value ? Number(p.assessed_value) : undefined,
        sale_price: p.sale_price ? Number(p.sale_price) : undefined,
        neighborhood_code: p.neighborhood_code ? String(p.neighborhood_code) : undefined,
      })
    );

    const scores = batchScore(inputs);

    const scored = result.properties
      .map((p: Record<string, unknown>, i: number) => ({
        id: p.id,
        address: p.address,
        city: p.city,
        state: p.state,
        price: Number(p.price),
        beds: Number(p.beds),
        baths: Number(p.baths),
        sqft: Number(p.sqft),
        status: p.status,
        score: scores[i],
      }))
      .sort(
        (
          a: { score: { total_score: number } },
          b: { score: { total_score: number } }
        ) => b.score.total_score - a.score.total_score
      )
      .slice(0, 4);

    return NextResponse.json({ picks: scored, source: "database" });
  } catch {
    return NextResponse.json(
      { picks: [], source: "error" },
      { status: 500 }
    );
  }
}
