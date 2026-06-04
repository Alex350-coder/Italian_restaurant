import { describe, it, expect, vi, beforeEach } from "vitest";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

interface OrderConfirmationData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

interface ReservationConfirmationData {
  reservationId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  time: string;
  partySize: number;
  notes?: string;
}

class EmailService {
  private transporter: any;

  constructor() {
    this.transporter = {
      sendMail: vi.fn(),
    };
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: "noreply@trattoria.it",
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  async sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
    const itemsList = data.items
      .map((item) => `<li>${item.quantity}x ${item.name} - €${(item.price * item.quantity).toFixed(2)}</li>`)
      .join("");

    const html = `
      <h1>Order Confirmation #${data.orderId}</h1>
      <p>Ciao ${data.customerName},</p>
      <p>Your order has been received and is being prepared.</p>
      <h2>Order Details</h2>
      <ul>${itemsList}</ul>
      <p><strong>Total: €${data.total.toFixed(2)}</strong></p>
      <p>Grazie for ordering from Trattoria!</p>
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Order Confirmation #${data.orderId}`,
      html,
    });
  }

  async sendReservationConfirmation(data: ReservationConfirmationData): Promise<boolean> {
    const notesSection = data.notes ? `<p><strong>Special Requests:</strong> ${data.notes}</p>` : "";

    const html = `
      <h1>Reservation Confirmation #${data.reservationId}</h1>
      <p>Ciao ${data.customerName},</p>
      <p>Your reservation has been confirmed.</p>
      <h2>Reservation Details</h2>
      <p><strong>Date:</strong> ${data.date}</p>
      <p><strong>Time:</strong> ${data.time}</p>
      <p><strong>Party Size:</strong> ${data.partySize} guests</p>
      ${notesSection}
      <p>We look forward to welcoming you!</p>
    `;

    return this.sendEmail({
      to: data.customerEmail,
      subject: `Reservation Confirmation #${data.reservationId}`,
      html,
    });
  }
}

