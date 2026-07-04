export interface ReservationNotification {
  id: string;
  reservationId: string;
  readerId: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface NotificationPort { send(message: ReservationNotification): Promise<void>; }
export const RESERVATION_NOTIFICATION_PORT = Symbol("RESERVATION_NOTIFICATION_PORT");
