import { Reservation, ReservationStatus } from "./reservation";

describe("Reservation", () => {
  const waiting = () => Reservation.create({ id: "reservation-1", readerId: "reader-1", bookTitleId: "title-1", branchId: "branch-1", createdAt: new Date("2026-07-04T00:00:00Z") });
  it("moves through waiting, hold, and completed states", () => {
    const reservation = waiting(); reservation.allocate("copy-1", new Date("2026-07-06T00:00:00Z")); reservation.complete();
    expect(reservation.status).toBe(ReservationStatus.COMPLETED); expect(reservation.copyId).toBe("copy-1");
  });
  it("rejects invalid transitions and blank cancellation reasons", () => {
    const reservation = waiting(); expect(() => reservation.cancel(" ")).toThrow("reason");
    reservation.cancel("No longer needed"); expect(() => reservation.allocate("copy", new Date())).toThrow("waiting");
  });
});
