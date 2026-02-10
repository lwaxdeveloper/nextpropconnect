import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { processPropertyAlerts } from "@/lib/alerts";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const propertyId = parseInt(id);
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Increment views
    await query(
      "UPDATE properties SET views_count = views_count + 1 WHERE id = $1",
      [propertyId]
    );

    // Get property with user and agent info
    const result = await query(
      `SELECT p.*,
        u.name as user_name, u.avatar_url as user_avatar, u.phone as user_phone,
        ap.id as agent_profile_id, ap.agency_name, ap.trust_score, ap.is_verified as agent_verified,
        ap.bio as agent_bio, ap.eaab_number, ap.ffc_number, ap.areas_served, ap.specializations,
        ap.commission_rate, ap.years_experience,
        au.name as agent_name, au.avatar_url as agent_avatar, au.phone as agent_phone
      FROM properties p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN agent_profiles ap ON p.agent_id = ap.id
      LEFT JOIN users au ON ap.user_id = au.id
      WHERE p.id = $1 AND p.status != 'deleted'`,
      [propertyId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get images
    const images = await query(
      "SELECT * FROM property_images WHERE property_id = $1 ORDER BY is_primary DESC, sort_order ASC",
      [propertyId]
    );

    // Get similar properties (same area, similar price, max 4)
    const prop = result.rows[0];
    const priceRange = prop.price * 0.3;
    const similar = await query(
      `SELECT p.*, 
        (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as image_url
      FROM properties p 
      WHERE p.id != $1 
        AND p.status = 'active' 
        AND p.listing_type = $2
        AND (p.suburb ILIKE $3 OR p.city ILIKE $4)
        AND p.price BETWEEN $5 AND $6
      ORDER BY 
        CASE WHEN p.suburb ILIKE $3 THEN 0 ELSE 1 END,
        ABS(p.price - $7)
      LIMIT 4`,
      [
        propertyId,
        prop.listing_type,
        prop.suburb || "___NOMATCH___",
        prop.city,
        prop.price - priceRange,
        prop.price + priceRange,
        prop.price,
      ]
    );

    return NextResponse.json({
      property: result.rows[0],
      images: images.rows,
      similar: similar.rows,
    });
  } catch (err) {
    console.error("GET /api/properties/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const propertyId = parseInt(id);
    const user = session.user as { id?: string };
    const userId = parseInt(user.id || "0");

    // Check ownership
    const existing = await query(
      "SELECT user_id FROM properties WHERE id = $1",
      [propertyId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.rows[0].user_id !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      property_type,
      listing_type,
      price,
      street_address,
      suburb,
      city,
      province,
      postal_code,
      bedrooms,
      bathrooms,
      garages,
      parking_spaces,
      floor_size,
      erf_size,
      year_built,
      has_pool,
      has_garden,
      has_security,
      has_pet_friendly,
      is_furnished,
      status,
    } = body;

    await query(
      `UPDATE properties SET
        title = $1, description = $2, property_type = $3, listing_type = $4, price = $5,
        street_address = $6, suburb = $7, city = $8, province = $9, postal_code = $10,
        bedrooms = $11, bathrooms = $12, garages = $13, parking_spaces = $14,
        floor_size = $15, erf_size = $16, year_built = $17,
        has_pool = $18, has_garden = $19, has_security = $20,
        has_pet_friendly = $21, is_furnished = $22, status = $23, updated_at = NOW()
      WHERE id = $24`,
      [
        title,
        description || null,
        property_type,
        listing_type,
        price,
        street_address || null,
        suburb || null,
        city,
        province,
        postal_code || null,
        bedrooms ?? null,
        bathrooms ?? null,
        garages ?? null,
        parking_spaces ?? null,
        floor_size ?? null,
        erf_size ?? null,
        year_built ?? null,
        has_pool || false,
        has_garden || false,
        has_security || false,
        has_pet_friendly || false,
        is_furnished || false,
        status || "active",
        propertyId,
      ]
    );

    // If property is now active, process alerts in background
    if (status === "active") {
      processPropertyAlerts(propertyId).catch(err => {
        console.error("[Alerts] Background processing failed:", err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/properties/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const propertyId = parseInt(id);
    const user = session.user as { id?: string };
    const userId = parseInt(user.id || "0");

    const existing = await query(
      "SELECT user_id FROM properties WHERE id = $1",
      [propertyId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.rows[0].user_id !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await query(
      "UPDATE properties SET status = 'deleted', updated_at = NOW() WHERE id = $1",
      [propertyId]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/properties/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
