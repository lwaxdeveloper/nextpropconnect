/**
 * Invoice Generation System
 * 
 * Creates invoices for payments and generates PDFs
 */

import { query } from "./db";
import { SUBSCRIPTION_PLANS, BOOST_TYPES, LISTING_FEES } from "./ozow";

interface InvoiceData {
  userId: number;
  paymentId: number;
  amount: number;
  type: string;
  metadata: Record<string, unknown>;
}

interface InvoiceDetails {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  vat: number;
  total: number;
  status: string;
}

/**
 * Generate invoice number
 * Format: PC-YYYYMM-XXXXX
 */
function generateInvoiceNumber(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, "0");
  return `PC-${yearMonth}-${random}`;
}

/**
 * Get item description based on payment type
 */
function getItemDescription(type: string, metadata: Record<string, unknown>): string {
  if (type === "subscription") {
    const plan = metadata.plan as keyof typeof SUBSCRIPTION_PLANS;
    const planData = SUBSCRIPTION_PLANS[plan];
    return `${planData?.name || plan} Monthly Subscription`;
  } else if (type === "boost") {
    const boostType = metadata.boostType as keyof typeof BOOST_TYPES;
    const boost = BOOST_TYPES[boostType];
    return `${boost?.name || boostType} - Property Boost (${boost?.days || 7} days)`;
  } else if (type === "listing") {
    const listingPlan = metadata.listingPlan as keyof typeof LISTING_FEES;
    const listing = LISTING_FEES[listingPlan];
    return `${listing?.name || listingPlan} (${listing?.days || 90} days)`;
  }
  return "NextPropConnect Service";
}

/**
 * Create invoice for a payment
 */
export async function createInvoice(data: InvoiceData): Promise<number> {
  const { userId, paymentId, amount, type, metadata } = data;

  // Get user details
  const userResult = await query(
    `SELECT name, email FROM users WHERE id = $1`,
    [userId]
  );
  
  if (userResult.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = userResult.rows[0];
  const invoiceNumber = generateInvoiceNumber();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

  // Calculate VAT (15% in South Africa)
  const vatRate = 0.15;
  const subtotal = amount;
  const vatAmount = Math.round(subtotal * vatRate / (1 + vatRate)); // VAT inclusive
  
  const description = getItemDescription(type, metadata);

  // Create invoice record
  const invoiceResult = await query(
    `INSERT INTO invoices (
      user_id, subscription_id, invoice_number, amount, status, due_date, 
      paid_at, metadata
    ) VALUES ($1, $2, $3, $4, 'paid', $5, NOW(), $6)
    RETURNING id`,
    [
      userId,
      null, // subscription_id - could link if subscription payment
      invoiceNumber,
      amount,
      dueDate,
      JSON.stringify({
        paymentId,
        type,
        description,
        subtotal,
        vat: vatAmount,
        customerName: user.name,
        customerEmail: user.email,
        items: [{
          description,
          quantity: 1,
          unitPrice: amount,
          total: amount,
        }],
      }),
    ]
  );

  console.log(`[Invoice] Created ${invoiceNumber} for user ${userId}`);
  return invoiceResult.rows[0].id;
}

/**
 * Generate invoice PDF HTML (can be converted to PDF)
 */
export function generateInvoiceHtml(details: InvoiceDetails): string {
  const formatPrice = (cents: number) => `R ${(cents / 100).toFixed(2)}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${details.invoiceNumber}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .logo { font-size: 24px; font-weight: bold; color: #E95420; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 20px; font-weight: bold; }
    .customer { margin-bottom: 30px; }
    .customer h3 { margin-bottom: 5px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
    .totals { text-align: right; }
    .totals td { border: none; }
    .total-row { font-weight: bold; font-size: 18px; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status-paid { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">NextPropConnect</div>
      <p>South Africa's Property Platform</p>
    </div>
    <div class="invoice-info">
      <div class="invoice-number">Invoice ${details.invoiceNumber}</div>
      <p>Date: ${details.date}</p>
      <p>Due: ${details.dueDate}</p>
      <span class="status status-${details.status}">${details.status.toUpperCase()}</span>
    </div>
  </div>

  <div class="customer">
    <h3>Bill To:</h3>
    <p><strong>${details.customerName}</strong></p>
    <p>${details.customerEmail}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${details.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatPrice(item.unitPrice)}</td>
          <td>${formatPrice(item.total)}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td>Subtotal (excl. VAT):</td>
      <td>${formatPrice(details.subtotal - details.vat)}</td>
    </tr>
    <tr>
      <td>VAT (15%):</td>
      <td>${formatPrice(details.vat)}</td>
    </tr>
    <tr class="total-row">
      <td>Total:</td>
      <td>${formatPrice(details.total)}</td>
    </tr>
  </table>

  <div class="footer">
    <p>NextPropConnect (Pty) Ltd | nextnextpropconnect.co.za | support@nextpropconnect.co.za</p>
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
  `;
}

/**
 * Get invoice details for display/PDF
 */
export async function getInvoiceDetails(invoiceId: number): Promise<InvoiceDetails | null> {
  const result = await query(
    `SELECT i.*, u.name, u.email 
     FROM invoices i 
     JOIN users u ON i.user_id = u.id 
     WHERE i.id = $1`,
    [invoiceId]
  );

  if (result.rows.length === 0) return null;

  const invoice = result.rows[0];
  const metadata = invoice.metadata || {};

  return {
    invoiceNumber: invoice.invoice_number,
    date: new Date(invoice.created_at).toLocaleDateString("en-ZA"),
    dueDate: new Date(invoice.due_date).toLocaleDateString("en-ZA"),
    customerName: invoice.name,
    customerEmail: invoice.email,
    items: metadata.items || [{
      description: metadata.description || "NextPropConnect Service",
      quantity: 1,
      unitPrice: invoice.amount,
      total: invoice.amount,
    }],
    subtotal: invoice.amount,
    vat: metadata.vat || Math.round(invoice.amount * 0.15 / 1.15),
    total: invoice.amount,
    status: invoice.status,
  };
}
