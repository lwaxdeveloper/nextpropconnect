import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePropertyDescription } from "@/lib/ai-rules";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, bulletPoints, propertyType, bedrooms, bathrooms, location } = await req.json();

    if (!title || !bulletPoints || !Array.isArray(bulletPoints) || bulletPoints.length === 0) {
      return NextResponse.json(
        { error: "Title and at least one bullet point required" },
        { status: 400 }
      );
    }

    const description = generatePropertyDescription(
      title,
      bulletPoints,
      propertyType || "property",
      bedrooms,
      bathrooms,
      location
    );

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Description generation error:", error);
    return NextResponse.json(
      { error: "Generation failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
