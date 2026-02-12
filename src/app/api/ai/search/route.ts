import { NextRequest, NextResponse } from "next/server";
import { parsePropertySearch } from "@/lib/ai-rules";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { query: searchQuery } = await req.json();

    if (!searchQuery || typeof searchQuery !== "string") {
      return NextResponse.json({ error: "Query required" }, { status: 400 });
    }

    // Parse natural language query using rules engine
    const params = parsePropertySearch(searchQuery);

    // Build SQL query based on parsed params
    const conditions: string[] = ["p.status = 'active'"];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (params.bedrooms) {
      conditions.push(`p.bedrooms >= $${paramIndex}`);
      values.push(params.bedrooms);
      paramIndex++;
    }

    if (params.bathrooms) {
      conditions.push(`p.bathrooms >= $${paramIndex}`);
      values.push(params.bathrooms);
      paramIndex++;
    }

    if (params.minPrice) {
      conditions.push(`p.price >= $${paramIndex}`);
      values.push(params.minPrice);
      paramIndex++;
    }

    if (params.maxPrice) {
      conditions.push(`p.price <= $${paramIndex}`);
      values.push(params.maxPrice);
      paramIndex++;
    }

    if (params.propertyType) {
      conditions.push(`LOWER(p.property_type) = LOWER($${paramIndex})`);
      values.push(params.propertyType);
      paramIndex++;
    }

    if (params.location) {
      conditions.push(`(LOWER(p.suburb) LIKE LOWER($${paramIndex}) OR LOWER(p.city) LIKE LOWER($${paramIndex}))`);
      values.push(`%${params.location}%`);
      paramIndex++;
    }

    if (params.listingType) {
      conditions.push(`p.listing_type = $${paramIndex}`);
      values.push(params.listingType);
      paramIndex++;
    }

    const sql = `
      SELECT p.id, p.title, p.price, p.bedrooms, p.bathrooms, p.property_type,
             p.suburb, p.city, p.listing_type,
             (SELECT ARRAY_AGG(pi.url) FROM property_images pi WHERE pi.property_id = p.id LIMIT 3) as images
      FROM properties p
      WHERE ${conditions.join(" AND ")}
      ORDER BY p.created_at DESC
      LIMIT 20
    `;

    const result = await query(sql, values);

    return NextResponse.json({
      parsed: params,
      properties: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("AI search error:", error);
    return NextResponse.json(
      { error: "Search failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
