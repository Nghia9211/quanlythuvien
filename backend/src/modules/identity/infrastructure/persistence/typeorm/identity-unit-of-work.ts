import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { UserAccountOrmEntity } from "@common/entities/user-account.orm-entity";
import { AuthSession } from "../../../domain/entities/auth-session";
import { UserAccount } from "../../../domain/entities/user-account";
import { IdentityAuditEvent, IdentityTransaction, IdentityUnitOfWork } from "../../../application/ports/identity-unit-of-work.port";
import { AuthSessionOrmEntity } from "./entities/auth-session.orm-entity";
@Injectable()
export class TypeOrmIdentityUnitOfWork implements IdentityUnitOfWork {
  constructor(private dataSource: DataSource) {}
  execute<T>(work: (tx: IdentityTransaction) => Promise<T>) { return this.dataSource.transaction(manager => work(new IdentityTransactionAdapter(manager))); }
}
class IdentityTransactionAdapter implements IdentityTransaction {
  constructor(private manager: EntityManager) {}
  async findAccountByUsername(username: string) { const x = await this.manager.getRepository(UserAccountOrmEntity).findOne({ where: { username } }); return x ? this.account(x) : null; }
  async findAccountById(id: string) { const x = await this.manager.getRepository(UserAccountOrmEntity).findOne({ where: { id } }); return x ? this.account(x) : null; }
  async saveAccount(value: UserAccount) { const x = value.toSnapshot(); await this.manager.getRepository(UserAccountOrmEntity).save(x); }
  async findSessionById(id: string) { const x = await this.manager.getRepository(AuthSessionOrmEntity).findOne({ where: { id } }); return x ? AuthSession.restore(x) : null; }
  async saveSession(value: AuthSession) { await this.manager.getRepository(AuthSessionOrmEntity).save(value.toSnapshot()); }
  async appendAudit(event: IdentityAuditEvent) {
    await this.manager.query(`INSERT INTO audit_logs (actor_id, action, aggregate_type, aggregate_id, reason, details) VALUES ($1,$2,$3,$4,$5,$6::jsonb)`, [event.actorId, event.action, "UserAccount", event.actorId, null, JSON.stringify(event.details ?? {})]);
  }
  private account(x: UserAccountOrmEntity) { return UserAccount.restore({ id: x.id, readerId: x.readerId, username: x.username, passwordHash: x.passwordHash, role: x.role, isActive: x.isActive, failedLoginAttempts: x.failedLoginAttempts, lockedUntil: x.lockedUntil, lastLoginAt: x.lastLoginAt }); }
}
