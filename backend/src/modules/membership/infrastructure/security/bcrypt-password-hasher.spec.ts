import { compare } from "bcryptjs";
import { BcryptPasswordHasher } from "./bcrypt-password-hasher";

describe("BcryptPasswordHasher", () => {
  it("stores a one-way bcrypt hash instead of the initial password", async () => {
    const hasher = new BcryptPasswordHasher(4);
    const hash = await hasher.hash("StrongPass123!");

    expect(hash).not.toBe("StrongPass123!");
    await expect(compare("StrongPass123!", hash)).resolves.toBe(true);
  });
});
