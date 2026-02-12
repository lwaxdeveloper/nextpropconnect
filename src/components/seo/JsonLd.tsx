"use client";

interface OrganizationJsonLdProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

export function OrganizationJsonLd({
  name = "NextPropConnect SA",
  url = "https://nextpropconnect.co.za",
  logo = "https://nextpropconnect.co.za/logo.png",
  description = "South Africa's most trusted property platform. Find your place — from city apartments to township homes.",
}: OrganizationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo,
    description,
    sameAs: [
      "https://facebook.com/nextpropconnect",
      "https://twitter.com/nextpropconnect",
      "https://instagram.com/nextpropconnect",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      areaServed: "ZA",
      availableLanguage: ["English", "Afrikaans", "Zulu", "Xhosa"],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface PropertyJsonLdProps {
  property: {
    id: number;
    title: string;
    description: string;
    price: number;
    property_type: string;
    listing_type: string;
    bedrooms?: number;
    bathrooms?: number;
    size_sqm?: number;
    location: string;
    images?: string[];
    agent_name?: string;
    created_at: string;
    updated_at?: string;
  };
}

export function PropertyJsonLd({ property }: PropertyJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `https://nextpropconnect.co.za/properties/${property.id}`,
    name: property.title,
    description: property.description,
    url: `https://nextpropconnect.co.za/properties/${property.id}`,
    datePosted: property.created_at,
    dateModified: property.updated_at || property.created_at,
    image: property.images?.[0] || "https://nextpropconnect.co.za/placeholder-property.jpg",
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "ZAR",
      availability: "https://schema.org/InStock",
      businessFunction: property.listing_type === "sale" 
        ? "https://schema.org/Sell" 
        : "https://schema.org/LeaseOut",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.location,
      addressCountry: "ZA",
    },
    ...(property.bedrooms && {
      numberOfRooms: property.bedrooms,
    }),
    ...(property.bathrooms && {
      numberOfBathroomsTotal: property.bathrooms,
    }),
    ...(property.size_sqm && {
      floorSize: {
        "@type": "QuantitativeValue",
        value: property.size_sqm,
        unitCode: "MTK",
      },
    }),
    ...(property.agent_name && {
      seller: {
        "@type": "RealEstateAgent",
        name: property.agent_name,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface WebsiteSearchJsonLdProps {
  url?: string;
}

export function WebsiteSearchJsonLd({
  url = "https://nextpropconnect.co.za",
}: WebsiteSearchJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "NextPropConnect SA",
    url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/properties?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
