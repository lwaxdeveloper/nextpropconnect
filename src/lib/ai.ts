import OpenAI from "openai";

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface PropertySearchParams {
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  location?: string;
  amenities?: string[];
  listingType?: "sale" | "rent";
}

// Parse natural language property search
export async function parsePropertySearch(query: string): Promise<PropertySearchParams> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a property search parser for a South African real estate platform. 
Extract search parameters from natural language queries.
Return a JSON object with these optional fields:
- bedrooms: number
- bathrooms: number  
- minPrice: number (in ZAR)
- maxPrice: number (in ZAR)
- propertyType: "house" | "apartment" | "townhouse" | "land" | "commercial"
- location: string (suburb, city, or area)
- amenities: string[] (pool, garden, garage, security, etc)
- listingType: "sale" | "rent"

Price hints: "under 2M" = maxPrice 2000000, "R5000/month" = rent with maxPrice 5000
South African locations: Sandton, Soweto, Cape Town, Durban, Pretoria, etc.
Only include fields you can confidently extract.`,
      },
      { role: "user", content: query },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return result as PropertySearchParams;
}

// Generate property description from bullet points
export async function generatePropertyDescription(
  title: string,
  bulletPoints: string[],
  propertyType: string,
  bedrooms?: number,
  bathrooms?: number,
  location?: string
): Promise<string> {
  const context = [
    `Property: ${title}`,
    propertyType && `Type: ${propertyType}`,
    bedrooms && `Bedrooms: ${bedrooms}`,
    bathrooms && `Bathrooms: ${bathrooms}`,
    location && `Location: ${location}`,
    `Features:\n${bulletPoints.map((p) => `- ${p}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a South African real estate copywriter. Write compelling, professional property descriptions.
- Use engaging language that sells the lifestyle
- Highlight key features naturally
- Include the location benefits
- Keep it between 150-250 words
- Use ZAR for any prices
- Don't make up features not in the bullet points
- End with a call to action`,
      },
      { role: "user", content: `Write a property description based on:\n\n${context}` },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || "";
}

// Get property recommendations based on user preferences
export async function getPropertyRecommendations(
  viewedProperties: { title: string; type: string; price: number; location: string }[],
  savedProperties: { title: string; type: string; price: number; location: string }[],
  allProperties: { id: number; title: string; type: string; price: number; location: string }[]
): Promise<number[]> {
  if (viewedProperties.length === 0 && savedProperties.length === 0) {
    // Return random popular properties if no history
    return allProperties.slice(0, 6).map((p) => p.id);
  }

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a property recommendation engine. Based on the user's viewed and saved properties, 
identify patterns (price range, property type, location preferences) and recommend similar properties.
Return a JSON object with: { "recommendedIds": [array of property IDs], "reason": "brief explanation" }
Recommend 4-8 properties that match their preferences.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          viewed: viewedProperties,
          saved: savedProperties,
          available: allProperties.map((p) => ({
            id: p.id,
            title: p.title,
            type: p.type,
            price: p.price,
            location: p.location,
          })),
        }),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const result = JSON.parse(response.choices[0].message.content || '{"recommendedIds":[]}');
  return result.recommendedIds || [];
}

// Estimate property value
export async function estimatePropertyValue(
  propertyDetails: {
    bedrooms: number;
    bathrooms: number;
    propertyType: string;
    suburb: string;
    city: string;
    size?: number;
    amenities?: string[];
  },
  comparables: {
    price: number;
    bedrooms: number;
    bathrooms: number;
    suburb: string;
    propertyType: string;
  }[]
): Promise<{
  estimatedValue: number;
  lowRange: number;
  highRange: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
}> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a South African property valuation assistant. Estimate property values based on:
- Comparable sales data provided
- Property characteristics (beds, baths, type, size)
- Location (suburb/city)
- Current market conditions

Return a JSON object with:
- estimatedValue: number (ZAR)
- lowRange: number (conservative estimate)
- highRange: number (optimistic estimate)
- confidence: "low" | "medium" | "high" based on data quality
- reasoning: brief explanation of the valuation

Be realistic about South African property prices. If insufficient data, indicate low confidence.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          property: propertyDetails,
          comparables: comparables,
        }),
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  return {
    estimatedValue: result.estimatedValue || 0,
    lowRange: result.lowRange || 0,
    highRange: result.highRange || 0,
    confidence: result.confidence || "low",
    reasoning: result.reasoning || "Unable to estimate",
  };
}

export { getOpenAI };
