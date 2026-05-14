import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import {
  analyzeNeighborhoods,
  analyzeCities,
  type AssessmentProperty,
} from "@/lib/assessment-engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const groupBy = searchParams.get("groupBy") || "neighborhood"; // "neighborhood" | "city"

    const sql = neon(process.env.DATABASE_URL!);

    let query = `SELECT id, address, city, price, assessed_value, land_value, improvement_value,
      sale_price, sale_date, neighborhood_code, neighborhood_name, grade, condition_code,
      parcel_number, zoning, sqft, beds, baths, year_built, tax_year
      FROM properties WHERE assessed_value IS NOT NULL AND sale_price IS NOT NULL`;

    const params: string[] = [];
    if (city) {
      params.push(city);
      query += ` AND city = $${params.length}`;
    }

    const rows = await sql.query(query, params);

    const properties: AssessmentProperty[] = rows.map((r) => ({
      id: String(r.id),
      address: String(r.address || ""),
      city: String(r.city || ""),
      price: Number(r.price || 0),
      assessed_value: Number(r.assessed_value || 0),
      land_value: Number(r.land_value || 0),
      improvement_value: Number(r.improvement_value || 0),
      sale_price: Number(r.sale_price || 0),
      sale_date: String(r.sale_date || ""),
      neighborhood_code: String(r.neighborhood_code || ""),
      neighborhood_name: String(r.neighborhood_name || ""),
      grade: String(r.grade || ""),
      condition_code: String(r.condition_code || ""),
      parcel_number: String(r.parcel_number || ""),
      zoning: String(r.zoning || ""),
      sqft: Number(r.sqft || 0),
      beds: Number(r.beds || 0),
      baths: Number(r.baths || 0),
      year_built: Number(r.year_built || 0),
      tax_year: Number(r.tax_year || 2025),
    }));

    const analysis =
      groupBy === "city"
        ? analyzeCities(properties)
        : analyzeNeighborhoods(properties);

    return NextResponse.json({
      source: "database",
      groupBy,
      filters: { city },
      neighborhoods: analysis,
    });
  } catch (error) {
    console.error("Neighborhood analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze neighborhoods", source: "error" },
      { status: 500 }
    );
  }
}
