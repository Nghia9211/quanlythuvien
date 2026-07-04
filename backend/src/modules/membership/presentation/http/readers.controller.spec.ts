import { ConflictException, NotFoundException } from "@nestjs/common";
import { DuplicateReaderError, ReaderNotFoundError } from "../../application/errors/membership-application.error";
import { ReadersController } from "./readers.controller";

describe("ReadersController", () => {
  const result = { id: "reader-1", fullName: "Nguyễn Văn An" };

  function controller(overrides: Partial<Record<string, { execute: (...args: any[]) => any }>> = {}) {
    return new ReadersController(
      (overrides.register ?? { execute: async () => result }) as any,
      (overrides.get ?? { execute: async () => result }) as any,
      (overrides.update ?? { execute: async () => result }) as any,
      (overrides.renew ?? { execute: async () => result }) as any,
      (overrides.status ?? { execute: async () => result }) as any,
    );
  }

  it("passes the authenticated staff id into reader registration", async () => {
    let received: unknown;
    const instance = controller({ register: { execute: async (command) => { received = command; return result; } } });
    const request = {
      fullName: "Nguyễn Văn An",
      dateOfBirth: "2000-01-02",
      email: "an@example.com",
      identityNumber: "001200000001",
      username: "reader.an",
      initialPassword: "StrongPass123!",
      cardValidityMonths: 12,
    };

    await instance.register(request, "staff-1");

    expect(received).toEqual({ ...request, actorId: "staff-1" });
  });

  it("maps duplicate and missing reader errors to HTTP conflict/not-found", async () => {
    const duplicate = controller({ register: { execute: async () => { throw new DuplicateReaderError("email"); } } });
    await expect(duplicate.register({} as any, "staff-1")).rejects.toBeInstanceOf(ConflictException);

    const missing = controller({ get: { execute: async () => { throw new ReaderNotFoundError("missing"); } } });
    await expect(missing.get("missing")).rejects.toBeInstanceOf(NotFoundException);
  });
});
