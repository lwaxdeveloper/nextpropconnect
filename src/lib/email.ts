import nodemailer from 'nodemailer';

// Check if email is configured
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'NextPropConnect <noreply@nextpropconnect.co.za>',
      to,
      subject,
      html,
      text,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .code { font-size: 32px; font-weight: bold; color: #E11D48; letter-spacing: 8px; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NextPropConnect</h1>
          <p>Verify Your Email</p>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p>Thanks for signing up with NextPropConnect. Use this code to verify your email:</p>
          <div class="code">${code}</div>
          <p>This code expires in <strong>15 minutes</strong>.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 NextPropConnect SA | iTedia (Pty) Ltd</p>
          <p>South Africa's Property Platform</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `${code} is your NextPropConnect verification code`,
    html,
  });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #E11D48 0%, #BE123C 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #E11D48; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to NextPropConnect! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi ${name}!</p>
          <p>Welcome to NextPropConnect SA — South Africa's modern property platform.</p>
          <p><strong>Your 90-day free trial has started!</strong> You have full access to all features:</p>
          <ul>
            <li>✅ List up to 20 properties</li>
            <li>✅ Upload 30 photos per listing</li>
            <li>✅ Analytics & insights</li>
            <li>✅ WhatsApp notifications</li>
            <li>✅ Priority support</li>
          </ul>
          <p style="text-align: center;">
            <a href="https://nextpropconnect.co.za/dashboard" class="button">Go to Dashboard</a>
          </p>
          <p>Need help? Just reply to this email or use the feedback button in the app.</p>
        </div>
        <div class="footer">
          <p>© 2026 NextPropConnect SA | iTedia (Pty) Ltd</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to NextPropConnect, ${name}! 🏠`,
    html,
  });
}

// Send email when a new message is received
export async function sendNewMessageEmail(
  to: string,
  recipientName: string,
  senderName: string, 
  messagePreview: string,
  propertyTitle: string | null,
  conversationUrl: string
): Promise<boolean> {
  const aboutText = propertyTitle ? ` about <strong>${propertyTitle}</strong>` : '';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E11D48;">New Message on NextPropConnect</h2>
      <p>Hi ${recipientName},</p>
      <p><strong>${senderName}</strong> sent you a message${aboutText}:</p>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #333;">"${messagePreview}"</p>
      </div>
      <a href="${conversationUrl}" style="display: inline-block; background: #E11D48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Conversation</a>
    </div>
  `;
  
  const subject = propertyTitle 
    ? `New message from ${senderName} about ${propertyTitle}`
    : `New message from ${senderName}`;
  
  return sendEmail({
    to,
    subject,
    html,
  });
}

// Send email for WhatsApp leads
export async function sendWhatsAppLeadEmail(
  to: string,
  agentName: string,
  customerPhone: string,
  messageContent: string,
  propertyTitle: string | null,
  conversationUrl: string
): Promise<boolean> {
  const titleText = propertyTitle || 'a property';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #25D366;">New WhatsApp Lead!</h2>
      <p>Hi ${agentName},</p>
      <p>You received a new inquiry via WhatsApp:</p>
      <ul>
        <li><strong>Phone:</strong> ${customerPhone}</li>
        ${propertyTitle ? `<li><strong>Property:</strong> ${propertyTitle}</li>` : ''}
      </ul>
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0;">${messageContent}</p>
      </div>
      <a href="${conversationUrl}" style="display: inline-block; background: #E11D48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Conversation</a>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: `WhatsApp Lead${propertyTitle ? ` for ${propertyTitle}` : ''}`,
    html,
  });
}

// Send email for viewing requests
export async function sendViewingRequestEmail(
  to: string,
  recipientName: string,
  senderName: string,
  propertyTitle: string,
  requestedDate: string,
  requestedTime: string,
  notes: string | null,
  conversationUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E11D48;">New Viewing Request</h2>
      <p>Hi ${recipientName},</p>
      <p><strong>${senderName}</strong> wants to view <strong>${propertyTitle}</strong>:</p>
      <ul>
        <li><strong>Date:</strong> ${requestedDate}</li>
        <li><strong>Time:</strong> ${requestedTime}</li>
      </ul>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      <a href="${conversationUrl}" style="display: inline-block; background: #E11D48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Respond to Request</a>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: `Viewing Request: ${senderName} for ${propertyTitle}`,
    html,
  });
}

// Send property alert email
export async function sendPropertyAlertEmail(
  to: string,
  userName: string,
  properties: Array<{ id: number; title: string; price: string; location: string; imageUrl?: string | null }>,
  alertName: string
): Promise<boolean> {
  const propertyCards = properties.map(p => `
    <div style="border: 1px solid #eee; border-radius: 8px; padding: 15px; margin: 10px 0;">
      <h3 style="margin: 0 0 10px 0;">${p.title}</h3>
      <p style="color: #E11D48; font-weight: bold; margin: 5px 0;">${p.price}</p>
      <p style="color: #666; margin: 5px 0;">${p.location}</p>
      <a href="https://nextpropconnect.co.za/properties/${p.id}" style="color: #E11D48;">View Property →</a>
    </div>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #E11D48;">New Properties Matching "${alertName}"</h2>
      <p>Hi ${userName},</p>
      <p>We found ${properties.length} new ${properties.length === 1 ? 'property' : 'properties'} matching your alert:</p>
      ${propertyCards}
      <p style="margin-top: 20px;">
        <a href="https://nextpropconnect.co.za/dashboard/alerts" style="color: #666; font-size: 12px;">Manage your alerts</a>
      </p>
    </div>
  `;
  
  return sendEmail({
    to,
    subject: `${properties.length} new ${properties.length === 1 ? 'property' : 'properties'} matching "${alertName}"`,
    html,
  });
}
