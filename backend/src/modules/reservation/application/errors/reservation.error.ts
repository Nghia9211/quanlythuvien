export class ReservationError extends Error {
  constructor(message: string) { super(message); this.name = "ReservationError"; }
}

export class ReservationNotFoundError extends ReservationError {
  constructor(message: string) { super(message); this.name = "ReservationNotFoundError"; }
}
