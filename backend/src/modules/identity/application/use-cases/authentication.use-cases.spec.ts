import { AuthSession } from "../../domain/entities/auth-session";
import { UserAccount } from "../../domain/entities/user-account";
import { AuthenticationError } from "../errors/authentication.error";
import { IdentityTransaction, IdentityUnitOfWork } from "../ports/identity-unit-of-work.port";
import { AuthTokenService, Clock, IdentifierGenerator, PasswordVerifier } from "../ports/security.ports";
import { GetCurrentUserUseCase, LoginUseCase, LogoutUseCase, RefreshSessionUseCase, ValidateAccessSessionUseCase } from "./authentication.use-cases";

class MemoryIdentity implements IdentityUnitOfWork, IdentityTransaction {
  account = UserAccount.restore({ id: "account-1", readerId: "reader-1", username: "reader.an", passwordHash: "correct-hash", role: "reader", isActive: true, failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: null });
  sessions = new Map<string, AuthSession>(); audits: string[] = [];
  execute<T>(work: (tx: IdentityTransaction) => Promise<T>) { return work(this); }
  findAccountByUsername(username: string) { return Promise.resolve(username === this.account.username ? this.account : null); }
  findAccountById(id: string) { return Promise.resolve(id === this.account.id ? this.account : null); }
  saveAccount(value: UserAccount) { this.account = value; return Promise.resolve(); }
  findSessionById(id: string) { return Promise.resolve(this.sessions.get(id) ?? null); }
  saveSession(value: AuthSession) { this.sessions.set(value.id, value); return Promise.resolve(); }
  appendAudit(event: { action: string }) { this.audits.push(event.action); return Promise.resolve(); }
}
class FixedClock implements Clock { now() { return new Date("2026-07-04T00:00:00.000Z"); } }
class FixedId implements IdentifierGenerator { next() { return "session-1"; } }
class FakePasswords implements PasswordVerifier { verify(password: string, hash: string) { return Promise.resolve(password === "correct" && hash === "correct-hash"); } }
class FakeTokens implements AuthTokenService {
  counter = 0;
  issue(account: UserAccount, sessionId: string) { this.counter += 1; return Promise.resolve({ accessToken: `access-${this.counter}`, refreshToken: `refresh-${this.counter}`, refreshExpiresAt: new Date("2026-07-11T00:00:00Z") }); }
  verifyRefresh(token: string) { const n = token.split("-")[1]; return Promise.resolve({ accountId: "account-1", sessionId: "session-1", role: "reader", tokenNumber: n }); }
  hashRefresh(token: string) { return `hash:${token}`; }
  matchesRefresh(token: string, hash: string) { return this.hashRefresh(token) === hash; }
}

describe("Authentication application", () => {
  it("logs in, resets failures and creates a hashed refresh session", async () => {
    const store = new MemoryIdentity(); const tokens = new FakeTokens();
    const login = new LoginUseCase(store, new FakePasswords(), tokens, new FixedClock(), new FixedId());
    const result = await login.execute({ username: " READER.AN ", password: "correct" });
    expect(result.accessToken).toBe("access-1");
    expect(store.sessions.get("session-1")?.refreshTokenHash).toBe("hash:refresh-1");
    expect(store.audits).toContain("LOGIN_SUCCEEDED");
  });

  it("records failures and locks after the fifth invalid password", async () => {
    const store = new MemoryIdentity(); const login = new LoginUseCase(store, new FakePasswords(), new FakeTokens(), new FixedClock(), new FixedId());
    for (let i = 0; i < 5; i += 1) await expect(login.execute({ username: "reader.an", password: "wrong" })).rejects.toBeInstanceOf(AuthenticationError);
    expect(store.account.failedLoginAttempts).toBe(5);
    expect(store.account.lockedUntil).not.toBeNull();
  });

  it("rotates refresh tokens and rejects reuse", async () => {
    const store = new MemoryIdentity(); const tokens = new FakeTokens();
    await new LoginUseCase(store, new FakePasswords(), tokens, new FixedClock(), new FixedId()).execute({ username: "reader.an", password: "correct" });
    const refresh = new RefreshSessionUseCase(store, tokens, new FixedClock());
    const rotated = await refresh.execute("refresh-1");
    expect(rotated.refreshToken).toBe("refresh-2");
    await expect(refresh.execute("refresh-1")).rejects.toBeInstanceOf(AuthenticationError);
    expect(store.sessions.get("session-1")?.revokedAt).not.toBeNull();
  });

  it("revokes logout and denies subsequent access-session validation", async () => {
    const store = new MemoryIdentity(); const tokens = new FakeTokens(); const clock = new FixedClock();
    await new LoginUseCase(store, new FakePasswords(), tokens, clock, new FixedId()).execute({ username: "reader.an", password: "correct" });
    await new LogoutUseCase(store, clock).execute("account-1", "session-1");
    await expect(new ValidateAccessSessionUseCase(store, clock).execute("account-1", "session-1")).rejects.toBeInstanceOf(AuthenticationError);
    await expect(new GetCurrentUserUseCase(store).execute("missing")).rejects.toBeInstanceOf(AuthenticationError);
  });
});
