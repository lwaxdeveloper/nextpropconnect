import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSubscription } from "@/lib/subscription";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id?: string }).id || "0");

  try {
    const subscription = await getSubscription(userId);
    return NextResponse.json(subscription);
  } catch (error) {
    console.error("[Subscription] Error:", error);
    return NextResponse.json({ error: "Failed to get subscription" }, { status: 500 });
  }
}
