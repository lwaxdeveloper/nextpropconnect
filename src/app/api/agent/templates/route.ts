import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string; role?: string };

  const result = await query(
    `SELECT * FROM quick_replies WHERE agent_id = $1 ORDER BY usage_count DESC, created_at DESC`,
    [parseInt(user.id || "0")]
  );

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string };

  const body = await req.json();
  const { title, content, category } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO quick_replies (agent_id, title, content, category) VALUES ($1, $2, $3, $4) RETURNING *`,
    [parseInt(user.id || "0"), title, content, category || "general"]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string };

  const body = await req.json();
  const { id, title, content, category } = body;

  if (!id) {
    return NextResponse.json({ error: "Template ID required" }, { status: 400 });
  }

  const result = await query(
    `UPDATE quick_replies SET
      title = COALESCE($1, title),
      content = COALESCE($2, content),
      category = COALESCE($3, category)
     WHERE id = $4 AND agent_id = $5
     RETURNING *`,
    [title, content, category, parseInt(id), parseInt(user.id || "0")]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id?: string };

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Template ID required" }, { status: 400 });
  }

  const result = await query(
    `DELETE FROM quick_replies WHERE id = $1 AND agent_id = $2 RETURNING id`,
    [parseInt(id), parseInt(user.id || "0")]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
