import { UnauthorizedException } from "@nestjs/common";
import { AuthenticationError } from "../../application/errors/authentication.error";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  const useCase = () => ({ execute: async () => ({ ok: true }) });
  it("delegates login and maps authentication errors to 401", async () => {
    let command: unknown;
    const controller = new AuthController(
      { execute: async (value: unknown) => { command = value; return { ok: true }; } } as any,
      useCase() as any, useCase() as any, useCase() as any,
    );
    await controller.login({ username: "reader.an", password: "secret123" });
    expect(command).toEqual({ username: "reader.an", password: "secret123" });

    const invalid = new AuthController(
      { execute: async () => { throw new AuthenticationError(); } } as any,
      useCase() as any, useCase() as any, useCase() as any,
    );
    await expect(invalid.login({ username: "x", password: "bad" })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
