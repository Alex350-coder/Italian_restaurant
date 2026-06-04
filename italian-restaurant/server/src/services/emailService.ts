interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  items: { name: string; quantity: number; subtotal: number }[];
  total: number;
  notes?: string;
}

interface ReservationConfirmationData {
  reservationId: string;
  customerName: string;
  date: string;
  time: string;
  partySize: number;
  notes?: string;
}

interface PasswordResetData {
  customerName: string;
  resetToken: string;
  expiresIn: string;
}

function escapeHtml(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function buildOrderConfirmationHtml(data: OrderConfirmationData): string {
  const safeName = escapeHtml(data.customerName);
  const safeNotes = data.notes ? escapeHtml(data.notes) : null;
  const itemRows = data.items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.name)}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">$${item.subtotal.toFixed(2)}</td></tr>`
    )
    .join("\n");

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#8B0000;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0">Order Confirmed!</h1>
        <p style="margin:5px 0 0">Trattoria Bella Cucina</p>
      </div>
      <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        <p>Dear ${safeName},</p>
        <p>Your order <strong>#${data.orderId.slice(0, 8).toUpperCase()}</strong> has been confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead>
            <tr style="background:#f5f5f5">
              <th style="padding:8px;text-align:left">Item</th>
              <th style="padding:8px;text-align:center">Qty</th>
              <th style="padding:8px;text-align:right">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr style="border-top:2px solid #333;font-weight:bold">
              <td colspan="2" style="padding:8px">Total</td>
              <td style="padding:8px;text-align:right">$${data.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        ${safeNotes ? `<p><strong>Notes:</strong> ${safeNotes}</p>` : ""}
        <p>Thank you for ordering with us!</p>
      </div>
    </body>
    </html>
  `;
}

function buildReservationConfirmationHtml(data: ReservationConfirmationData): string {
  const safeName = escapeHtml(data.customerName);
  const safeNotes = data.notes ? escapeHtml(data.notes) : null;
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#8B0000;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0">Reservation Confirmed!</h1>
        <p style="margin:5px 0 0">Trattoria Bella Cucina</p>
      </div>
      <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        <p>Dear ${safeName},</p>
        <p>Your reservation has been confirmed. Here are the details:</p>
        <div style="background:#f9f9f9;padding:15px;border-radius:6px;margin:20px 0">
          <p><strong>Date:</strong> ${escapeHtml(data.date)}</p>
          <p><strong>Time:</strong> ${escapeHtml(data.time)}</p>
          <p><strong>Party Size:</strong> ${data.partySize} guests</p>
          ${safeNotes ? `<p><strong>Notes:</strong> ${safeNotes}</p>` : ""}
        </div>
        <p>Reservation ID: <strong>#${data.reservationId.slice(0, 8).toUpperCase()}</strong></p>
        <p>If you need to modify or cancel, please do so at least 2 hours in advance.</p>
        <p>We look forward to seeing you!</p>
      </div>
    </body>
    </html>
  `;
}

function buildPasswordResetHtml(data: PasswordResetData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <div style="background:#8B0000;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
        <h1 style="margin:0">Password Reset</h1>
        <p style="margin:5px 0 0">Trattoria Bella Cucina</p>
      </div>
      <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        <p>Dear ${data.customerName},</p>
        <p>You requested a password reset. Use the token below to reset your password:</p>
        <div style="background:#f5f5f5;padding:15px;text-align:center;border-radius:6px;margin:20px 0">
          <code style="font-size:18px;letter-spacing:2px">${data.resetToken}</code>
        </div>
        <p>This token expires in <strong>${data.expiresIn}</strong>.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;
}

async function sendEmail(options: EmailOptions): Promise<boolean> {
  console.log(`[EMAIL SERVICE] Sending email to: ${options.to}`);
  console.log(`[EMAIL SERVICE] Subject: ${options.subject}`);
  console.log(`[EMAIL SERVICE] Content length: ${options.html.length} chars`);
  console.log(`[EMAIL SERVICE] ✅ Email sent successfully (mock)`);
  return true;
}

export const emailService = {
  async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    return sendEmail({
      to: data.customerName,
      subject: `Order #${data.orderId.slice(0, 8).toUpperCase()} Confirmed - Trattoria Bella Cucina`,
      html: buildOrderConfirmationHtml(data),
    });
  },

  async sendReservationConfirmation(data: ReservationConfirmationData): Promise<boolean> {
    return sendEmail({
      to: data.customerName,
      subject: `Reservation Confirmed - ${data.date} at ${data.time}`,
      html: buildReservationConfirmationHtml(data),
    });
  },

  async sendPasswordReset(data: PasswordResetData): Promise<boolean> {
    return sendEmail({
      to: data.customerName,
      subject: "Password Reset Request - Trattoria Bella Cucina",
      html: buildPasswordResetHtml(data),
    });
  },

  async sendPasswordResetConfirmation(customerName: string): Promise<boolean> {
    return sendEmail({
      to: customerName,
      subject: "Password Reset Successful - Trattoria Bella Cucina",
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#8B0000;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0">
            <h1 style="margin:0">Password Reset Successful</h1>
          </div>
          <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px">
            <p>Dear ${customerName},</p>
            <p>Your password has been successfully reset.</p>
            <p>If you did not perform this action, please contact us immediately.</p>
          </div>
        </body>
        </html>
      `,
    });
  },
};
