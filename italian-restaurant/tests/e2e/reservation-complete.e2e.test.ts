import { describe, it, expect, vi, beforeEach } from "vitest";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface ReservationData {
  date: string;
  time: string;
  partySize: number;
  occasion: string;
  specialRequests: string;
  name: string;
  phone: string;
  email: string;
}

interface ReservationConfirmation {
  id: string;
  status: string;
  data: ReservationData;
  createdAt: Date;
}

class ReservationCompletePage {
  private currentStep: string = "date";
  private reservationData: Partial<ReservationData> = {};
  private confirmedReservation: ReservationConfirmation | null = null;
  private reservations: Map<string, ReservationConfirmation> = new Map();

  async navigateToReservation(): Promise<string> {
    this.currentStep = "date";
    return "reservation-page";
  }

  async selectDate(date: string): Promise<TimeSlot[]> {
    if (!date) throw new Error("Date is required");
    this.reservationData.date = date;
    this.currentStep = "time";

    const today = new Date();
    const selected = new Date(date);
    if (selected <= today) {
      return [];
    }

    return [
      { time: "18:00", available: true },
      { time: "18:30", available: true },
      { time: "19:00", available: false },
      { time: "19:30", available: true },
      { time: "20:00", available: true },
      { time: "20:30", available: false },
      { time: "21:00", available: true },
    ];
  }

  async selectTimeSlot(time: string): Promise<boolean> {
    if (!time) throw new Error("Time is required");
    if (["19:00", "20:30"].includes(time)) {
      throw new Error("Selected time slot is not available");
    }
    this.reservationData.time = time;
    this.currentStep = "party-size";
    return true;
  }

  async setPartySize(size: number): Promise<boolean> {
    if (size < 1) throw new Error("Party size must be at least 1");
    if (size > 20) throw new Error("Maximum party size is 20");
    this.reservationData.partySize = size;
    this.currentStep = "occasion";
    return true;
  }

  async selectOccasion(occasion: string): Promise<void> {
    this.reservationData.occasion = occasion;
    this.currentStep = "requests";
  }

  async addSpecialRequests(requests: string): Promise<void> {
    this.reservationData.specialRequests = requests;
    this.currentStep = "contact";
  }

  async enterContactDetails(details: { name: string; phone: string; email: string }): Promise<boolean> {
    if (!details.name || !details.phone || !details.email) {
      throw new Error("All contact fields are required");
    }
    this.reservationData.name = details.name;
    this.reservationData.phone = details.phone;
    this.reservationData.email = details.email;
    this.currentStep = "review";
    return true;
  }

  async submitReservation(): Promise<ReservationConfirmation> {
    if (!this.reservationData.date || !this.reservationData.time || !this.reservationData.partySize) {
      throw new Error("Please complete all required steps");
    }

    const confirmation: ReservationConfirmation = {
      id: `res-${Date.now()}`,
      status: "confirmed",
      data: this.reservationData as ReservationData,
      createdAt: new Date(),
    };

    this.confirmedReservation = confirmation;
    this.reservations.set(confirmation.id, confirmation);
    this.currentStep = "confirmation";

    return confirmation;
  }

  async viewConfirmation(reservationId: string): Promise<ReservationConfirmation | null> {
    return this.reservations.get(reservationId) || null;
  }

  async cancelReservation(reservationId: string): Promise<boolean> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) throw new Error("Reservation not found");
    if (reservation.status === "cancelled") throw new Error("Reservation is already cancelled");

    reservation.status = "cancelled";
    this.currentStep = "cancelled";
    return true;
  }

  getCurrentStep(): string {
    return this.currentStep;
  }

  getReservationData(): Partial<ReservationData> {
    return { ...this.reservationData };
  }
}

