import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id?: string }).id || "0");

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const propertyId = formData.get("propertyId") as string;
    const expiresAt = formData.get("expiresAt") as string | null;

    if (!file || !propertyId) {
      return NextResponse.json({ error: "File and propertyId required" }, { status: 400 });
    }

    // Verify property ownership
    const propCheck = await query(
      `SELECT id FROM properties WHERE id = $1 AND user_id = $2`,
      [parseInt(propertyId), userId]
    );
    if (propCheck.rows.length === 0) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "mandates");
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const ext = path.extname(file.name) || ".pdf";
    const filename = `mandate-${propertyId}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    // Update property with mandate URL
    const mandateUrl = `/uploads/mandates/${filename}`;
    await query(
      `UPDATE properties 
       SET mandate_url = $1, mandate_signed_at = NOW(), mandate_expires_at = $2
       WHERE id = $3`,
      [mandateUrl, expiresAt || null, parseInt(propertyId)]
    );

    return NextResponse.json({ 
      success: true, 
      url: mandateUrl,
      signedAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
    });
  } catch (error) {
    console.error("[Mandate Upload] Error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
