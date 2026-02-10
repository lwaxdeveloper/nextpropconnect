import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getInvoiceDetails, generateInvoiceHtml } from "@/lib/invoice";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = parseInt((session.user as { id?: string }).id || "0");
  const { id } = await params;
  const invoiceId = parseInt(id);

  if (isNaN(invoiceId)) {
    return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
  }

  try {
    // Check if user owns this invoice
    const ownerCheck = await query(
      `SELECT user_id FROM invoices WHERE id = $1`,
      [invoiceId]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (ownerCheck.rows[0].user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const details = await getInvoiceDetails(invoiceId);
    if (!details) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Check if HTML format requested
    const format = request.nextUrl.searchParams.get("format");
    
    if (format === "html") {
      const html = generateInvoiceHtml(details);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="invoice-${details.invoiceNumber}.html"`,
        },
      });
    }

    // Return JSON details by default
    return NextResponse.json(details);
  } catch (error) {
    console.error("[Invoice] Error:", error);
    return NextResponse.json({ error: "Failed to get invoice" }, { status: 500 });
  }
}
