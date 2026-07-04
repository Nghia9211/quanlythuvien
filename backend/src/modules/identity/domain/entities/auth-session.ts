import { IdentityDomainError } from "../errors/identity-domain.error";
export interface AuthSessionSnapshot { id: string; accountId: string; refreshTokenHash: string; expiresAt: Date; createdAt: Date; rotatedAt: Date | null; revokedAt: Date | null; }
export type CreateAuthSessionInput = Omit<AuthSessionSnapshot, "rotatedAt" | "revokedAt">;
export class AuthSession {
  private constructor(private state: AuthSessionSnapshot) {}
  static create(x: CreateAuthSessionInput) { return new AuthSession({ ...x, expiresAt: new Date(x.expiresAt), createdAt: new Date(x.createdAt), rotatedAt: null, revokedAt: null }); }
  static restore(x: AuthSessionSnapshot) { return new AuthSession({ ...x, expiresAt: new Date(x.expiresAt), createdAt: new Date(x.createdAt), rotatedAt: x.rotatedAt ? new Date(x.rotatedAt) : null, revokedAt: x.revokedAt ? new Date(x.revokedAt) : null }); }
  get id() { return this.state.id; } get accountId() { return this.state.accountId; }
  get refreshTokenHash() { return this.state.refreshTokenHash; } get expiresAt() { return new Date(this.state.expiresAt); }
  get revokedAt() { return this.state.revokedAt ? new Date(this.state.revokedAt) : null; }
  assertActive(now: Date) { if (this.state.revokedAt) throw new IdentityDomainError("Authentication session is revoked"); if (this.state.expiresAt <= now) throw new IdentityDomainError("Authentication session has expired"); }
  rotate(hash: string, expiresAt: Date, now: Date) { this.assertActive(now); this.state.refreshTokenHash = hash; this.state.expiresAt = new Date(expiresAt); this.state.rotatedAt = new Date(now); }
  revoke(now: Date) { if (!this.state.revokedAt) this.state.revokedAt = new Date(now); }
  toSnapshot(): AuthSessionSnapshot { return { ...this.state, expiresAt: new Date(this.state.expiresAt), createdAt: new Date(this.state.createdAt), rotatedAt: this.state.rotatedAt ? new Date(this.state.rotatedAt) : null, revokedAt: this.revokedAt }; }
}
