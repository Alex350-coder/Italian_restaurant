export enum ReservationStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  SEATED = "seated",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  NO_SHOW = "no_show",
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: "Pendiente",
  [ReservationStatus.CONFIRMED]: "Confirmada",
  [ReservationStatus.SEATED]: "Sentado",
  [ReservationStatus.COMPLETED]: "Completada",
  [ReservationStatus.CANCELLED]: "Cancelada",
  [ReservationStatus.NO_SHOW]: "No presentado",
};

export interface TimeSlot {
  time: string;
  isAvailable: boolean;
  maxPartySize: number;
}

export interface Reservation {
  id: string;
  userId: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  status: ReservationStatus;
  specialRequests: string | null;
  tableNumber: number | null;
  confirmationCode: string;
  confirmedAt: string | null;
  seatedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationDTO {
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  specialRequests?: string;
}

export interface UpdateReservationDTO {
  reservationDate?: string;
  reservationTime?: string;
  partySize?: number;
  specialRequests?: string;
}

export interface UpdateReservationStatusDTO {
  status: ReservationStatus;
  cancellationReason?: string;
  tableNumber?: number;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  userId?: string;
  startDate?: string;
  endDate?: string;
  partySize?: number;
}

export interface AvailableTimeSlots {
  date: string;
  slots: TimeSlot[];
}

export interface PaginatedReservations {
  reservations: Reservation[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
