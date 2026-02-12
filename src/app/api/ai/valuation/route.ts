import { NextRequest, NextResponse } from "next/server";
import { estimatePropertyValue } from "@/lib/ai-rules";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { bedrooms, bathrooms, propertyType, suburb, city } = await req.json();

    if (!bedrooms || !propertyType || !suburb || !city) {
      return NextResponse.json(
        { error: "bedrooms, propertyType, suburb, and city are required" },
        { status: 400 }
      );
    }

    // Find comparable properties in the same or nearby areas
    const comparables = await query(
      `SELECT price, bedrooms, bathrooms, suburb, property_type
       FROM properties
       WHERE status = 'active'
       AND city = $1
       AND property_type = $2
       AND bedrooms BETWEEN $3 - 1 AND $3 + 1
       ORDER BY 
         CASE WHEN suburb = $4 THEN 0 ELSE 1 END,
         ABS(bedrooms - $3),
         created_at DESC
       LIMIT 10`,
      [city, propertyType, bedrooms, suburb]
    );

    // If not enough comparables in same city, expand search
    let allComparables = comparables.rows;
    if (allComparables.length < 5) {
      const moreComparables = await query(
        `SELECT price, bedrooms, bathrooms, suburb, property_type
         FROM properties
         WHERE status = 'active'
         AND property_type = $1
         AND bedrooms BETWEEN $2 - 1 AND $2 + 1
         ORDER BY created_at DESC
         LIMIT 15`,
        [propertyType, bedrooms]
      );
      allComparables = [...allComparables, ...moreComparables.rows].slice(0, 15);
    }

    // Use rules-based valuation
    const valuation = estimatePropertyValue(allComparables);

    return NextResponse.json({
      ...valuation,
      comparablesUsed: allComparables.length,
    });
  } catch (error) {
    console.error("Valuation error:", error);
    return NextResponse.json(
      { error: "Valuation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
