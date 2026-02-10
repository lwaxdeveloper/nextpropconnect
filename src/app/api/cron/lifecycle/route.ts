import { NextRequest, NextResponse } from "next/server";
import { processSubscriptionLifecycle } from "@/lib/subscription-lifecycle";

// Secret key for cron authentication
const CRON_SECRET = process.env.CRON_SECRET || "nextpropconnect-cron-secret";

/**
 * Daily cron job to process subscription lifecycle
 * Should be called once per day via external cron service
 * 
 * Example: curl -X POST https://nextnextpropconnect.co.za/api/cron/lifecycle \
 *          -H "Authorization: Bearer nextpropconnect-cron-secret"
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  
  if (token !== CRON_SECRET) {
    console.error("[Cron] Unauthorized lifecycle request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting subscription lifecycle processing...");
    const stats = await processSubscriptionLifecycle();
    
    console.log("[Cron] Lifecycle processing complete:", stats);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    console.error("[Cron] Lifecycle processing failed:", error);
    return NextResponse.json(
      { error: "Lifecycle processing failed" },
      { status: 500 }
    );
  }
}

// Allow GET for simple testing
export async function GET(request: NextRequest) {
  return POST(request);
}
