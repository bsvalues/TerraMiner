"use server";

import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function getSQL() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) return null;
  return neon(url);
}

// GET: read all preferences
export async function GET() {
  try {
    const sql = getSQL();
    if (!sql) {
      return NextResponse.json({ preferences: {}, source: "default" });
    }

    const rows = await sql`SELECT key, value FROM user_preferences`;

    const preferences: Record<string, unknown> = {};
    for (const row of rows) {
      preferences[row.key] = row.value;
    }

    return NextResponse.json({ preferences, source: "postgresql" });
  } catch (e) {
    console.error("[Preferences] GET error:", e);
    return NextResponse.json({ preferences: {}, source: "default" });
  }
}

// POST: save a preference
export async function POST(request: Request) {
  try {
    const sql = getSQL();
    if (!sql) {
      return NextResponse.json({ error: "Database not connected" }, { status: 503 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    await sql`
      INSERT INTO user_preferences (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}, now())
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}, updated_at = now()
    `;

    return NextResponse.json({ success: true, key, value });
  } catch (e) {
    console.error("[Preferences] POST error:", e);
    return NextResponse.json({ error: "Failed to save preference" }, { status: 500 });
  }
}
