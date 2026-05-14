import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function getSQL() {
  return neon(process.env.DATABASE_URL!);
}

export async function GET(request: NextRequest) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("property_id");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let entries;
    if (propertyId && category) {
      entries = await sql`SELECT * FROM audit_entries WHERE property_id = ${propertyId} AND category = ${category} ORDER BY created_at DESC LIMIT ${limit}`;
    } else if (propertyId) {
      entries = await sql`SELECT * FROM audit_entries WHERE property_id = ${propertyId} ORDER BY created_at DESC LIMIT ${limit}`;
    } else if (category) {
      entries = await sql`SELECT * FROM audit_entries WHERE category = ${category} ORDER BY created_at DESC LIMIT ${limit}`;
    } else {
      entries = await sql`SELECT * FROM audit_entries ORDER BY created_at DESC LIMIT ${limit}`;
    }

    return NextResponse.json({ entries, total: entries.length });
  } catch (error) {
    console.error("Error fetching audit entries:", error);
    return NextResponse.json({ error: "Failed to fetch audit entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { property_id, action, category, description, entity_type, entity_id, user_name, user_role, changes } = body;

    if (!action || !category || !description || !user_name) {
      return NextResponse.json({ error: "Missing required fields: action, category, description, user_name" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null;
    const rows = await sql`
      INSERT INTO audit_entries (property_id, action, category, description, entity_type, entity_id, user_name, user_role, changes, ip_address)
      VALUES (${property_id || null}, ${action}, ${category}, ${description}, ${entity_type || null}, ${entity_id || null}, ${user_name}, ${user_role || null}, ${JSON.stringify(changes || null)}, ${ip})
      RETURNING *
    `;
    return NextResponse.json({ entry: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating audit entry:", error);
    return NextResponse.json({ error: "Failed to create audit entry" }, { status: 500 });
  }
}
