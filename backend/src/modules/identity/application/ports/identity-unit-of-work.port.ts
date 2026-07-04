import { AuthSession } from "../../domain/entities/auth-session";
import { UserAccount } from "../../domain/entities/user-account";
export interface IdentityAuditEvent { actorId: string; action: string; details?: Record<string, unknown>; }
export interface IdentityTransaction {
  findAccountByUsername(username: string): Promise<UserAccount | null>; findAccountById(id: string): Promise<UserAccount | null>; saveAccount(value: UserAccount): Promise<void>;
  findSessionById(id: string): Promise<AuthSession | null>; saveSession(value: AuthSession): Promise<void>; appendAudit(event: IdentityAuditEvent): Promise<void>;
}
export interface IdentityUnitOfWork { execute<T>(work: (tx: IdentityTransaction) => Promise<T>): Promise<T>; }
