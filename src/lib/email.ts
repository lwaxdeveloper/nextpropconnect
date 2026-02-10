/**
 * Email Service using Nodemailer
 * 
 * Sends transactional emails for:
 * - New message notifications
 * - Viewing confirmations
 * - Property alerts
 */

import nodemailer from "nodemailer";

// Configuration
const SMTP_HOST = process.env.SMTP_HOST || "mail.itedia.co.za";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "NextPropConnect <noreply@nextnextpropconnect.co.za>";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export function isEmailConfigured(): boolean {
  return !!(SMTP_USER && SMTP_PASS);
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.log("[Email] Not configured, skipping send to:", to);
    return false;
  }

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });
    console.log("[Email] Sent to:", to, "Subject:", subject);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

/**
 * Send new message notification
 */
export async function sendNewMessageEmail(
  toEmail: string,
  toName: string,
  senderName: string,
  messagePreview: string,
  propertyTitle: string | null,
  conversationUrl: string
): Promise<boolean> {
  const subject = `New message from ${senderName}${propertyTitle ? ` about ${propertyTitle}` : ""}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066FF; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .message-box { background: white; padding: 15px; border-left: 4px solid #0066FF; margin: 15px 0; border-radius: 4px; }
        .button { display: inline-block; background: #0066FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">📬 New Message</h2>
        </div>
        <div class="content">
          <p>Hi ${toName},</p>
          <p><strong>${senderName}</strong> sent you a message${propertyTitle ? ` about <strong>${propertyTitle}</strong>` : ""}:</p>
          <div class="message-box">
            "${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? "..." : ""}"
          </div>
          <a href="${conversationUrl}" class="button">Reply Now</a>
        </div>
        <div class="footer">
          <p>NextPropConnect SA | <a href="https://nextnextpropconnect.co.za">nextnextpropconnect.co.za</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Send viewing request notification to agent/seller
 */
export async function sendViewingRequestEmail(
  toEmail: string,
  toName: string,
  buyerName: string,
  propertyTitle: string,
  proposedDate: string,
  proposedTime: string,
  notes: string | null,
  dashboardUrl: string
): Promise<boolean> {
  const subject = `Viewing Request: ${propertyTitle}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 15px; margin: 15px 0; border-radius: 8px; }
        .detail-row { display: flex; margin: 8px 0; }
        .label { font-weight: 600; width: 120px; }
        .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">📅 Viewing Request</h2>
        </div>
        <div class="content">
          <p>Hi ${toName},</p>
          <p><strong>${buyerName}</strong> wants to view your property!</p>
          <div class="details">
            <div class="detail-row"><span class="label">Property:</span> ${propertyTitle}</div>
            <div class="detail-row"><span class="label">Date:</span> ${proposedDate}</div>
            <div class="detail-row"><span class="label">Time:</span> ${proposedTime}</div>
            ${notes ? `<div class="detail-row"><span class="label">Notes:</span> ${notes}</div>` : ""}
          </div>
          <a href="${dashboardUrl}" class="button">Respond to Request</a>
        </div>
        <div class="footer">
          <p>NextPropConnect SA | <a href="https://nextnextpropconnect.co.za">nextnextpropconnect.co.za</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Send property alert notification
 */
export async function sendPropertyAlertEmail(
  toEmail: string,
  toName: string,
  properties: Array<{
    id: number;
    title: string;
    price: string;
    location: string;
    imageUrl: string | null;
  }>,
  alertName: string
): Promise<boolean> {
  const subject = `🏠 ${properties.length} new ${properties.length === 1 ? "property matches" : "properties match"} your alert: ${alertName}`;
  
  const propertyCards = properties.map(p => `
    <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border: 1px solid #eee;">
      ${p.imageUrl ? `<img src="${p.imageUrl}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px;" />` : ""}
      <h3 style="margin: 10px 0 5px;">${p.title}</h3>
      <p style="color: #0066FF; font-size: 18px; font-weight: bold; margin: 5px 0;">${p.price}</p>
      <p style="color: #666; margin: 5px 0;">📍 ${p.location}</p>
      <a href="https://nextnextpropconnect.co.za/properties/${p.id}" style="color: #0066FF; text-decoration: none;">View Property →</a>
    </div>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066FF; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">🔔 Property Alert: ${alertName}</h2>
        </div>
        <div class="content">
          <p>Hi ${toName},</p>
          <p>Great news! We found ${properties.length} new ${properties.length === 1 ? "property" : "properties"} matching your search:</p>
          ${propertyCards}
          <p style="margin-top: 20px;">
            <a href="https://nextnextpropconnect.co.za/alerts" style="color: #666;">Manage your alerts</a>
          </p>
        </div>
        <div class="footer">
          <p>NextPropConnect SA | <a href="https://nextnextpropconnect.co.za">nextnextpropconnect.co.za</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: toEmail, subject, html });
}

/**
 * Send WhatsApp inquiry notification to agent
 */
export async function sendWhatsAppLeadEmail(
  toEmail: string,
  toName: string,
  customerPhone: string,
  messagePreview: string,
  propertyTitle: string | null,
  conversationUrl: string
): Promise<boolean> {
  const subject = `📲 New WhatsApp Lead${propertyTitle ? `: ${propertyTitle}` : ""}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #25D366; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .message-box { background: white; padding: 15px; border-left: 4px solid #25D366; margin: 15px 0; border-radius: 4px; }
        .button { display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0;">📲 New WhatsApp Lead</h2>
        </div>
        <div class="content">
          <p>Hi ${toName},</p>
          <p>You have a new WhatsApp inquiry from <strong>+${customerPhone}</strong>${propertyTitle ? ` about <strong>${propertyTitle}</strong>` : ""}:</p>
          <div class="message-box">
            "${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? "..." : ""}"
          </div>
          <a href="${conversationUrl}" class="button">Reply Now</a>
        </div>
        <div class="footer">
          <p>NextPropConnect SA | <a href="https://nextnextpropconnect.co.za">nextnextpropconnect.co.za</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to: toEmail, subject, html });
}
