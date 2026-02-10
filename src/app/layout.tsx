import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NextPropConnect SA | Real Estate Platform",
  description:
    "South Africa's most trusted property platform. Find your place — from city apartments to township homes. Verified listings, smart valuations, direct chat.",
  keywords: [
    "South Africa real estate",
    "property for sale",
    "houses for rent",
    "estate agents",
    "NextPropConnect",
    "township property",
    "free valuation",
    "property valuation",
    "sell my house",
  ],
  openGraph: {
    title: "NextPropConnect SA | Real Estate Platform",
    description:
      "Find your place in South Africa. Verified listings, smart valuations, direct chat with agents.",
    url: "https://nextnextpropconnect.co.za",
    siteName: "NextPropConnect SA",
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextPropConnect SA",
    description: "Find your place in South Africa",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
