import { describe, it, expect, vi, beforeEach } from "vitest";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface ReservationDetails {
  date: string;
  time: string;
  partySize: number;
  name: string;
  phone: string;
  email: string;
  specialRequests?: string;
}

interface ReservationConfirmation {
  reservationId: string;
  status: string;
  date: string;
  time: string;
  partySize: number;
}

class ReservationFlowPage {
  private currentStep: string = "select-date";
  private selectedDate: string = "";
  private selectedTime: string = "";
  private partySize: number = 0;
  private specialRequests: string = "";
  private availableSlots: TimeSlot[] = [];

  async selectDate(date: string): Promise<TimeSlot[]> {
    this.selectedDate = date;
    this.currentStep = "select-time";

    this.availableSlots = [
      { time: "18:00", available: true },
      { time: "18:30", available: true },
      { time: "19:00", available: false },
      { time: "19:30", available: true },
      { time: "20:00", available: true },
      { time: "20:30", available: false },
      { time: "21:00", available: true },
    ];

    return this.availableSlots;
  }

  async selectTime(time: string): Promise<boolean> {
    const slot = this.availableSlots.find((s) => s.time === time);
    if (!slot) throw new Error("Time slot not found");
    if (!slot.available) throw new Error("Time slot is not available");

    this.selectedTime = time;
    this.currentStep = "party-size";
    return true;
  }

  async setPartySize(size: number): Promise<boolean> {
    if (size < 1) throw new Error("Party size must be at least 1");
    if (size > 20) throw new Error("Maximum party size is 20");

    this.partySize = size;
    this.currentStep = "details";
    return true;
  }

  async addSpecialRequests(requests: string): Promise<void> {
    this.specialRequests = requests;
  }

  async enterContactDetails(details: { name: string; phone: string; email: string }): Promise<boolean> {
    if (!details.name || !details.phone || !details.email) {
      throw new Error("All contact fields are required");
    }
    this.currentStep = "confirm";
    return true;
  }

  async confirmReservation(): Promise<ReservationConfirmation> {
    if (!this.selectedDate || !this.selectedTime || this.partySize === 0) {
      throw new Error("Please complete all steps before confirming");
    }

    this.currentStep = "success";
    return {
      reservationId: `res-${Date.now()}`,
      status: "confirmed",
      date: this.selectedDate,
      time: this.selectedTime,
      partySize: this.partySize,
    };
  }

  async viewConfirmation(reservationId: string): Promise<ReservationConfirmation> {
    return {
      reservationId,
      status: "confirmed",
      date: this.selectedDate,
      time: this.selectedTime,
      partySize: this.partySize,
    };
  }

  getCurrentStep(): string {
    return this.currentStep;
  }

  getSelectedDate(): string {
    return this.selectedDate;
  }

  getSelectedTime(): string {
    return this.selectedTime;
  }

  getPartySize(): number {
    return this.partySize;
  }

  getSpecialRequests(): string {
    return this.specialRequests;
  }
}

