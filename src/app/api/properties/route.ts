import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { auth } from "@/lib/auth";
import { processPropertyAlerts } from "@/lib/alerts";
import { canCreateListing } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const listing_type = url.searchParams.get("listing_type");
    const property_type = url.searchParams.get("property_type");
    const min_price = url.searchParams.get("min_price");
    const max_price = url.searchParams.get("max_price");
    const bedrooms = url.searchParams.get("bedrooms");
    const bathrooms = url.searchParams.get("bathrooms");
    const province = url.searchParams.get("province");
    const city = url.searchParams.get("city");
    const suburb = url.searchParams.get("suburb");
    const search = url.searchParams.get("search");
    const sort = url.searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "12")));
    const offset = (page - 1) * limit;

    const conditions: string[] = ["p.status = 'active'"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (listing_type) {
      conditions.push(`p.listing_type = $${paramIndex++}`);
      params.push(listing_type);
    }
    if (property_type) {
      conditions.push(`p.property_type = $${paramIndex++}`);
      params.push(property_type);
    }
    if (min_price) {
      conditions.push(`p.price >= $${paramIndex++}`);
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      conditions.push(`p.price <= $${paramIndex++}`);
      params.push(parseFloat(max_price));
    }
    if (bedrooms) {
      const bedsVal = parseInt(bedrooms);
      if (bedsVal >= 5) {
        conditions.push(`p.bedrooms >= $${paramIndex++}`);
      } else {
        conditions.push(`p.bedrooms = $${paramIndex++}`);
      }
      params.push(bedsVal);
    }
    if (bathrooms) {
      const bathsVal = parseInt(bathrooms);
      if (bathsVal >= 3) {
        conditions.push(`p.bathrooms >= $${paramIndex++}`);
      } else {
        conditions.push(`p.bathrooms = $${paramIndex++}`);
      }
      params.push(bathsVal);
    }
    if (province) {
      conditions.push(`p.province ILIKE $${paramIndex++}`);
      params.push(province);
    }
    if (city) {
      conditions.push(`p.city ILIKE $${paramIndex++}`);
      params.push(`%${city}%`);
    }
    if (suburb) {
      conditions.push(`p.suburb ILIKE $${paramIndex++}`);
      params.push(`%${suburb}%`);
    }
    if (search) {
      conditions.push(
        `(p.title ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex} OR p.suburb ILIKE $${paramIndex} OR p.city ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderBy = "p.created_at DESC";
    if (sort === "price_asc") orderBy = "p.price ASC";
    else if (sort === "price_desc") orderBy = "p.price DESC";
    else if (sort === "newest") orderBy = "p.is_featured DESC, p.created_at DESC";

    // Count
    const countResult = await query(
      `SELECT COUNT(*) FROM properties p ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Results with first image
    const result = await query(
      `SELECT p.*, 
        (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC, pi.sort_order ASC LIMIT 1) as image_url
      FROM properties p
      ${where}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      properties: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET /api/properties error:", err);
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = session.user as { id?: string };
    const userId = user.id;
    if (!userId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    // Check subscription limits
    const canCreate = await canCreateListing(parseInt(userId));
    if (!canCreate.allowed) {
      return NextResponse.json(
        { error: canCreate.reason || "Listing limit reached" },
        { status: 403 }
      );
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

    if (!title || !property_type || !listing_type || !price || !city || !province) {
      return NextResponse.json(
        { error: "Missing required fields: title, property_type, listing_type, price, city, province" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO properties (
        user_id, title, description, property_type, listing_type, price,
        street_address, suburb, city, province, postal_code,
        bedrooms, bathrooms, garages, parking_spaces, floor_size, erf_size, year_built,
        has_pool, has_garden, has_security, has_pet_friendly, is_furnished, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      ) RETURNING id`,
      [
        parseInt(userId),
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
        status || "draft",
      ]
    );

    const propertyId = result.rows[0].id;

    // If property is active, process alerts in background
    if (status === "active") {
      // Don't await - process alerts in background
      processPropertyAlerts(propertyId).catch(err => {
        console.error("[Alerts] Background processing failed:", err);
      });
    }

    return NextResponse.json({ id: propertyId }, { status: 201 });
  } catch (err) {
    console.error("POST /api/properties error:", err);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
