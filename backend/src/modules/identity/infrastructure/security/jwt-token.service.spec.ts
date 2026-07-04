import { JwtService } from "@nestjs/jwt";
import { UserAccount } from "../../domain/entities/user-account";
import { JwtTokenService } from "./jwt-token.service";

describe("JwtTokenService", () => {
  it("issues separate access/refresh tokens and verifies refresh payload", async () => {
    const config = { get: (key: string) => ({
      "jwt.accessSecret": "access-secret-at-least-32-characters-long",
      "jwt.refreshSecret": "refresh-secret-at-least-32-characters-long",
      "jwt.accessExpiresIn": "15m", "jwt.refreshExpiresIn": "7d",
    } as Record<string, string>)[key] } as any;
    const service = new JwtTokenService(new JwtService(), config);
    const account = UserAccount.restore({ id: "account-1", readerId: "reader-1", username: "reader.an", passwordHash: "hash", role: "reader", isActive: true, failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: null });
    const pair = await service.issue(account, "session-1");
    expect(pair.accessToken).not.toBe(pair.refreshToken);
    await expect(service.verifyRefresh(pair.refreshToken)).resolves.toMatchObject({ accountId: "account-1", sessionId: "session-1", role: "reader" });
    expect(service.matchesRefresh(pair.refreshToken, service.hashRefresh(pair.refreshToken))).toBe(true);
  });
});
