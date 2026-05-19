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
    const stats = searchParams.get("stats");

    if (stats === "true") {
      const result = await sql`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'expired') as expired,
          COUNT(*) FILTER (WHERE status = 'denied') as denied,
          COUNT(*) as total,
          COALESCE(SUM(amount) FILTER (WHERE status = 'active' AND amount_type = 'fixed'), 0) as total_fixed_amount
        FROM property_exemptions
      `;
      return NextResponse.json({ stats: result[0] });
    }

    if (!propertyId) {
      return NextResponse.json({ error: "property_id is required" }, { status: 400 });
    }

    const exemptions = await sql`SELECT * FROM property_exemptions WHERE property_id = ${propertyId} ORDER BY applied_date DESC`;
    return NextResponse.json({ exemptions });
  } catch (error) {
    console.error("Error fetching exemptions:", error);
    return NextResponse.json({ error: "Failed to fetch exemptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { property_id, exemption_type, amount, amount_type, description, expiry_date } = body;

    if (!property_id || !exemption_type || amount === undefined || !amount_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const rows = await sql`
      INSERT INTO property_exemptions (property_id, exemption_type, status, amount, amount_type, description, expiry_date)
      VALUES (${property_id}, ${exemption_type}, 'pending', ${amount}, ${amount_type}, ${description || null}, ${expiry_date || null})
      RETURNING *
    `;
    return NextResponse.json({ exemption: rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating exemption:", error);
    return NextResponse.json({ error: "Failed to create exemption" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sql = getSQL();
    const body = await request.json();
    const { id, status, amount } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    let result;
    if (status && amount !== undefined) {
      result = await sql`UPDATE property_exemptions SET status = ${status}, amount = ${amount}, updated_at = now() WHERE id = ${id} RETURNING *`;
    } else if (status) {
      result = await sql`UPDATE property_exemptions SET status = ${status}, updated_at = now() WHERE id = ${id} RETURNING *`;
    } else if (amount !== undefined) {
      result = await sql`UPDATE property_exemptions SET amount = ${amount}, updated_at = now() WHERE id = ${id} RETURNING *`;
    }
    return NextResponse.json({ exemption: result?.[0] });
  } catch (error) {
    console.error("Error updating exemption:", error);
    return NextResponse.json({ error: "Failed to update exemption" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sql = getSQL();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await sql`DELETE FROM property_exemptions WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting exemption:", error);
    return NextResponse.json({ error: "Failed to delete exemption" }, { status: 500 });
  }
}
