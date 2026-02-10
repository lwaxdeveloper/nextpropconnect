/**
 * Property Alerts Service
 * 
 * Matches new properties against user alerts and sends notifications
 */

import { query } from "./db";
import { sendPropertyAlertEmail } from "./email";

const MSGHUB_URL = process.env.MSGHUB_URL || "https://messaging.itedia.co.za";
const MSGHUB_API_KEY = process.env.MSGHUB_API_KEY || "";

interface Property {
  id: number;
  title: string;
  price: number;
  listing_type: string;
  property_type: string;
  bedrooms: number | null;
  province: string;
  city: string;
  suburb: string | null;
  image_url: string | null;
}

interface Alert {
  id: number;
  user_id: number;
  listing_type: string | null;
  property_type: string | null;
  min_price: number | null;
  max_price: number | null;
  bedrooms: number | null;
  province: string | null;
  city: string | null;
  suburb: string | null;
}

interface UserInfo {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp_enabled: boolean;
}

/**
 * Check if a property matches an alert's criteria
 */
function propertyMatchesAlert(property: Property, alert: Alert): boolean {
  // Listing type
  if (alert.listing_type && property.listing_type !== alert.listing_type) {
    return false;
  }

  // Property type
  if (alert.property_type && property.property_type !== alert.property_type) {
    return false;
  }

  // Price range
  if (alert.min_price && property.price < alert.min_price) {
    return false;
  }
  if (alert.max_price && property.price > alert.max_price) {
    return false;
  }

  // Bedrooms (at least this many)
  if (alert.bedrooms && property.bedrooms && property.bedrooms < alert.bedrooms) {
    return false;
  }

  // Location
  if (alert.province && property.province.toLowerCase() !== alert.province.toLowerCase()) {
    return false;
  }
  if (alert.city && !property.city.toLowerCase().includes(alert.city.toLowerCase())) {
    return false;
  }
  if (alert.suburb && property.suburb && !property.suburb.toLowerCase().includes(alert.suburb.toLowerCase())) {
    return false;
  }

  return true;
}

/**
 * Format price for display
 */
function formatPrice(price: number): string {
  return `R ${price.toLocaleString("en-ZA")}`;
}

/**
 * Send WhatsApp notification for matching property
 */
async function sendWhatsAppAlert(
  phone: string,
  userName: string,
  property: Property
): Promise<boolean> {
  if (!MSGHUB_API_KEY) {
    console.log("[Alerts] MsgHub not configured, skipping WhatsApp");
    return false;
  }

  const message = 
    `🏠 *Property Alert!*\n\n` +
    `Hi ${userName}, we found a property matching your search!\n\n` +
    `📍 *${property.title}*\n` +
    `💰 ${formatPrice(property.price)}\n` +
    `📌 ${property.city}, ${property.province}\n` +
    (property.bedrooms ? `🛏️ ${property.bedrooms} beds\n` : "") +
    `\n👉 View: https://nextnextpropconnect.co.za/properties/${property.id}`;

  try {
    const response = await fetch(`${MSGHUB_URL}/api/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": MSGHUB_API_KEY
      },
      body: JSON.stringify({
        channel: "WHATSAPP",
        to: phone.replace(/\D/g, "").replace(/^0/, "27"),
        content: message
      })
    });

    if (response.ok) {
      console.log(`[Alerts] WhatsApp sent to ${phone} for property ${property.id}`);
      return true;
    } else {
      console.error(`[Alerts] WhatsApp failed:`, await response.text());
      return false;
    }
  } catch (error) {
    console.error(`[Alerts] WhatsApp error:`, error);
    return false;
  }
}

/**
 * Process alerts for a newly created property
 */
export async function processPropertyAlerts(propertyId: number): Promise<{ matched: number; notified: number }> {
  let matched = 0;
  let notified = 0;

  try {
    // Get the property details
    const propResult = await query(
      `SELECT p.*, 
        (SELECT pi.url FROM property_images pi WHERE pi.property_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) as image_url
       FROM properties p WHERE p.id = $1`,
      [propertyId]
    );

    if (propResult.rows.length === 0) {
      console.log(`[Alerts] Property ${propertyId} not found`);
      return { matched: 0, notified: 0 };
    }

    const property: Property = propResult.rows[0];

    // Get all active alerts
    const alertsResult = await query(
      `SELECT pa.*, u.id as user_id, u.name, u.email, u.phone,
        COALESCE((SELECT whatsapp_enabled FROM whatsapp_settings WHERE user_id = u.id), false) as whatsapp_enabled
       FROM property_alerts pa
       JOIN users u ON u.id = pa.user_id
       WHERE pa.is_active = true`
    );

    // Group alerts by user
    const userAlerts: Map<number, { user: UserInfo; alerts: Alert[] }> = new Map();

    for (const row of alertsResult.rows) {
      const alert: Alert = {
        id: row.id,
        user_id: row.user_id,
        listing_type: row.listing_type,
        property_type: row.property_type,
        min_price: row.min_price,
        max_price: row.max_price,
        bedrooms: row.bedrooms,
        province: row.province,
        city: row.city,
        suburb: row.suburb
      };

      // Check if property matches this alert
      if (propertyMatchesAlert(property, alert)) {
        matched++;

        if (!userAlerts.has(row.user_id)) {
          userAlerts.set(row.user_id, {
            user: {
              id: row.user_id,
              name: row.name,
              email: row.email,
              phone: row.phone,
              whatsapp_enabled: row.whatsapp_enabled
            },
            alerts: []
          });
        }
        userAlerts.get(row.user_id)!.alerts.push(alert);
      }
    }

    // Notify each user (once per user, even if multiple alerts match)
    for (const [userId, { user, alerts }] of userAlerts) {
      let userNotified = false;

      // Send WhatsApp if enabled and phone available
      if (user.whatsapp_enabled && user.phone) {
        const sent = await sendWhatsAppAlert(user.phone, user.name, property);
        if (sent) userNotified = true;
      }

      // Send email if available
      if (user.email) {
        const alertName = alerts[0].city || alerts[0].province || "Your Search";
        const sent = await sendPropertyAlertEmail(
          user.email,
          user.name,
          [{
            id: property.id,
            title: property.title,
            price: formatPrice(property.price),
            location: `${property.city}, ${property.province}`,
            imageUrl: property.image_url
          }],
          alertName
        );
        if (sent) userNotified = true;
      }

      if (userNotified) {
        notified++;

        // Update last_sent_at for matched alerts
        const alertIds = alerts.map(a => a.id);
        await query(
          `UPDATE property_alerts SET last_sent_at = NOW() WHERE id = ANY($1)`,
          [alertIds]
        );
      }
    }

    console.log(`[Alerts] Property ${propertyId}: ${matched} alerts matched, ${notified} users notified`);
  } catch (error) {
    console.error(`[Alerts] Error processing alerts:`, error);
  }

  return { matched, notified };
}
