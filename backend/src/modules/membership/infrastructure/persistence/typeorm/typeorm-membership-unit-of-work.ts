import { Inject, Injectable } from "@nestjs/common";
import { DataSource, EntityManager, Not } from "typeorm";
import { Reader } from "../../../domain/entities/reader";
import {
  AccountProvisioningInput,
  AuditEvent,
  DuplicateReaderMatch,
  MembershipTransaction,
  MembershipUnitOfWork,
} from "../../../application/ports/membership-unit-of-work.port";
import { MembershipConflictError } from "../../../application/errors/membership-application.error";
import { BcryptPasswordHasher, PasswordHasher } from "../../security/bcrypt-password-hasher";
import { AuditLogOrmEntity } from "./entities/audit-log.orm-entity";
import { LibraryCardOrmEntity } from "./entities/library-card.orm-entity";
import { ReaderAccountOrmEntity } from "./entities/reader-account.orm-entity";
import { ReaderOrmEntity } from "./entities/reader.orm-entity";

@Injectable()
export class TypeOrmMembershipUnitOfWork implements MembershipUnitOfWork {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(BcryptPasswordHasher) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute<T>(work: (transaction: MembershipTransaction) => Promise<T>): Promise<T> {
    try {
      return await this.dataSource.transaction((manager) =>
        work(new TypeOrmMembershipTransaction(manager, this.passwordHasher)),
      );
    } catch (error) {
      const postgresError = error as { code?: string; driverError?: { code?: string }; constraint?: string };
      if ((postgresError.code ?? postgresError.driverError?.code) === "23505") {
        throw new MembershipConflictError(
          `Membership data conflicts with an existing record${postgresError.constraint ? ` (${postgresError.constraint})` : ""}`,
        );
      }
      throw error;
    }
  }
}

class TypeOrmMembershipTransaction implements MembershipTransaction {
  constructor(private readonly manager: EntityManager, private readonly passwordHasher: PasswordHasher) {}

  async findDuplicate(input: {
    email: string;
    identityNumber: string;
    excludeReaderId?: string;
  }): Promise<DuplicateReaderMatch | null> {
    const id = input.excludeReaderId ? Not(input.excludeReaderId) : undefined;
    const record = await this.manager.getRepository(ReaderOrmEntity).findOne({
      where: [
        { ...(id ? { id } : {}), email: input.email },
        { ...(id ? { id } : {}), identityNumber: input.identityNumber },
      ],
    });
    if (!record) return null;
    return {
      readerId: record.id,
      field: record.email === input.email ? "email" : "identityNumber",
    };
  }

  async findReaderById(readerId: string): Promise<Reader | null> {
    const record = await this.manager.getRepository(ReaderOrmEntity).findOne({
      where: { id: readerId },
      relations: { card: true },
    });
    if (!record) return null;
    if (!record.card) throw new Error(`Reader ${readerId} has no library card`);
    return Reader.restore({
      id: record.id,
      fullName: record.fullName,
      dateOfBirth: new Date(`${record.dateOfBirth}T00:00:00.000Z`),
      email: record.email,
      phone: record.phone,
      identityNumber: record.identityNumber,
      address: record.address,
      status: record.status,
      card: {
        id: record.card.id,
        cardNumber: record.card.cardNumber,
        status: record.card.status,
        issuedAt: record.card.issuedAt,
        expiresAt: record.card.expiresAt,
        lockReason: record.card.lockReason,
      },
    });
  }

  async saveReader(reader: Reader): Promise<void> {
    const snapshot = reader.toSnapshot();
    await this.manager.getRepository(ReaderOrmEntity).save({
      id: snapshot.id,
      fullName: snapshot.fullName,
      dateOfBirth: snapshot.dateOfBirth.toISOString().slice(0, 10),
      email: snapshot.email,
      phone: snapshot.phone,
      identityNumber: snapshot.identityNumber,
      address: snapshot.address,
      status: snapshot.status,
    });
    await this.manager.getRepository(LibraryCardOrmEntity).save({
      id: snapshot.card.id,
      readerId: snapshot.id,
      cardNumber: snapshot.card.cardNumber,
      status: snapshot.card.status,
      issuedAt: snapshot.card.issuedAt,
      expiresAt: snapshot.card.expiresAt,
      lockReason: snapshot.card.lockReason,
    });
  }

  async provisionAccount(input: AccountProvisioningInput): Promise<void> {
    const passwordHash = await this.passwordHasher.hash(input.initialPassword);
    await this.manager.getRepository(ReaderAccountOrmEntity).insert({
      readerId: input.readerId,
      username: input.username,
      passwordHash,
      role: "reader",
      isActive: true,
    });
  }

  async appendAudit(event: AuditEvent): Promise<void> {
    await this.manager.getRepository(AuditLogOrmEntity).insert({
      actorId: event.actorId,
      action: event.action,
      aggregateType: "Reader",
      aggregateId: event.aggregateId,
      reason: event.reason ?? null,
      details: JSON.parse(JSON.stringify(event.details ?? {})),
    });
  }
}