describe("EmailService", () => {
  let emailService: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    emailService = new EmailService();
  });

  describe("sendEmail", () => {
    it("should send email and return true on success", async () => {
      emailService["transporter"].sendMail.mockResolvedValueOnce({ messageId: "123" });

      const result = await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });

      expect(result).toBe(true);
      expect(emailService["transporter"].sendMail).toHaveBeenCalledTimes(1);
      expect(emailService["transporter"].sendMail).toHaveBeenCalledWith({
        from: "noreply@trattoria.it",
        to: "test@example.com",
        subject: "Test Subject",
        html: "<p>Test content</p>",
      });
    });

    it("should return false when SMTP fails", async () => {
      emailService["transporter"].sendMail.mockRejectedValueOnce(new Error("SMTP connection failed"));

      const result = await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBe(false);
    });

    it("should return false when recipient address is rejected", async () => {
      emailService["transporter"].sendMail.mockRejectedValueOnce(new Error("Invalid recipient"));

      const result = await emailService.sendEmail({
        to: "invalid@domain",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBe(false);
    });
  });

  describe("sendOrderConfirmation", () => {
    it("should send order confirmation email with correct details", async () => {
      emailService["transporter"].sendMail.mockResolvedValueOnce({ messageId: "456" });

      const data: OrderConfirmationData = {
        orderId: "ord-123",
        customerName: "Mario Rossi",
        customerEmail: "mario@example.com",
        items: [
          { name: "Pizza Margherita", quantity: 2, price: 12.50 },
          { name: "Tiramisù", quantity: 1, price: 8.00 },
        ],
        total: 33.00,
      };

      const result = await emailService.sendOrderConfirmation(data);

      expect(result).toBe(true);
      const mailOptions = emailService["transporter"].sendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe("mario@example.com");
      expect(mailOptions.subject).toContain("ord-123");
      expect(mailOptions.html).toContain("Mario Rossi");
      expect(mailOptions.html).toContain("Pizza Margherita");
      expect(mailOptions.html).toContain("€33.00");
    });

    it("should handle single item orders", async () => {
      emailService["transporter"].sendMail.mockResolvedValueOnce({ messageId: "789" });

      const data: OrderConfirmationData = {
        orderId: "ord-456",
        customerName: "Luca Bianchi",
        customerEmail: "luca@example.com",
        items: [{ name: "Espresso", quantity: 1, price: 3.00 }],
        total: 3.00,
      };

      const result = await emailService.sendOrderConfirmation(data);

      expect(result).toBe(true);
      const html = emailService["transporter"].sendMail.mock.calls[0][0].html;
      expect(html).toContain("Espresso");
      expect(html).toContain("€3.00");
    });

    it("should calculate subtotals correctly for quantity > 1", async () => {
      emailService["transporter"].sendMail.mockResolvedValueOnce({ messageId: "abc" });

      const data: OrderConfirmationData = {
        orderId: "ord-789",
        customerName: "Test User",
        customerEmail: "test@example.com",
        items: [{ name: "Pizza Diavola", quantity: 3, price: 14.00 }],
        total: 42.00,
      };

      await emailService.sendOrderConfirmation(data);

      const html = emailService["transporter"].sendMail.mock.calls[0][0].html;
      expect(html).toContain("€42.00");
    });

    it("should return false when sending fails", async () => {
      emailService["transporter"].sendMail.mockRejectedValueOnce(new Error("Mail server down"));

      const result = await emailService.sendOrderConfirmation({
        orderId: "ord-fail",
        customerName: "Test",
        customerEmail: "test@example.com",
        items: [{ name: "Item", quantity: 1, price: 10 }],
        total: 10,
      });

      expect(result).toBe(false);
    });
  });

  describe("sendReservationConfirmation", () => {
    it("should send reservation confirmation email", async () => {
      emailService["transporter"].sendMail.mockResolvedValueOnce({ messageId: "def" });

      const data: ReservationConfirmationData = {
        reservationId: "res-123",
        customerName: "Mario Rossi",
        customerEmail: "mario@example.com",
        date: "2026-07-15",
        time: "19:00",
        partySize: 4,
      };

      const result = await emailService.sendReservationConfirmation(data);

      expect(result).toBe(true);
      const mailOptions = emailService["transporter"].sendMail.mock.calls[0][0];
      expect(mailOptions.to).toBe("mario@example.com");
      expect(mailOptions.subject).toContain("res-123");
      expect(mailOptions.html).toContain("2026-07-15");
      expect(mailOptions.html).toContain("19:00");
      expect(mailOptions.html).toContain("4 guests");
    });

    it("should include special notes when provided", async () => {
      emailService["transporter"].sendMail.mockResolvedValueOnce({ messageId: "ghi" });

      const data: ReservationConfirmationData = {
        reservationId: "res-456",
        customerName: "Test User",
        customerEmail: "test@example.com",
        date: "2026-07-20",
        time: "20:00",
        partySize: 2,
        notes: "Anniversary dinner",
      };

      await emailService.sendReservationConfirmation(data);

      const html = emailService["transporter"].sendMail.mock.calls[0][0].html;
      expect(html).toContain("Anniversary dinner");
      expect(html).toContain("Special Requests");
    });

    it("should omit notes section when no notes provided", async () => {
      emailService["transporter"].sendMail.mockResolvedValueOnce({ messageId: "jkl" });

      const data: ReservationConfirmationData = {
        reservationId: "res-789",
        customerName: "Test User",
        customerEmail: "test@example.com",
        date: "2026-07-25",
        time: "18:00",
        partySize: 6,
      };

      await emailService.sendReservationConfirmation(data);

      const html = emailService["transporter"].sendMail.mock.calls[0][0].html;
      expect(html).not.toContain("Special Requests");
    });

    it("should return false when sending fails", async () => {
      emailService["transporter"].sendMail.mockRejectedValueOnce(new Error("Timeout"));

      const result = await emailService.sendReservationConfirmation({
        reservationId: "res-fail",
        customerName: "Test",
        customerEmail: "test@example.com",
        date: "2026-08-01",
        time: "19:00",
        partySize: 2,
      });

      expect(result).toBe(false);
    });
  });

  describe("error handling", () => {
    it("should handle SMTP timeout errors gracefully", async () => {
      emailService["transporter"].sendMail.mockRejectedValueOnce(
        new Error("Connection timed out after 30000ms")
      );

      const result = await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBe(false);
    });

    it("should handle authentication errors gracefully", async () => {
      emailService["transporter"].sendMail.mockRejectedValueOnce(
        new Error("Invalid login: 535 Authentication Failed")
      );

      const result = await emailService.sendEmail({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      });

      expect(result).toBe(false);
    });
  });
});
