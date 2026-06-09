import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Client Portal Message received:", body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/website/portal/message error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
