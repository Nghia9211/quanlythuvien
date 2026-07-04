import { UserAccount } from "../../domain/entities/user-account";
export interface Clock { now(): Date; } export interface IdentifierGenerator { next(): string; }
export interface PasswordVerifier { verify(password: string, hash: string): Promise<boolean>; }
export interface TokenPair { accessToken: string; refreshToken: string; refreshExpiresAt: Date; }
export interface RefreshTokenPayload { accountId: string; sessionId: string; role: string; }
export interface AuthTokenService {
  issue(account: UserAccount, sessionId: string): Promise<TokenPair>;
  verifyRefresh(token: string): Promise<RefreshTokenPayload>;
  hashRefresh(token: string): string;
  matchesRefresh(token: string, expectedHash: string): boolean;
}