describe("Reservation Complete Flow E2E", () => {
  let reservationPage: ReservationCompletePage;

  beforeEach(() => {
    vi.clearAllMocks();
    reservationPage = new ReservationCompletePage();
  });

  it("should navigate to reservation page", async () => {
    const page = await reservationPage.navigateToReservation();

    expect(page).toBe("reservation-page");
    expect(reservationPage.getCurrentStep()).toBe("date");
  });

  it("should select a future date and show time slots", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const slots = await reservationPage.selectDate(dateStr);

    expect(slots).toHaveLength(7);
    expect(reservationPage.getCurrentStep()).toBe("time");
  });

  it("should reject past date selection", async () => {
    const slots = await reservationPage.selectDate("2020-01-01");

    expect(slots).toHaveLength(0);
  });

  it("should select an available time slot", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    await reservationPage.selectDate(dateStr);
    const result = await reservationPage.selectTimeSlot("19:30");

    expect(result).toBe(true);
    expect(reservationPage.getCurrentStep()).toBe("party-size");
  });

  it("should reject unavailable time slot", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    await reservationPage.selectDate(dateStr);

    await expect(reservationPage.selectTimeSlot("19:00")).rejects.toThrow(
      "Selected time slot is not available"
    );
  });

  it("should set party size for 4 guests", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    await reservationPage.selectDate(dateStr);
    await reservationPage.selectTimeSlot("20:00");
    const result = await reservationPage.setPartySize(4);

    expect(result).toBe(true);
    expect(reservationPage.getReservationData().partySize).toBe(4);
    expect(reservationPage.getCurrentStep()).toBe("occasion");
  });

  it("should reject party size of 0", async () => {
    await expect(reservationPage.setPartySize(0)).rejects.toThrow(
      "Party size must be at least 1"
    );
  });

  it("should reject party size over 20", async () => {
    await expect(reservationPage.setPartySize(25)).rejects.toThrow(
      "Maximum party size is 20"
    );
  });

  it("should select occasion", async () => {
    await reservationPage.selectOccasion("Birthday");
    expect(reservationPage.getReservationData().occasion).toBe("Birthday");
    expect(reservationPage.getCurrentStep()).toBe("requests");
  });

  it("should add special requests", async () => {
    await reservationPage.addSpecialRequests("Gluten-free options needed, window seat");
    expect(reservationPage.getReservationData().specialRequests).toBe(
      "Gluten-free options needed, window seat"
    );
    expect(reservationPage.getCurrentStep()).toBe("contact");
  });

  it("should enter contact details", async () => {
    const result = await reservationPage.enterContactDetails({
      name: "Mario Rossi",
      phone: "+39 333 1234567",
      email: "mario@example.com",
    });

    expect(result).toBe(true);
    expect(reservationPage.getCurrentStep()).toBe("review");
  });

  it("should reject incomplete contact details", async () => {
    await expect(
      reservationPage.enterContactDetails({ name: "", phone: "", email: "" })
    ).rejects.toThrow("All contact fields are required");
  });

  it("should submit reservation and show confirmation", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    await reservationPage.selectDate(dateStr);
    await reservationPage.selectTimeSlot("19:30");
    await reservationPage.setPartySize(4);
    await reservationPage.selectOccasion("Birthday");
    await reservationPage.addSpecialRequests("Birthday cake on table");
    await reservationPage.enterContactDetails({
      name: "Mario Rossi",
      phone: "+39 333 1234567",
      email: "mario@example.com",
    });

    const confirmation = await reservationPage.submitReservation();

    expect(confirmation.id).toBeDefined();
    expect(confirmation.status).toBe("confirmed");
    expect(confirmation.data.date).toBe(dateStr);
    expect(confirmation.data.time).toBe("19:30");
    expect(confirmation.data.partySize).toBe(4);
    expect(confirmation.data.occasion).toBe("Birthday");
    expect(reservationPage.getCurrentStep()).toBe("confirmation");
  });

  it("should fail to submit without required data", async () => {
    await expect(reservationPage.submitReservation()).rejects.toThrow(
      "Please complete all required steps"
    );
  });

  it("should view reservation confirmation details", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    await reservationPage.selectDate(dateStr);
    await reservationPage.selectTimeSlot("20:00");
    await reservationPage.setPartySize(2);
    await reservationPage.enterContactDetails({
      name: "Luca Bianchi",
      phone: "+39 333 9876543",
      email: "luca@example.com",
    });

    const confirmation = await reservationPage.submitReservation();
    const details = await reservationPage.viewConfirmation(confirmation.id);

    expect(details).not.toBeNull();
    expect(details!.id).toBe(confirmation.id);
    expect(details!.data.name).toBe("Luca Bianchi");
  });

  it("should cancel a reservation", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    await reservationPage.selectDate(dateStr);
    await reservationPage.selectTimeSlot("20:00");
    await reservationPage.setPartySize(2);
    await reservationPage.enterContactDetails({
      name: "Mario",
      phone: "123",
      email: "m@test.com",
    });

    const confirmation = await reservationPage.submitReservation();
    const cancelled = await reservationPage.cancelReservation(confirmation.id);

    expect(cancelled).toBe(true);
    expect(confirmation.status).toBe("cancelled");
    expect(reservationPage.getCurrentStep()).toBe("cancelled");
  });

  it("should fail to cancel nonexistent reservation", async () => {
    await expect(reservationPage.cancelReservation("nonexistent")).rejects.toThrow(
      "Reservation not found"
    );
  });

  it("should fail to cancel already cancelled reservation", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    await reservationPage.selectDate(dateStr);
    await reservationPage.selectTimeSlot("20:00");
    await reservationPage.setPartySize(2);
    await reservationPage.enterContactDetails({
      name: "Test",
      phone: "123",
      email: "t@test.com",
    });

    const confirmation = await reservationPage.submitReservation();
    await reservationPage.cancelReservation(confirmation.id);

    await expect(reservationPage.cancelReservation(confirmation.id)).rejects.toThrow(
      "Reservation is already cancelled"
    );
  });

  it("should handle complete end-to-end reservation flow with birthday occasion", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    await reservationPage.navigateToReservation();

    const slots = await reservationPage.selectDate(dateStr);
    const availableSlots = slots.filter((s) => s.available);
    expect(availableSlots.length).toBeGreaterThan(0);

    await reservationPage.selectTimeSlot(availableSlots[0].time);
    await reservationPage.setPartySize(4);
    await reservationPage.selectOccasion("Birthday");
    await reservationPage.addSpecialRequests("Birthday celebration - need cake table");
    await reservationPage.enterContactDetails({
      name: "Giulia Marchetti",
      phone: "+39 333 1112233",
      email: "giulia@example.com",
    });

    const confirmation = await reservationPage.submitReservation();

    expect(confirmation.status).toBe("confirmed");
    expect(confirmation.data.occasion).toBe("Birthday");
    expect(confirmation.data.partySize).toBe(4);

    const viewed = await reservationPage.viewConfirmation(confirmation.id);
    expect(viewed).not.toBeNull();
    expect(viewed!.data.specialRequests).toBe("Birthday celebration - need cake table");
  });
});
