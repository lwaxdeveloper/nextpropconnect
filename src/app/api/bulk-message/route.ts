import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import { sendWhatsApp, formatPhoneNumber, isMsgHubConfigured } from "@/lib/msghub";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id?: string }).id || "0");

  if (!isMsgHubConfigured()) {
    return NextResponse.json({ error: "Messaging not configured" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { leadId, phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json({ error: "Phone and message required" }, { status: 400 });
    }

    // Verify lead belongs to this agent
    if (leadId) {
      const leadCheck = await query(
        `SELECT id FROM leads WHERE id = $1 AND agent_id = $2`,
        [leadId, userId]
      );
      if (leadCheck.rows.length === 0) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }
    }

    // Send via MsgHub
    const result = await sendWhatsApp(formatPhoneNumber(phone), message);

    if (result) {
      // Log the activity
      if (leadId) {
        await query(
          `INSERT INTO lead_activities (lead_id, activity_type, description)
           VALUES ($1, 'bulk_message', $2)`,
          [leadId, `Bulk WhatsApp message sent`]
        );

        // Update first_response_at if this is first contact
        await query(
          `UPDATE leads SET first_response_at = NOW() 
           WHERE id = $1 AND first_response_at IS NULL AND status = 'new'`,
          [leadId]
        );
      }

      return NextResponse.json({ success: true, messageId: result.id });
    } else {
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }
  } catch (error) {
    console.error("[Bulk Message] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
