import { NextResponse } from "next/server";
import { getProperties } from "@/lib/db";
import { MOCK_PROPERTIES } from "@/lib/mock-properties";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  try {
    const result = await getProperties({
      city: searchParams.get("city") || undefined,
      property_type: searchParams.get("property_type") || undefined,
      status: searchParams.get("status") || undefined,
      min_price: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
      max_price: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
      min_beds: searchParams.get("min_beds") ? Number(searchParams.get("min_beds")) : undefined,
      neighborhood: searchParams.get("neighborhood") || undefined,
      search: searchParams.get("search") || undefined,
      sort_by: searchParams.get("sort_by") || undefined,
      sort_dir: searchParams.get("sort_dir") || undefined,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
      offset: searchParams.get("offset") ? Number(searchParams.get("offset")) : 0,
    });

    return NextResponse.json({
      status: "success",
      source: "database",
      properties: result.properties,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Fallback to mock data with pagination
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 50;
    const offset = searchParams.get("offset") ? Number(searchParams.get("offset")) : 0;
    return NextResponse.json({
      status: "success",
      source: "mock",
      properties: MOCK_PROPERTIES.slice(offset, offset + limit),
      total: MOCK_PROPERTIES.length,
      timestamp: new Date().toISOString(),
    });
  }
}
