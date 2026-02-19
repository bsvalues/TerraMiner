import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/mock-data";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = AGENTS.find((a) => a.id === id);

  if (!agent) {
    return NextResponse.json(
      { status: "error", message: `Agent not found: ${id}` },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: "success",
    agent,
    timestamp: new Date().toISOString(),
  });
}
