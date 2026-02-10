import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = "/app/data/uploads";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Sanitize filename — no path traversal
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "");
    if (safe !== filename) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filepath = join(UPLOAD_DIR, safe);

    // Check file exists
    try {
      await stat(filepath);
    } catch {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const data = await readFile(filepath);
    const ext = safe.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("GET /api/uploads/[filename] error:", err);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