describe("Reservation Flow E2E", () => {
  let reservationPage: ReservationFlowPage;

  beforeEach(() => {
    vi.clearAllMocks();
    reservationPage = new ReservationFlowPage();
  });

  it("should select a date and show available time slots", async () => {
    const slots = await reservationPage.selectDate("2026-07-15");

    expect(slots).toHaveLength(7);
    expect(reservationPage.getSelectedDate()).toBe("2026-07-15");
    expect(reservationPage.getCurrentStep()).toBe("select-time");
  });

  it("should show correct availability for time slots", async () => {
    const slots = await reservationPage.selectDate("2026-07-15");

    const availableSlots = slots.filter((s) => s.available);
    const unavailableSlots = slots.filter((s) => !s.available);

    expect(availableSlots.length).toBeGreaterThan(0);
    expect(unavailableSlots.length).toBeGreaterThan(0);
    expect(unavailableSlots.some((s) => s.time === "19:00")).toBe(true);
  });

  it("should select an available time slot", async () => {
    await reservationPage.selectDate("2026-07-15");
    const result = await reservationPage.selectTime("19:30");

    expect(result).toBe(true);
    expect(reservationPage.getSelectedTime()).toBe("19:30");
    expect(reservationPage.getCurrentStep()).toBe("party-size");
  });

  it("should reject selecting an unavailable time slot", async () => {
    await reservationPage.selectDate("2026-07-15");

    await expect(reservationPage.selectTime("19:00")).rejects.toThrow(
      "Time slot is not available"
    );
  });

  it("should set party size within valid range", async () => {
    await reservationPage.selectDate("2026-07-15");
    await reservationPage.selectTime("20:00");

    const result = await reservationPage.setPartySize(4);

    expect(result).toBe(true);
    expect(reservationPage.getPartySize()).toBe(4);
    expect(reservationPage.getCurrentStep()).toBe("details");
  });

  it("should reject party size of 0", async () => {
    await reservationPage.selectDate("2026-07-15");
    await reservationPage.selectTime("20:00");

    await expect(reservationPage.setPartySize(0)).rejects.toThrow(
      "Party size must be at least 1"
    );
  });

  it("should reject party size over 20", async () => {
    await reservationPage.selectDate("2026-07-15");
    await reservationPage.selectTime("20:00");

    await expect(reservationPage.setPartySize(25)).rejects.toThrow(
      "Maximum party size is 20"
    );
  });

  it("should add special requests", async () => {
    await reservationPage.selectDate("2026-07-15");
    await reservationPage.selectTime("20:00");
    await reservationPage.setPartySize(2);

    await reservationPage.addSpecialRequests("Anniversary dinner - champagne table");

    expect(reservationPage.getSpecialRequests()).toBe(
      "Anniversary dinner - champagne table"
    );
  });

  it("should enter contact details and proceed to confirmation", async () => {
    await reservationPage.selectDate("2026-07-15");
    await reservationPage.selectTime("20:00");
    await reservationPage.setPartySize(2);

    const result = await reservationPage.enterContactDetails({
      name: "Mario Rossi",
      phone: "+39 333 1234567",
      email: "mario@example.com",
    });

    expect(result).toBe(true);
    expect(reservationPage.getCurrentStep()).toBe("confirm");
  });

  it("should fail with incomplete contact details", async () => {
    await reservationPage.selectDate("2026-07-15");
    await reservationPage.selectTime("20:00");
    await reservationPage.setPartySize(2);

    await expect(
      reservationPage.enterContactDetails({
        name: "",
        phone: "",
        email: "",
      })
    ).rejects.toThrow("All contact fields are required");
  });

  it("should confirm reservation successfully", async () => {
    await reservationPage.selectDate("2026-07-15");
    await reservationPage.selectTime("20:00");
    await reservationPage.setPartySize(2);
    await reservationPage.addSpecialRequests("Quiet table please");
    await reservationPage.enterContactDetails({
      name: "Mario Rossi",
      phone: "+39 333 1234567",
      email: "mario@example.com",
    });

    const confirmation = await reservationPage.confirmReservation();

    expect(confirmation.reservationId).toBeDefined();
    expect(confirmation.status).toBe("confirmed");
    expect(confirmation.date).toBe("2026-07-15");
    expect(confirmation.time).toBe("20:00");
    expect(confirmation.partySize).toBe(2);
    expect(reservationPage.getCurrentStep()).toBe("success");
  });

  it("should fail to confirm without completing all steps", async () => {
    await expect(reservationPage.confirmReservation()).rejects.toThrow(
      "Please complete all steps before confirming"
    );
  });

  it("should view reservation confirmation details", async () => {
    await reservationPage.selectDate("2026-08-01");
    await reservationPage.selectTime("18:00");
    await reservationPage.setPartySize(6);
    await reservationPage.enterContactDetails({
      name: "Luca Bianchi",
      phone: "+39 333 9876543",
      email: "luca@example.com",
    });

    const confirmation = await reservationPage.confirmReservation();
    const details = await reservationPage.viewConfirmation(confirmation.reservationId);

    expect(details.reservationId).toBe(confirmation.reservationId);
    expect(details.date).toBe("2026-08-01");
    expect(details.time).toBe("18:00");
    expect(details.partySize).toBe(6);
  });

  it("should handle large party reservation flow", async () => {
    await reservationPage.selectDate("2026-09-15");
    await reservationPage.selectTime("20:00");
    await reservationPage.setPartySize(15);
    await reservationPage.addSpecialRequests("Corporate event - 3 tables joined");
    await reservationPage.enterContactDetails({
      name: "Giulia Marchetti",
      phone: "+39 333 1112233",
      email: "giulia@company.com",
    });

    const confirmation = await reservationPage.confirmReservation();

    expect(confirmation.partySize).toBe(15);
    expect(confirmation.status).toBe("confirmed");
  });
});
