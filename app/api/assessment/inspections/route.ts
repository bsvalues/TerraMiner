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
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const stats = searchParams.get("stats");

    if (stats === "true") {
      const result = await sql`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE scheduled_date = CURRENT_DATE) as today,
          COUNT(*) as total
        FROM field_inspections
      `;
      return NextResponse.json({ stats: result[0] });
    }

    if (propertyId) {
      const inspections = await sql`SELECT * FROM field_inspections WHERE property_id = ${propertyId} ORDER BY scheduled_date DESC`;
      return NextResponse.json({ inspections });
    }

    if (date) {
      const inspections = await sql`
        SELECT i.*, p.address, p.city 
        FROM field_inspections i 
        JOIN properties p ON i.property_id = p.id 
        WHERE i.scheduled_date = ${date}::date 
        ORDER BY i.priority DESC, i.scheduled_date
      `;
      return NextResponse.json({ inspections });
    }

    if (status) {
      const inspections = await sql`
        SELECT i.*, p.address, p.city 
        FROM field_inspections i 
        JOIN properties p ON i.property_id = p.id 
        WHERE i.status = ${status} 
        ORDER BY i.scheduled_date LIMIT 50
      `;
      return NextResponse.json({ inspections });
    }

    const inspections = await sql`
      SELECT i.*, p.address, p.city 
      FROM field_inspections i 
      JOIN properties p ON i.property_id = p.id 
      ORDER BY i.scheduled_date DESC LIMIT 50
    `;
    return NextResponse.json({ inspections });
  } catch (error) {
    console.error("Error fetching inspections:", error);
    return NextResponse.json({ error: "Failed to fetch inspections" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { property_id, inspection_type, priority, scheduled_date, inspector_name, notes } = body;

    if (!property_id || !inspection_type || !priority || !scheduled_date || !inspector_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO field_inspections (property_id, inspection_type, priority, scheduled_date, inspector_name, notes)
      VALUES (${property_id}, ${inspection_type}, ${priority}, ${scheduled_date}::date, ${inspector_name}, ${notes || null})
      RETURNING *
    `;
    return NextResponse.json({ inspection: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating inspection:", error);
    return NextResponse.json({ error: "Failed to create inspection" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { id, status, notes, findings } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const rows = await sql`
      UPDATE field_inspections SET
        status = COALESCE(${status || null}, status),
        notes = COALESCE(${notes || null}, notes),
        findings = COALESCE(${JSON.stringify(findings || null)}::jsonb, findings),
        completed_date = CASE WHEN ${status || null} = 'completed' THEN CURRENT_DATE ELSE completed_date END,
        updated_at = now()
      WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json({ inspection: rows[0] });
  } catch (error) {
    console.error("Error updating inspection:", error);
    return NextResponse.json({ error: "Failed to update inspection" }, { status: 500 });
  }
}
