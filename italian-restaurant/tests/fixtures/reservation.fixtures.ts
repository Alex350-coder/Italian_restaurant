export const todayReservation = {
  id: "res-001-today",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  reservation_date: new Date().toISOString().split("T")[0],
  reservation_time: "19:00",
  party_size: 4,
  name: "Mario Rossi",
  phone: "+39 333 1234567",
  email: "mario.rossi@example.com",
  notes: "Window seat please",
  status: "confirmed",
  created_at: new Date(),
  updated_at: new Date(),
};

export const futureReservation = {
  id: "res-002-future",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  reservation_date: "2026-07-15",
  reservation_time: "20:00",
  party_size: 2,
  name: "Mario Rossi",
  phone: "+39 333 1234567",
  email: "mario.rossi@example.com",
  notes: "Anniversary dinner - champagne ready",
  status: "confirmed",
  created_at: new Date("2026-06-01"),
  updated_at: new Date("2026-06-01"),
};

export const pastReservation = {
  id: "res-003-past",
  user_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  reservation_date: "2026-05-15",
  reservation_time: "18:30",
  party_size: 6,
  name: "Luca Bianchi",
  phone: "+39 333 9876543",
  email: "luca.bianchi@example.com",
  notes: null,
  status: "completed",
  created_at: new Date("2026-05-01"),
  updated_at: new Date("2026-05-15"),
};

export const cancelledReservation = {
  id: "res-004-cancelled",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  reservation_date: "2026-06-20",
  reservation_time: "19:30",
  party_size: 8,
  name: "Mario Rossi",
  phone: "+39 333 1234567",
  email: "mario.rossi@example.com",
  notes: "Large party",
  status: "cancelled",
  created_at: new Date("2026-06-01"),
  updated_at: new Date("2026-06-05"),
};

export const pendingReservation = {
  id: "res-005-pending",
  user_id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  reservation_date: "2026-07-20",
  reservation_time: "12:30",
  party_size: 3,
  name: "Sofia Verdi",
  phone: "+39 333 5556677",
  email: "sofia.verdi@example.com",
  notes: "Lunch meeting, need quiet table",
  status: "pending",
  created_at: new Date("2026-06-02"),
  updated_at: new Date("2026-06-02"),
};

export const largePartyReservation = {
  id: "res-006-large",
  user_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  reservation_date: "2026-08-01",
  reservation_time: "20:00",
  party_size: 15,
  name: "Luca Bianchi",
  phone: "+39 333 9876543",
  email: "luca.bianchi@example.com",
  notes: "Corporate dinner event",
  status: "confirmed",
  created_at: new Date("2026-06-02"),
  updated_at: new Date("2026-06-02"),
};

export const singleGuestReservation = {
  id: "res-007-single",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  reservation_date: "2026-07-25",
  reservation_time: "12:00",
  party_size: 1,
  name: "Mario Rossi",
  phone: "+39 333 1234567",
  email: "mario.rossi@example.com",
  notes: "Solo dining, bar seat preferred",
  status: "confirmed",
  created_at: new Date("2026-06-02"),
  updated_at: new Date("2026-06-02"),
};

export const maxPartyReservation = {
  id: "res-008-maxparty",
  user_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  reservation_date: "2026-08-15",
  reservation_time: "19:00",
  party_size: 20,
  name: "Luca Bianchi",
  phone: "+39 333 9876543",
  email: "luca.bianchi@example.com",
  notes: "Wedding rehearsal dinner",
  status: "confirmed",
  created_at: new Date("2026-06-02"),
  updated_at: new Date("2026-06-02"),
};

export const sameDayReservation = {
  id: "res-009-sameday",
  user_id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  reservation_date: new Date().toISOString().split("T")[0],
  reservation_time: "13:00",
  party_size: 2,
  name: "Sofia Verdi",
  phone: "+39 333 5556677",
  email: "sofia.verdi@example.com",
  notes: null,
  status: "confirmed",
  created_at: new Date(),
  updated_at: new Date(),
};

export const noNotesReservation = {
  id: "res-010-nonotes",
  user_id: "c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f",
  reservation_date: "2026-09-01",
  reservation_time: "20:00",
  party_size: 4,
  name: "Mario Rossi",
  phone: "+39 333 1234567",
  email: "mario.rossi@example.com",
  notes: "",
  status: "pending",
  created_at: new Date("2026-06-02"),
  updated_at: new Date("2026-06-02"),
};

export const earlyMorningReservation = {
  id: "res-011-early",
  user_id: "b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  reservation_date: "2026-07-20",
  reservation_time: "11:30",
  party_size: 3,
  name: "Luca Bianchi",
  phone: "+39 333 9876543",
  email: "luca.bianchi@example.com",
  notes: "Business brunch meeting",
  status: "confirmed",
  created_at: new Date("2026-06-02"),
  updated_at: new Date("2026-06-02"),
};

export const lateNightReservation = {
  id: "res-012-latenight",
  user_id: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
  reservation_date: "2026-08-05",
  reservation_time: "21:30",
  party_size: 6,
  name: "Sofia Verdi",
  phone: "+39 333 5556677",
  email: "sofia.verdi@example.com",
  notes: "Late dinner, anniversary celebration",
  status: "confirmed",
  created_at: new Date("2026-06-02"),
  updated_at: new Date("2026-06-02"),
};

export const allReservations = [
  todayReservation,
  futureReservation,
  pastReservation,
  cancelledReservation,
  pendingReservation,
  largePartyReservation,
  singleGuestReservation,
  maxPartyReservation,
  sameDayReservation,
  noNotesReservation,
  earlyMorningReservation,
  lateNightReservation,
];

export const todayReservations = [todayReservation, sameDayReservation];
export const confirmedReservations = [
  todayReservation,
  futureReservation,
  largePartyReservation,
  singleGuestReservation,
  maxPartyReservation,
  earlyMorningReservation,
  lateNightReservation,
];
export const cancelledReservations = [cancelledReservation];
export const pendingReservations = [pendingReservation, noNotesReservation];
