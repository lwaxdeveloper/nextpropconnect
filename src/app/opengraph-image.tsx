import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "NextPropConnect SA - Find Your Place in South Africa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Logo/Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "white",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 24,
              fontSize: 48,
            }}
          >
            🏠
          </div>
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "white",
              letterSpacing: -2,
            }}
          >
            NextPropConnect
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: "rgba(255, 255, 255, 0.9)",
            marginBottom: 48,
            fontWeight: 500,
          }}
        >
          Find Your Place in South Africa
        </div>

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 48,
          }}
        >
          {["Verified Listings", "Smart Valuations", "Direct Chat"].map((feature) => (
            <div
              key={feature}
              style={{
                display: "flex",
                alignItems: "center",
                background: "rgba(255, 255, 255, 0.15)",
                padding: "12px 24px",
                borderRadius: 50,
                color: "white",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              ✓ {feature}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 20,
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          nextpropconnect.co.za
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
