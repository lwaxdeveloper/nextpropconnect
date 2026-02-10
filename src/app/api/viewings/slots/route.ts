/**
 * GET /api/viewings/slots?property_id=123&date=2026-02-10
 * Returns booked time slots for a property on a given date
 */

import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const propertyId = searchParams.get("property_id");
  const date = searchParams.get("date");

  if (!propertyId || !date) {
    return NextResponse.json(
      { error: "property_id and date are required" },
      { status: 400 }
    );
  }

  try {
    // Get all booked viewing times for this property on this date
    const result = await query(
      `SELECT proposed_time 
       FROM viewing_requests 
       WHERE property_id = $1 
         AND proposed_date = $2 
         AND status IN ('pending', 'confirmed')`,
      [propertyId, date]
    );

    const bookedSlots = result.rows.map((row) => row.proposed_time);

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error("[Viewings Slots] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}
