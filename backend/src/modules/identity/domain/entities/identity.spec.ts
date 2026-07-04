import { UserAccount } from "./user-account";
import { AuthSession } from "./auth-session";

const now = new Date("2026-07-04T00:00:00.000Z");
const accountSnapshot = {
  id: "account-1", readerId: "reader-1", username: "reader.an", passwordHash: "hash",
  role: "reader", isActive: true, failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: null,
};

describe("Identity domain", () => {
  it("locks an account after five failed attempts and unlocks after the window", () => {
    const account = UserAccount.restore(accountSnapshot);
    for (let i = 0; i < 5; i += 1) account.recordFailedLogin(now, 5, 15);
    expect(account.lockedUntil).toEqual(new Date("2026-07-04T00:15:00.000Z"));
    expect(() => account.assertCanAuthenticate(new Date("2026-07-04T00:10:00.000Z"))).toThrow("Account is temporarily locked");
    expect(() => account.assertCanAuthenticate(new Date("2026-07-04T00:16:00.000Z"))).not.toThrow();
  });

  it("resets failed attempts after successful authentication", () => {
    const account = UserAccount.restore({ ...accountSnapshot, failedLoginAttempts: 3 });
    account.recordSuccessfulLogin(now);
    expect(account.failedLoginAttempts).toBe(0);
    expect(account.lastLoginAt).toEqual(now);
  });

  it("rotates and revokes refresh sessions", () => {
    const session = AuthSession.create({ id: "session-1", accountId: "account-1", refreshTokenHash: "old", expiresAt: new Date("2026-07-11T00:00:00Z"), createdAt: now });
    session.rotate("new", new Date("2026-07-12T00:00:00Z"), now);
    expect(session.refreshTokenHash).toBe("new");
    session.revoke(now);
    expect(() => session.assertActive(now)).toThrow("Authentication session is revoked");
  });
});
