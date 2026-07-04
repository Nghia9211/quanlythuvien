import { AuthSession } from "../../domain/entities/auth-session";
import { IdentityDomainError } from "../../domain/errors/identity-domain.error";
import { AuthenticationError } from "../errors/authentication.error";
import { IdentityUnitOfWork } from "../ports/identity-unit-of-work.port";
import { AuthTokenService, Clock, IdentifierGenerator, PasswordVerifier } from "../ports/security.ports";
const accountView = (x: any) => ({ id: x.id, readerId: x.readerId, username: x.username, role: x.role });
function assertAuthenticationState(operation: () => void) {
  try { operation(); } catch (error) {
    if (error instanceof IdentityDomainError) throw new AuthenticationError(error.message);
    throw error;
  }
}
export class LoginUseCase {
  constructor(private uow: IdentityUnitOfWork, private passwords: PasswordVerifier, private tokens: AuthTokenService, private clock: Clock, private ids: IdentifierGenerator) {}
  execute(c: { username: string; password: string }) { return this.uow.execute(async tx => {
    const account = await tx.findAccountByUsername(c.username.trim().toLowerCase());
    if (!account) throw new AuthenticationError("Invalid username or password");
    assertAuthenticationState(() => account.assertCanAuthenticate(this.clock.now()));
    if (!await this.passwords.verify(c.password, account.passwordHash)) {
      account.recordFailedLogin(this.clock.now(), 5, 15); await tx.saveAccount(account);
      await tx.appendAudit({ actorId: account.id, action: "LOGIN_FAILED" }); throw new AuthenticationError("Invalid username or password");
    }
    account.recordSuccessfulLogin(this.clock.now()); const sessionId = this.ids.next(); const pair = await this.tokens.issue(account, sessionId);
    const session = AuthSession.create({ id: sessionId, accountId: account.id, refreshTokenHash: this.tokens.hashRefresh(pair.refreshToken), expiresAt: pair.refreshExpiresAt, createdAt: this.clock.now() });
    await tx.saveAccount(account); await tx.saveSession(session); await tx.appendAudit({ actorId: account.id, action: "LOGIN_SUCCEEDED" });
    return { ...pair, user: accountView(account) };
  }); }
}
export class RefreshSessionUseCase {
  constructor(private uow: IdentityUnitOfWork, private tokens: AuthTokenService, private clock: Clock) {}
  async execute(refreshToken: string) {
    let payload; try { payload = await this.tokens.verifyRefresh(refreshToken); } catch { throw new AuthenticationError("Invalid refresh token"); }
    return this.uow.execute(async tx => {
      const account = await tx.findAccountById(payload.accountId); const session = await tx.findSessionById(payload.sessionId);
      if (!account || !session || session.accountId !== account.id) throw new AuthenticationError("Invalid refresh token");
      assertAuthenticationState(() => { account.assertCanAuthenticate(this.clock.now()); session.assertActive(this.clock.now()); });
      if (!this.tokens.matchesRefresh(refreshToken, session.refreshTokenHash)) { session.revoke(this.clock.now()); await tx.saveSession(session); throw new AuthenticationError("Refresh token reuse detected"); }
      const pair = await this.tokens.issue(account, session.id); session.rotate(this.tokens.hashRefresh(pair.refreshToken), pair.refreshExpiresAt, this.clock.now());
      await tx.saveSession(session); await tx.appendAudit({ actorId: account.id, action: "SESSION_REFRESHED" }); return { ...pair, user: accountView(account) };
    });
  }
}
export class LogoutUseCase {
  constructor(private uow: IdentityUnitOfWork, private clock: Clock) {}
  execute(accountId: string, sessionId: string) { return this.uow.execute(async tx => {
    const session = await tx.findSessionById(sessionId); if (!session || session.accountId !== accountId) throw new AuthenticationError();
    session.revoke(this.clock.now()); await tx.saveSession(session); await tx.appendAudit({ actorId: accountId, action: "LOGOUT" }); return { loggedOut: true };
  }); }
}
export class ValidateAccessSessionUseCase {
  constructor(private uow: IdentityUnitOfWork, private clock: Clock) {}
  execute(accountId: string, sessionId: string) { return this.uow.execute(async tx => {
    const account = await tx.findAccountById(accountId); const session = await tx.findSessionById(sessionId);
    if (!account || !session || session.accountId !== account.id) throw new AuthenticationError();
    assertAuthenticationState(() => { account.assertCanAuthenticate(this.clock.now()); session.assertActive(this.clock.now()); }); return accountView(account);
  }); }
}
export class GetCurrentUserUseCase {
  constructor(private uow: IdentityUnitOfWork) {}
  execute(accountId: string) { return this.uow.execute(async tx => { const account = await tx.findAccountById(accountId); if (!account) throw new AuthenticationError(); return accountView(account); }); }
}
