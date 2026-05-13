import { NextResponse } from "next/server";
import { searchProperties } from "@/lib/api-client";
import { MOCK_PROPERTIES } from "@/lib/mock-properties";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const params = {
    location: searchParams.get("location") || undefined,
    min_price: searchParams.get("min_price")
      ? Number(searchParams.get("min_price"))
      : undefined,
    max_price: searchParams.get("max_price")
      ? Number(searchParams.get("max_price"))
      : undefined,
    beds: searchParams.get("beds")
      ? Number(searchParams.get("beds"))
      : undefined,
    baths: searchParams.get("baths")
      ? Number(searchParams.get("baths"))
      : undefined,
    property_type: searchParams.get("property_type") || undefined,
    page: searchParams.get("page")
      ? Number(searchParams.get("page"))
      : undefined,
  };

  // Try Flask backend
  const result = await searchProperties(params);

  if (result.source === "live" && result.data) {
    return NextResponse.json({
      status: "success",
      source: "live",
      ...result.data,
      timestamp: new Date().toISOString(),
    });
  }

  // Fallback: filter mock properties
  let filtered = [...MOCK_PROPERTIES];

  if (params.location) {
    const loc = params.location.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.city.toLowerCase().includes(loc) ||
        p.address.toLowerCase().includes(loc) ||
        p.zipCode.includes(loc)
    );
  }
  if (params.min_price) {
    filtered = filtered.filter((p) => p.price >= params.min_price!);
  }
  if (params.max_price) {
    filtered = filtered.filter((p) => p.price <= params.max_price!);
  }
  if (params.beds) {
    filtered = filtered.filter((p) => p.beds >= params.beds!);
  }
  if (params.property_type) {
    filtered = filtered.filter(
      (p) => p.type.toLowerCase() === params.property_type!.toLowerCase()
    );
  }

  return NextResponse.json({
    status: "success",
    source: "mock",
    properties: filtered,
    total: filtered.length,
    page: params.page || 1,
    timestamp: new Date().toISOString(),
  });
}
