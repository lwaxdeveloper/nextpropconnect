import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = "/app/data/uploads/logos";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = session.user as { id?: string };
    const userId = parseInt(user.id || "0");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const agencyId = formData.get("agency_id") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!agencyId) {
      return NextResponse.json({ error: "Agency ID required" }, { status: 400 });
    }

    // Verify user is owner/admin of agency
    const memberCheck = await query(
      `SELECT role FROM agency_members WHERE agency_id = $1 AND user_id = $2`,
      [parseInt(agencyId), userId]
    );

    if (memberCheck.rows.length === 0 || !["owner", "admin"].includes(memberCheck.rows[0].role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, SVG" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 5MB." },
        { status: 400 }
      );
    }

    // Ensure upload dir exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const ext = file.name.split(".").pop() || "png";
    const filename = `logo-${agencyId}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/api/uploads/logos/${filename}`;

    // Update agency logo_url
    await query("UPDATE agencies SET logo_url = $1 WHERE id = $2", [url, parseInt(agencyId)]);

    return NextResponse.json({ url, filename });
  } catch (err) {
    console.error("POST /api/upload/logo error:", err);
    return NextResponse.json(
      { error: "Failed to upload logo" },
      { status: 500 }
    );
  }
}
