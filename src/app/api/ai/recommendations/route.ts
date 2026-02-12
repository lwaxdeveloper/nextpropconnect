import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user ? parseInt((session.user as { id?: string }).id || "0") : 0;

    // Get user's saved/viewed properties to understand preferences
    let userPreferences: { avg_price: number; property_type: string; city: string } | null = null;

    if (userId) {
      // Get preferences from saved properties
      const prefsResult = await query(
        `SELECT 
           AVG(p.price)::numeric as avg_price,
           MODE() WITHIN GROUP (ORDER BY p.property_type) as property_type,
           MODE() WITHIN GROUP (ORDER BY p.city) as city
         FROM saved_properties sp
         JOIN properties p ON sp.property_id = p.id
         WHERE sp.user_id = $1
         GROUP BY sp.user_id`,
        [userId]
      );
      
      if (prefsResult.rows.length > 0) {
        userPreferences = prefsResult.rows[0];
      }
    }

    let recommendations;
    let reason = "Latest properties";
    let personalized = false;

    if (userPreferences && userPreferences.avg_price) {
      // Personalized recommendations based on user preferences
      const priceRange = userPreferences.avg_price * 0.3; // 30% range
      
      recommendations = await query(
        `SELECT p.id, p.title, p.property_type as type, p.price, p.bedrooms, p.bathrooms,
                p.suburb, p.city, p.listing_type,
                (SELECT ARRAY_AGG(pi.url) FROM property_images pi WHERE pi.property_id = p.id LIMIT 3) as images
         FROM properties p
         WHERE p.status = 'active'
         AND (
           (p.price BETWEEN $1 AND $2)
           OR p.property_type = $3
           OR p.city = $4
         )
         ORDER BY 
           CASE WHEN p.city = $4 THEN 0 ELSE 1 END,
           CASE WHEN p.property_type = $3 THEN 0 ELSE 1 END,
           ABS(p.price - $5),
           p.created_at DESC
         LIMIT 8`,
        [
          userPreferences.avg_price - priceRange,
          userPreferences.avg_price + priceRange,
          userPreferences.property_type,
          userPreferences.city,
          userPreferences.avg_price
        ]
      );
      
      reason = "Based on your saved properties";
      personalized = true;
    } else {
      // Default: featured/recent properties
      recommendations = await query(
        `SELECT p.id, p.title, p.property_type as type, p.price, p.bedrooms, p.bathrooms,
                p.suburb, p.city, p.listing_type,
                (SELECT ARRAY_AGG(pi.url) FROM property_images pi WHERE pi.property_id = p.id LIMIT 3) as images
         FROM properties p
         WHERE p.status = 'active'
         ORDER BY p.is_featured DESC, p.created_at DESC
         LIMIT 8`
      );
    }

    return NextResponse.json({
      recommendations: recommendations.rows,
      reason,
      personalized,
    });
  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
