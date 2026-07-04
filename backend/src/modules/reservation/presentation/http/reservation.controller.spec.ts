import { BadRequestException } from "@nestjs/common";
import { ReservationError } from "../../application/errors/reservation.error";
import { ReservationController } from "./reservation.controller";

describe("ReservationController", () => {
  const useCase = () => ({ execute: async () => ({ ok: true }) });
  it("uses the authenticated reader identity when placing and listing", async () => {
    let placed: any; let listed: any[] = [];
    const controller = new ReservationController(
      { execute: async (command: any) => { placed = command; return {}; } } as any,
      useCase() as any, useCase() as any,
      { execute: async (...args: any[]) => { listed = args; return []; } } as any,
    );
    await controller.place({ bookTitleId: "title", branchId: "branch" }, { id: "account", readerId: "reader-1", role: "reader" });
    await controller.list("reader-1", { readerId: "reader-1", role: "reader" });
    expect(placed).toMatchObject({ actorId: "account", readerId: "reader-1" });
    expect(listed).toEqual(["reader-1", "reader-1"]);
  });
  it("maps application errors to HTTP 400", async () => {
    const failing = { execute: async () => { throw new ReservationError("bad"); } };
    const controller = new ReservationController(failing as any, useCase() as any, useCase() as any, useCase() as any);
    await expect(controller.place({} as any, { id: "a", readerId: "r" })).rejects.toBeInstanceOf(BadRequestException);
  });
  it("requires staff to provide a cancellation reason", async () => {
    const controller = new ReservationController(useCase() as any, useCase() as any, useCase() as any, useCase() as any);
    await expect(controller.cancel("reservation", {}, { id: "staff", role: "staff" })).rejects.toBeInstanceOf(BadRequestException);
  });
});
