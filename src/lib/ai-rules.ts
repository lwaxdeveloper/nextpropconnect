// Rules-based AI alternative - zero API costs

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

// Parse natural language property search using rules
export function parsePropertySearch(query: string): PropertySearchParams {
  const q = query.toLowerCase();
  const result: PropertySearchParams = {};

  // Extract bedrooms
  const bedMatch = q.match(/(\d+)\s*(?:bed|bedroom|br)/);
  if (bedMatch) result.bedrooms = parseInt(bedMatch[1]);

  // Extract bathrooms
  const bathMatch = q.match(/(\d+)\s*(?:bath|bathroom)/);
  if (bathMatch) result.bathrooms = parseInt(bathMatch[1]);

  // Extract price - "under 2M", "below R3 million", "max 1.5m", "R5000/month"
  const pricePatterns = [
    /(?:under|below|max|less than|up to)\s*r?\s*([\d.]+)\s*(?:m|mil|million)/i,
    /(?:under|below|max|less than|up to)\s*r?\s*([\d,]+)(?:k)?/i,
    /r\s*([\d,]+)\s*(?:\/month|pm|per month)/i,
    /budget\s*(?:of)?\s*r?\s*([\d.]+)\s*(?:m|mil|million)?/i,
  ];

  for (const pattern of pricePatterns) {
    const match = q.match(pattern);
    if (match) {
      let price = parseFloat(match[1].replace(/,/g, ""));
      // Check if it's millions
      if (q.includes("m") || q.includes("mil") || q.includes("million")) {
        price = price * 1000000;
      } else if (q.includes("k")) {
        price = price * 1000;
      } else if (price < 1000) {
        // Small number, probably millions
        price = price * 1000000;
      }
      result.maxPrice = price;
      break;
    }
  }

  // Extract min price
  const minPriceMatch = q.match(/(?:from|above|min|starting|over)\s*r?\s*([\d.]+)\s*(?:m|mil|million)?/i);
  if (minPriceMatch) {
    let price = parseFloat(minPriceMatch[1].replace(/,/g, ""));
    if (q.includes("m") || q.includes("mil") || q.includes("million")) {
      price = price * 1000000;
    }
    result.minPrice = price;
  }

  // Detect rent vs sale
  if (q.includes("rent") || q.includes("to let") || q.includes("/month") || q.includes("pm") || q.includes("per month")) {
    result.listingType = "rent";
  } else if (q.includes("buy") || q.includes("sale") || q.includes("purchase")) {
    result.listingType = "sale";
  }

  // Property type
  const typeMap: Record<string, string> = {
    house: "house",
    home: "house",
    apartment: "apartment",
    flat: "apartment",
    townhouse: "townhouse",
    land: "land",
    plot: "land",
    stand: "land",
    commercial: "commercial",
    office: "commercial",
    retail: "commercial",
  };
  for (const [keyword, type] of Object.entries(typeMap)) {
    if (q.includes(keyword)) {
      result.propertyType = type;
      break;
    }
  }

  // SA locations (major cities and suburbs)
  const locations = [
    // Gauteng
    "johannesburg", "joburg", "jozi", "sandton", "rosebank", "randburg", "fourways",
    "midrand", "centurion", "pretoria", "bryanston", "morningside", "hyde park",
    "parkhurst", "melville", "soweto", "orlando", "diepkloof", "roodepoort",
    "krugersdorp", "germiston", "boksburg", "benoni", "kempton park", "edenvale",
    // Western Cape
    "cape town", "sea point", "camps bay", "constantia", "claremont", "newlands",
    "stellenbosch", "paarl", "franschhoek", "somerset west", "strand", "gordons bay",
    "table view", "milnerton", "blouberg", "durbanville", "bellville",
    // KZN
    "durban", "umhlanga", "ballito", "la lucia", "morningside", "berea",
    "pietermaritzburg", "hillcrest", "kloof", "pinetown", "westville",
    // Eastern Cape
    "port elizabeth", "gqeberha", "east london", "mthatha",
    // Free State
    "bloemfontein",
    // Mpumalanga
    "nelspruit", "mbombela", "white river",
    // Limpopo
    "polokwane",
    // North West
    "rustenburg",
  ];

  for (const loc of locations) {
    if (q.includes(loc)) {
      // Capitalize properly
      result.location = loc.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      break;
    }
  }

  // Amenities
  const amenityKeywords = ["pool", "garden", "garage", "security", "view", "pet", "furnished", "parking", "gym", "balcony"];
  const foundAmenities = amenityKeywords.filter(a => q.includes(a));
  if (foundAmenities.length > 0) {
    result.amenities = foundAmenities;
  }

  return result;
}

// Generate property description from bullet points using templates
export function generatePropertyDescription(
  title: string,
  bulletPoints: string[],
  propertyType: string,
  bedrooms?: number,
  bathrooms?: number,
  location?: string
): string {
  const features = bulletPoints.filter(p => p.trim()).join(", ").toLowerCase();
  
  const intros = [
    `Welcome to this exceptional ${propertyType || "property"}`,
    `Discover your dream ${propertyType || "home"}`,
    `An outstanding ${propertyType || "property"} awaits`,
    `This stunning ${propertyType || "property"} offers`,
  ];
  
  const intro = intros[Math.floor(Math.random() * intros.length)];
  
  let description = `${intro}`;
  
  if (location) {
    description += ` in the sought-after area of ${location}`;
  }
  description += ".\n\n";
  
  if (bedrooms || bathrooms) {
    description += `Featuring ${bedrooms || "spacious"} bedroom${bedrooms !== 1 ? "s" : ""} and ${bathrooms || "modern"} bathroom${bathrooms !== 1 ? "s" : ""}, this property is perfect for families or professionals seeking comfort and style.\n\n`;
  }
  
  if (bulletPoints.length > 0) {
    description += `Key highlights include: ${features}.\n\n`;
  }
  
  description += `Don't miss this opportunity to make this ${propertyType || "property"} your new home. Contact us today to arrange a viewing!`;
  
  return description;
}

// Estimate property value using comparable averages
export function estimatePropertyValue(
  comparables: { price: number; bedrooms: number; suburb: string }[]
): {
  estimatedValue: number;
  lowRange: number;
  highRange: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
} {
  if (comparables.length === 0) {
    return {
      estimatedValue: 0,
      lowRange: 0,
      highRange: 0,
      confidence: "low",
      reasoning: "No comparable properties found in the database.",
    };
  }

  const prices = comparables.map(c => c.price).sort((a, b) => a - b);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const median = prices[Math.floor(prices.length / 2)];
  
  // Use median as estimate (more robust to outliers)
  const estimatedValue = Math.round(median);
  const lowRange = Math.round(prices[0] * 0.95);
  const highRange = Math.round(prices[prices.length - 1] * 1.05);
  
  // Confidence based on sample size
  let confidence: "low" | "medium" | "high" = "low";
  if (comparables.length >= 10) confidence = "high";
  else if (comparables.length >= 5) confidence = "medium";
  
  const sameSuburb = comparables.filter(c => c.suburb === comparables[0]?.suburb).length;
  
  return {
    estimatedValue,
    lowRange,
    highRange,
    confidence,
    reasoning: `Based on ${comparables.length} similar properties${sameSuburb > 1 ? ` (${sameSuburb} in same suburb)` : ""}. Median price used for estimate.`,
  };
}
