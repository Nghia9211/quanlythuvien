import { CirculationError } from "../../application/errors/circulation.error";
import { CirculationController } from "./circulation.controller";
import { BadRequestException } from "@nestjs/common";
describe("CirculationController", () => {
  const uc = () => ({ execute: async () => ({ ok: true }) });
  it("adds staff actor to borrowing and maps business errors", async () => {
    let command: any; const controller = new CirculationController({ execute: async (x: any) => { command = x; return {}; } } as any, uc() as any, uc() as any, uc() as any);
    await controller.borrow({ cardNumber: "CARD", barcodes: ["BC"] }, { id: "staff-1", role: "staff" });
    expect(command.actorId).toBe("staff-1");
    const invalid = new CirculationController({ execute: async () => { throw new CirculationError("bad"); } } as any, uc() as any, uc() as any, uc() as any);
    await expect(invalid.borrow({} as any, { id: "staff" })).rejects.toBeInstanceOf(BadRequestException);
  });
});
