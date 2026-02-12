import { auth } from "@/lib/auth";
import { query } from "@/lib/db";
import TemplatesClient from "./TemplatesClient";

export const dynamic = "force-dynamic";

const defaultTemplates = [
  {
    category: "general",
    title: "Thank You for Your Interest",
    content: "Hi {buyer_name}! Thank you for your interest in {property_name}. I'd be happy to help you with any questions. When would be a good time to chat?",
  },
  {
    category: "viewing",
    title: "Schedule a Viewing",
    content: "Hi {buyer_name}, I'd love to show you {property_name}. I have availability this week - would any of these times work for you?\n\n• [Day 1] at [Time]\n• [Day 2] at [Time]\n• [Day 3] at [Time]\n\nLet me know what suits you best!",
  },
  {
    category: "viewing",
    title: "Viewing Confirmation",
    content: "Great news! Your viewing for {property_name} is confirmed for [Date] at [Time]. The address is [Address]. I'll meet you there. See you soon!",
  },
  {
    category: "availability",
    title: "Property Still Available",
    content: "Hi {buyer_name}! Great news - {property_name} is still available at {price}. Would you like to schedule a viewing this week?",
  },
  {
    category: "price",
    title: "Price Information",
    content: "Hi {buyer_name}, thanks for asking about {property_name}. The asking price is {price}. The property includes [key features]. Would you like more details or to arrange a viewing?",
  },
  {
    category: "documents",
    title: "Documents Request",
    content: "Hi {buyer_name}, thank you for your interest in {property_name}. I'll need the following documents to proceed:\n\n• Proof of ID\n• Proof of income/pre-approval\n• Proof of residence\n\nPlease send these at your convenience.",
  },
];

export default async function TemplatesPage() {
  const session = await auth();
  const user = session!.user as { id?: string };
  const userId = parseInt(user.id || "0");

  const result = await query(
    `SELECT * FROM quick_replies WHERE agent_id = $1 ORDER BY usage_count DESC, created_at DESC`,
    [userId]
  );

  // If no templates exist, create default ones
  if (result.rows.length === 0) {
    for (const template of defaultTemplates) {
      await query(
        `INSERT INTO quick_replies (agent_id, title, content, category) VALUES ($1, $2, $3, $4)`,
        [userId, template.title, template.content, template.category]
      );
    }
    // Re-fetch with the new templates
    const newResult = await query(
      `SELECT * FROM quick_replies WHERE agent_id = $1 ORDER BY usage_count DESC, created_at DESC`,
      [userId]
    );
    return (
      <div>
        <h1 className="text-2xl font-black text-dark mb-6">Quick Reply Templates</h1>
        <TemplatesClient initialTemplates={newResult.rows} />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-dark mb-6">Quick Reply Templates</h1>
      <TemplatesClient initialTemplates={result.rows} />
    </div>
  );
}
