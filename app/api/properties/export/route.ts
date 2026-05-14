import { NextResponse } from "next/server";
import { getProperties } from "@/lib/db";
import { scoreProperty } from "@/lib/terra-engine";

export async function GET() {
  try {
    const result = await getProperties({
      sort_by: "price",
      sort_dir: "desc",
      limit: 100,
    });
    const properties = result.properties;

    if (!properties.length) {
      return NextResponse.json({ error: "No properties found" }, { status: 404 });
    }

    // Build CSV with TerraFusion Engine scores
    const headers = [
      "Address", "City", "State", "Zip", "Price", "Beds", "Baths", "SqFt",
      "Year Built", "Lot Size", "Type", "Status", "Price/SqFt",
      "Investment Grade", "Total Score", "Value Score", "Location Score",
      "Condition Score", "Market Score", "Recommendation",
      "Assessed Value", "Land Value", "Improvement Value",
      "Neighborhood Code", "Neighborhood Name", "Tax Year",
      "Parcel Number", "Zoning", "Grade", "Condition",
      "Assessment Ratio", "Sale Price", "Sale Date",
      "Latitude", "Longitude"
    ];

    const rows = properties.map((p) => {
      const price = Number(p.price);
      const sqft = Number(p.sqft);
      const pricePerSqft = sqft > 0 ? (price / sqft).toFixed(0) : "0";

      const score = scoreProperty({
        price,
        sqft,
        beds: Number(p.beds),
        baths: Number(p.baths),
        year_built: p.year_built,
        lot_size: p.lot_size,
        city: p.city,
        status: p.status,
      });

      return [
        `"${(p.address || "").replace(/"/g, '""')}"`,
        `"${p.city}"`,
        `"${p.state || "WA"}"`,
        `"${p.zip_code || ""}"`,
        price,
        p.beds,
        p.baths,
        sqft,
        p.year_built || "",
        p.lot_size || "",
        `"${p.property_type || ""}"`,
        `"${p.status || ""}"`,
        pricePerSqft,
        score.investment_grade,
        score.total_score.toFixed(1),
        score.value_score.toFixed(1),
        score.location_score.toFixed(1),
        score.condition_score.toFixed(1),
        score.market_score.toFixed(1),
        `"${score.recommendation}"`,
        p.assessed_value || "",
        p.land_value || "",
        p.improvement_value || "",
        `"${p.neighborhood_code || ""}"`,
        `"${p.neighborhood_name || ""}"`,
        p.tax_year || "",
        `"${p.parcel_number || ""}"`,
        `"${p.zoning || ""}"`,
        `"${p.grade || ""}"`,
        `"${p.condition_code || ""}"`,
        p.assessed_value && price > 0 ? (Number(p.assessed_value) / price).toFixed(4) : "",
        p.sale_price || "",
        p.sale_date ? `"${new Date(p.sale_date).toISOString().split("T")[0]}"` : "",
        p.latitude || "",
        p.longitude || "",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="terrafusion-properties-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("[CSV Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export properties" },
      { status: 500 }
    );
  }
}
