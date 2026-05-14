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
    const status = searchParams.get("status");
    const stats = searchParams.get("stats");

    if (stats === "true") {
      const result = await sql`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'submitted') as submitted,
          COUNT(*) FILTER (WHERE status = 'under_review') as under_review,
          COUNT(*) FILTER (WHERE status = 'hearing_scheduled') as hearing_scheduled,
          COUNT(*) FILTER (WHERE status = 'decided') as decided,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE decision = 'approved') as approved,
          COUNT(*) FILTER (WHERE decision = 'denied') as denied_count,
          COUNT(*) FILTER (WHERE decision = 'partial') as partial
        FROM assessment_appeals
      `;
      return NextResponse.json({ stats: result[0] });
    }

    if (propertyId) {
      const appeals = await sql`SELECT * FROM assessment_appeals WHERE property_id = ${propertyId} ORDER BY filed_date DESC`;
      return NextResponse.json({ appeals });
    }

    if (status) {
      const appeals = await sql`
        SELECT a.*, p.address, p.city 
        FROM assessment_appeals a 
        JOIN properties p ON a.property_id = p.id 
        WHERE a.status = ${status} 
        ORDER BY a.filed_date DESC LIMIT 50
      `;
      return NextResponse.json({ appeals });
    }

    const appeals = await sql`
      SELECT a.*, p.address, p.city 
      FROM assessment_appeals a 
      JOIN properties p ON a.property_id = p.id 
      ORDER BY a.filed_date DESC LIMIT 50
    `;
    return NextResponse.json({ appeals });
  } catch (error) {
    console.error("Error fetching appeals:", error);
    return NextResponse.json({ error: "Failed to fetch appeals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { property_id, original_value, requested_value, reason, appellant_name, appellant_email } = body;

    if (!property_id || !original_value || !requested_value || !reason || !appellant_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO assessment_appeals (property_id, original_value, requested_value, reason, appellant_name, appellant_email)
      VALUES (${property_id}, ${original_value}, ${requested_value}, ${reason}, ${appellant_name}, ${appellant_email || null})
      RETURNING *
    `;
    return NextResponse.json({ appeal: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating appeal:", error);
    return NextResponse.json({ error: "Failed to create appeal" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { id, status, decision, final_value, hearing_date } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rows = await sql`
      UPDATE assessment_appeals SET
        status = COALESCE(${status || null}, status),
        decision = COALESCE(${decision || null}, decision),
        final_value = COALESCE(${final_value || null}, final_value),
        hearing_date = COALESCE(${hearing_date || null}::date, hearing_date),
        decided_date = CASE WHEN ${status || null} = 'decided' THEN CURRENT_DATE ELSE decided_date END,
        updated_at = now()
      WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json({ appeal: rows[0] });
  } catch (error) {
    console.error("Error updating appeal:", error);
    return NextResponse.json({ error: "Failed to update appeal" }, { status: 500 });
  }
}
