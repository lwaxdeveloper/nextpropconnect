import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

const UPLOAD_DIR = "/app/data/uploads/documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id?: string };
    const userId = parseInt(user.id || "0");

    // Get tenant
    const tenantResult = await query(
      `SELECT id FROM tenants WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );

    if (tenantResult.rows.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    const tenantId = tenantResult.rows[0].id;

    // Get documents
    const docsResult = await query(
      `SELECT * FROM tenant_documents WHERE tenant_id = $1 ORDER BY uploaded_at DESC`,
      [tenantId]
    );

    return NextResponse.json({ documents: docsResult.rows });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id?: string };
    const userId = parseInt(user.id || "0");

    // Get tenant
    const tenantResult = await query(
      `SELECT id FROM tenants WHERE user_id = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );

    if (tenantResult.rows.length === 0) {
      return NextResponse.json({ error: "No active tenancy" }, { status: 404 });
    }

    const tenantId = tenantResult.rows[0].id;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("document_type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: "Document type required" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Allowed: PDF, JPG, PNG, WebP" 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: "File too large. Maximum 10MB allowed" 
      }, { status: 400 });
    }

    // Create upload directory
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "pdf";
    const timestamp = Date.now();
    const fileName = `${tenantId}_${documentType}_${timestamp}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // File URL
    const fileUrl = `/api/uploads/documents/${fileName}`;

    // Delete existing document of same type
    await query(
      `DELETE FROM tenant_documents WHERE tenant_id = $1 AND document_type = $2`,
      [tenantId, documentType]
    );

    // Save to database
    const result = await query(
      `INSERT INTO tenant_documents (tenant_id, user_id, document_type, file_name, file_url, file_size, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [tenantId, userId, documentType, file.name, fileUrl, file.size]
    );

    return NextResponse.json({ 
      success: true, 
      document: result.rows[0] 
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
