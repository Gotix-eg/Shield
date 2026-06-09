import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { verifyWebsiteAuth } from "@/lib/verifyWebsiteAuth";

export async function POST(req: NextRequest) {
  const user = await verifyWebsiteAuth(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const ext = file.name.substring(file.name.lastIndexOf("."));
    const filename = `${crypto.randomBytes(12).toString("hex")}${ext}`;
    
    // Upload to Vercel Blob (public)
    const { url } = await put(`website-assets/${filename}`, arrayBuffer, {
      access: "public",
      addRandomSuffix: false
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("POST /api/website/upload error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
