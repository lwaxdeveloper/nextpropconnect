import { MetadataRoute } from "next";
import { query } from "@/lib/db";

const BASE_URL = "https://nextpropconnect.co.za";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/properties`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamic property pages
  let propertyPages: MetadataRoute.Sitemap = [];
  try {
    const result = await query(`
      SELECT id, updated_at FROM properties 
      WHERE status = 'active' 
      ORDER BY updated_at DESC 
      LIMIT 5000
    `);
    
    propertyPages = result.rows.map((property: any) => ({
      url: `${BASE_URL}/properties/${property.id}`,
      lastModified: new Date(property.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Error generating sitemap properties:", error);
  }

  // Location pages (major SA cities)
  const locations = [
    "johannesburg", "cape-town", "durban", "pretoria", "port-elizabeth",
    "bloemfontein", "east-london", "nelspruit", "polokwane", "kimberley",
    "soweto", "sandton", "randburg", "centurion", "midrand",
    "boksburg", "benoni", "germiston", "roodepoort", "krugersdorp"
  ];

  const locationPages: MetadataRoute.Sitemap = locations.map((location) => ({
    url: `${BASE_URL}/properties?location=${location}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...propertyPages, ...locationPages];
}
