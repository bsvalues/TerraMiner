import { NextResponse } from "next/server";
import { getPropertyById } from "@/lib/db";
import { MOCK_PROPERTIES } from "@/lib/mock-properties";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const row = await getPropertyById(id);

    if (!row) {
      return NextResponse.json(
        { status: "error", message: "Property not found" },
        { status: 404 }
      );
    }

    // Map DB snake_case to camelCase
    const property = {
      id: row.id,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      price: Number(row.price),
      beds: Number(row.beds),
      baths: Number(row.baths),
      sqft: Number(row.sqft),
      lotSize: Number(row.lot_size) || 0,
      yearBuilt: Number(row.year_built) || 0,
      propertyType: row.property_type,
      status: row.status,
      daysOnMarket: Number(row.days_on_market) || 0,
      description: row.description || "",
      features: row.features || [],
      mlsId: row.mls_id || "",
      latitude: Number(row.latitude) || 0,
      longitude: Number(row.longitude) || 0,
      dataSource: row.data_source || "unknown",
      // Assessment fields (Benton Method)
      assessedValue: row.assessed_value ? Number(row.assessed_value) : null,
      landValue: row.land_value ? Number(row.land_value) : null,
      improvementValue: row.improvement_value ? Number(row.improvement_value) : null,
      neighborhoodCode: row.neighborhood_code || null,
      neighborhoodName: row.neighborhood_name || null,
      taxYear: row.tax_year ? Number(row.tax_year) : null,
      parcelNumber: row.parcel_number || null,
      zoning: row.zoning || null,
      grade: row.grade || null,
      conditionCode: row.condition_code || null,
      effectiveYear: row.effective_year ? Number(row.effective_year) : null,
      saleDate: row.sale_date || null,
      salePrice: row.sale_price ? Number(row.sale_price) : null,
    };

    return NextResponse.json({
      status: "success",
      source: "postgresql",
      property,
    });
  } catch {
    // Fallback to mock data
    const mockProp = MOCK_PROPERTIES.find((p) => p.id === id);
    if (!mockProp) {
      return NextResponse.json(
        { status: "error", message: "Property not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      source: "mock",
      property: mockProp,
    });
  }
}
