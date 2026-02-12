import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OrganizationJsonLd, WebsiteSearchJsonLd } from "@/components/seo/JsonLd";
import FeedbackButton from "@/components/FeedbackButton";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0ea5e9",
};

export const metadata: Metadata = {
  title: {
    default: "NextPropConnect SA | South Africa's #1 Property Platform",
    template: "%s | NextPropConnect SA",
  },
  description:
    "South Africa's most trusted property platform. Find your place — from city apartments to township homes. Verified listings, smart valuations, direct chat with agents.",
  keywords: [
    "South Africa real estate",
    "property for sale South Africa",
    "houses for rent Johannesburg",
    "houses for sale Cape Town",
    "estate agents South Africa",
    "NextPropConnect",
    "township property",
    "free property valuation",
    "property valuation South Africa",
    "sell my house South Africa",
    "rent property Gauteng",
    "buy house Durban",
    "property listing South Africa",
    "real estate agent near me",
  ],
  authors: [{ name: "iTedia (Pty) Ltd", url: "https://itedia.co.za" }],
  creator: "iTedia (Pty) Ltd",
  publisher: "NextPropConnect SA",
  metadataBase: new URL("https://nextpropconnect.co.za"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NextPropConnect SA | South Africa's #1 Property Platform",
    description:
      "Find your place in South Africa. Verified listings, smart valuations, direct chat with agents. From city apartments to township homes.",
    url: "https://nextpropconnect.co.za",
    siteName: "NextPropConnect SA",
    locale: "en_ZA",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NextPropConnect SA - Find Your Place",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NextPropConnect SA | Find Your Place",
    description: "South Africa's most trusted property platform. Verified listings, smart valuations, direct chat.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add these when you set up Google Search Console
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "real estate",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
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
        <OrganizationJsonLd />
        <WebsiteSearchJsonLd />
        {children}
        <FeedbackButton />
      </body>
    </html>
  );
}
