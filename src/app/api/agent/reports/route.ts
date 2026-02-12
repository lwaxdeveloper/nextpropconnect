import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id?: string; name?: string };
  const userId = parseInt(user.id || "0");
  const format = request.nextUrl.searchParams.get("format") || "csv";
  const type = request.nextUrl.searchParams.get("type") || "overview";

  try {
    // Get analytics data
    const listingsResult = await query(
      `SELECT p.id, p.title, p.views_count, p.inquiries_count, p.suburb, p.city, 
              p.price, p.listing_type, p.status, p.created_at
       FROM properties p
       WHERE p.user_id = $1 AND p.status != 'deleted'
       ORDER BY p.views_count DESC`,
      [userId]
    );

    const leadsResult = await query(
      `SELECT l.id, l.contact_name, l.contact_email, l.contact_phone, l.status, 
              l.priority, l.created_at, p.title as property_title
       FROM leads l
       LEFT JOIN properties p ON l.property_id = p.id
       WHERE l.agent_id = $1
       ORDER BY l.created_at DESC`,
      [userId]
    );

    const statsResult = await query(
      `SELECT 
         COALESCE(SUM(views_count), 0)::int as total_views,
         COALESCE(SUM(inquiries_count), 0)::int as total_inquiries,
         COUNT(*) as total_listings,
         COUNT(*) FILTER (WHERE status = 'active') as active_listings
       FROM properties WHERE user_id = $1 AND status != 'deleted'`,
      [userId]
    );

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    if (format === "csv") {
      let csvContent = "";
      
      if (type === "listings") {
        // Listings report
        csvContent = "ID,Title,Location,Price,Type,Status,Views,Inquiries,Created\n";
        for (const l of listingsResult.rows) {
          csvContent += `${l.id},"${l.title}","${l.suburb || ''}, ${l.city || ''}",R${l.price},${l.listing_type},${l.status},${l.views_count},${l.inquiries_count},${new Date(l.created_at).toLocaleDateString()}\n`;
        }
      } else if (type === "leads") {
        // Leads report
        csvContent = "ID,Contact Name,Email,Phone,Property,Status,Priority,Date\n";
        for (const l of leadsResult.rows) {
          csvContent += `${l.id},"${l.contact_name || ''}","${l.contact_email || ''}","${l.contact_phone || ''}","${l.property_title || ''}",${l.status},${l.priority || 'medium'},${new Date(l.created_at).toLocaleDateString()}\n`;
        }
      } else {
        // Overview report
        const stats = statsResult.rows[0];
        csvContent = "PropConnect Performance Report\n";
        csvContent += `Generated: ${dateStr}\n`;
        csvContent += `Agent: ${user.name || 'Agent'}\n\n`;
        csvContent += "SUMMARY\n";
        csvContent += `Total Listings,${stats.total_listings}\n`;
        csvContent += `Active Listings,${stats.active_listings}\n`;
        csvContent += `Total Views,${stats.total_views}\n`;
        csvContent += `Total Inquiries,${stats.total_inquiries}\n`;
        csvContent += `Total Leads,${leadsResult.rows.length}\n\n`;
        csvContent += "TOP LISTINGS BY VIEWS\n";
        csvContent += "Title,Location,Price,Views,Inquiries\n";
        for (const l of listingsResult.rows.slice(0, 10)) {
          csvContent += `"${l.title}","${l.suburb || ''}, ${l.city || ''}",R${l.price},${l.views_count},${l.inquiries_count}\n`;
        }
      }

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="propconnect-${type}-${dateStr}.csv"`,
        },
      });
    } else if (format === "pdf") {
      // Generate simple HTML that can be printed as PDF
      const stats = statsResult.rows[0];
      const html = `
<!DOCTYPE html>
<html>
<head>
  <title>PropConnect Report - ${dateStr}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1e3a5f; border-bottom: 3px solid #f97316; padding-bottom: 10px; }
    h2 { color: #1e3a5f; margin-top: 30px; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
    .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; color: #1e3a5f; }
    .stat-label { color: #64748b; font-size: 12px; margin-top: 5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    th { background: #f1f5f9; color: #1e3a5f; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>🏠 PropConnect Performance Report</h1>
  <p><strong>Agent:</strong> ${user.name || 'Agent'} | <strong>Date:</strong> ${dateStr}</p>
  
  <h2>Summary</h2>
  <div class="stat-grid">
    <div class="stat-box">
      <div class="stat-value">${stats.total_listings}</div>
      <div class="stat-label">Total Listings</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${stats.active_listings}</div>
      <div class="stat-label">Active Listings</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${stats.total_views}</div>
      <div class="stat-label">Total Views</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${stats.total_inquiries}</div>
      <div class="stat-label">Total Inquiries</div>
    </div>
  </div>

  <h2>Top Performing Listings</h2>
  <table>
    <thead>
      <tr><th>Property</th><th>Location</th><th>Price</th><th>Views</th><th>Inquiries</th></tr>
    </thead>
    <tbody>
      ${listingsResult.rows.slice(0, 10).map(l => `
        <tr>
          <td>${l.title}</td>
          <td>${l.suburb || ''}, ${l.city || ''}</td>
          <td>R ${Number(l.price).toLocaleString()}</td>
          <td>${l.views_count}</td>
          <td>${l.inquiries_count}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Recent Leads</h2>
  <table>
    <thead>
      <tr><th>Contact</th><th>Property</th><th>Status</th><th>Date</th></tr>
    </thead>
    <tbody>
      ${leadsResult.rows.slice(0, 10).map(l => `
        <tr>
          <td>${l.contact_name || 'Unknown'}</td>
          <td>${l.property_title || '-'}</td>
          <td>${l.status}</td>
          <td>${new Date(l.created_at).toLocaleDateString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated by PropConnect | nextpropconnect.co.za</p>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
