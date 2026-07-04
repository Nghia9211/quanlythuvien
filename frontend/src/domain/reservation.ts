export type ReservationStatus = "WAITING" | "ON_HOLD" | "COMPLETED" | "CANCELLED" | "EXPIRED";

export interface Reservation {
  id: string;
  readerId: string;
  bookTitleId: string;
  branchId: string;
  status: ReservationStatus;
  copyId: string | null;
  holdExpiresAt: string | null;
  createdAt: string;
  cancelReason: string | null;
}

export interface AllocateReservationInput {
  bookTitleId: string;
  branchId: string;
}
