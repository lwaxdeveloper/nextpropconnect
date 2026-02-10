import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = "/app/data/uploads";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const propertyId = formData.get("property_id") as string;
    const sortOrder = formData.get("sort_order") as string;
    const category = (formData.get("category") as string) || "other";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB." },
        { status: 400 }
      );
    }

    // Check image count for property
    if (propertyId) {
      const countResult = await query(
        "SELECT COUNT(*) FROM property_images WHERE property_id = $1",
        [parseInt(propertyId)]
      );
      if (parseInt(countResult.rows[0].count) >= 20) {
        return NextResponse.json(
          { error: "Maximum 20 images per property" },
          { status: 400 }
        );
      }
    }

    // Ensure upload dir exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${Date.now()}-${randomBytes(8).toString("hex")}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/api/uploads/${filename}`;

    // Save to DB if property_id provided
    if (propertyId) {
      const isPrimary = (parseInt(sortOrder) || 0) === 0;
      await query(
        "INSERT INTO property_images (property_id, url, sort_order, is_primary, category) VALUES ($1, $2, $3, $4, $5)",
        [parseInt(propertyId), url, parseInt(sortOrder) || 0, isPrimary, category]
      );
    }

    return NextResponse.json({ url, filename });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
