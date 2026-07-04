import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, timingSafeEqual } from "crypto";
import { UserAccount } from "../../domain/entities/user-account";
import { AuthTokenService, RefreshTokenPayload } from "../../application/ports/security.ports";
@Injectable()
export class JwtTokenService implements AuthTokenService {
  constructor(private jwt: JwtService, private config: ConfigService) {}
  async issue(account: UserAccount, sessionId: string) {
    const base = { sub: account.id, sid: sessionId, role: account.role, readerId: account.readerId };
    const accessToken = await this.jwt.signAsync({ ...base, typ: "access" }, { secret: this.value("jwt.accessSecret"), expiresIn: this.value("jwt.accessExpiresIn") as any });
    const refreshToken = await this.jwt.signAsync({ ...base, typ: "refresh" }, { secret: this.value("jwt.refreshSecret"), expiresIn: this.value("jwt.refreshExpiresIn") as any });
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    return { accessToken, refreshToken, refreshExpiresAt: new Date(decoded.exp * 1000) };
  }
  async verifyRefresh(token: string): Promise<RefreshTokenPayload> {
    const x = await this.jwt.verifyAsync<any>(token, { secret: this.value("jwt.refreshSecret") });
    if (x.typ !== "refresh" || !x.sub || !x.sid) throw new Error("Invalid refresh token");
    return { accountId: x.sub, sessionId: x.sid, role: x.role };
  }
  hashRefresh(token: string) { return createHash("sha256").update(token).digest("hex"); }
  matchesRefresh(token: string, expectedHash: string) { const actual = Buffer.from(this.hashRefresh(token)); const expected = Buffer.from(expectedHash); return actual.length === expected.length && timingSafeEqual(actual, expected); }
  private value(key: string) { const value = this.config.get<string>(key); if (!value) throw new Error(`Missing configuration ${key}`); return value; }
}
