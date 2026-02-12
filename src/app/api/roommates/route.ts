import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "looking" or "offering"
    const city = searchParams.get("city");
    const limit = parseInt(searchParams.get("limit") || "20");

    let sql = `
      SELECT rl.*, u.name, u.avatar_url,
        p.title as property_title,
        (SELECT url FROM property_images WHERE property_id = p.id ORDER BY is_primary DESC LIMIT 1) as property_image
      FROM roommate_listings rl
      JOIN users u ON rl.user_id = u.id
      LEFT JOIN properties p ON rl.property_id = p.id
      WHERE rl.status = 'active'
    `;
    const params: any[] = [];

    if (type) {
      params.push(type);
      sql += ` AND rl.type = $${params.length}`;
    }

    if (city) {
      params.push(city);
      sql += ` AND rl.city ILIKE $${params.length}`;
    }

    sql += ` ORDER BY rl.created_at DESC LIMIT ${limit}`;

    const result = await query(sql, params);
    return NextResponse.json({ listings: result.rows });
  } catch (error) {
    console.error("Error fetching roommate listings:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as { id?: string };
    const userId = parseInt(user.id || "0");

    const body = await request.json();
    const {
      type,
      title,
      description,
      city,
      province,
      area,
      budget_min,
      budget_max,
      move_in_date,
      rent_amount,
      deposit_amount,
      available_from,
      is_furnished,
      has_own_bathroom,
      preferred_gender,
      smoker_friendly,
      pet_friendly,
      couples_ok,
      my_age,
      my_gender,
      my_occupation,
      about_me,
      lifestyle,
    } = body;

    if (!type || !title || !city) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO roommate_listings (
        user_id, type, title, description, city, province, area,
        budget_min, budget_max, move_in_date,
        rent_amount, deposit_amount, available_from,
        is_furnished, has_own_bathroom,
        preferred_gender, smoker_friendly, pet_friendly, couples_ok,
        my_age, my_gender, my_occupation, about_me, lifestyle
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13,
        $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23, $24
      ) RETURNING id`,
      [
        userId, type, title, description, city, province, area,
        budget_min || null, budget_max || null, move_in_date || null,
        rent_amount || null, deposit_amount || null, available_from || null,
        is_furnished || false, has_own_bathroom || false,
        preferred_gender || null, smoker_friendly || false, pet_friendly || false, couples_ok || false,
        my_age || null, my_gender || null, my_occupation || null, about_me || null, lifestyle || null,
      ]
    );

    return NextResponse.json({ id: result.rows[0].id });
  } catch (error) {
    console.error("Error creating roommate listing:", error);
    return NextResponse.json({ error: "Failed to create listing" }, { status: 500 });
  }
}
