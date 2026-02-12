import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message, email, page, userAgent } = body;

    if (!message || !type) {
      return NextResponse.json(
        { error: "Message and type are required" },
        { status: 400 }
      );
    }

    // Store in database
    await query(
      `INSERT INTO feedback (type, message, email, page_url, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [type, message, email || null, page || null, userAgent || null]
    );

    // Log to console for immediate visibility
    console.log(`📬 New ${type} feedback:`, {
      type,
      message: message.substring(0, 100),
      email,
      page,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json(
      { error: "Failed to save feedback" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM feedback ORDER BY created_at DESC LIMIT 100`
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedback" },
      { status: 500 }
    );
  }
}
