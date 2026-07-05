import { compare } from "bcryptjs";
import { BcryptPasswordHasher } from "./bcrypt-password-hasher";
import { Test } from "@nestjs/testing";

describe("BcryptPasswordHasher", () => {
  it("stores a one-way bcrypt hash instead of the initial password", async () => {
    const hasher = new BcryptPasswordHasher(4);
    const hash = await hasher.hash("StrongPass123!");

    expect(hash).not.toBe("StrongPass123!");
    await expect(compare("StrongPass123!", hash)).resolves.toBe(true);
  });
  it("can be constructed by Nest without an explicit rounds provider", async () => {
    const module = await Test.createTestingModule({ providers: [BcryptPasswordHasher] }).compile();
    expect(module.get(BcryptPasswordHasher)).toBeInstanceOf(BcryptPasswordHasher);
  });
});
