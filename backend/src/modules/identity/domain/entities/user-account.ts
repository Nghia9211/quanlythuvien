import { IdentityDomainError } from "../errors/identity-domain.error";
export interface UserAccountSnapshot {
  id: string; readerId: string | null; username: string; passwordHash: string; role: string;
  isActive: boolean; failedLoginAttempts: number; lockedUntil: Date | null; lastLoginAt: Date | null;
}
export class UserAccount {
  private constructor(private state: UserAccountSnapshot) {}
  static restore(x: UserAccountSnapshot) { return new UserAccount({ ...x, username: x.username.trim().toLowerCase(), lockedUntil: x.lockedUntil ? new Date(x.lockedUntil) : null, lastLoginAt: x.lastLoginAt ? new Date(x.lastLoginAt) : null }); }
  get id() { return this.state.id; } get readerId() { return this.state.readerId; }
  get username() { return this.state.username; } get passwordHash() { return this.state.passwordHash; }
  get role() { return this.state.role; } get isActive() { return this.state.isActive; }
  get failedLoginAttempts() { return this.state.failedLoginAttempts; }
  get lockedUntil() { return this.state.lockedUntil ? new Date(this.state.lockedUntil) : null; }
  get lastLoginAt() { return this.state.lastLoginAt ? new Date(this.state.lastLoginAt) : null; }
  assertCanAuthenticate(now: Date) {
    if (!this.state.isActive) throw new IdentityDomainError("Account is disabled");
    if (this.state.lockedUntil && this.state.lockedUntil > now) throw new IdentityDomainError("Account is temporarily locked");
  }
  recordFailedLogin(now: Date, maximum: number, lockMinutes: number) {
    if (this.state.lockedUntil && this.state.lockedUntil <= now) { this.state.failedLoginAttempts = 0; this.state.lockedUntil = null; }
    this.state.failedLoginAttempts += 1;
    if (this.state.failedLoginAttempts >= maximum) this.state.lockedUntil = new Date(now.getTime() + lockMinutes * 60_000);
  }
  recordSuccessfulLogin(now: Date) { this.state.failedLoginAttempts = 0; this.state.lockedUntil = null; this.state.lastLoginAt = new Date(now); }
  toSnapshot(): UserAccountSnapshot { return { ...this.state, lockedUntil: this.lockedUntil, lastLoginAt: this.lastLoginAt }; }
}
