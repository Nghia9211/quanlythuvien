import { DataSource, EntityManager } from "typeorm";
import { Reader } from "../../../domain/entities/reader";
import { AuditLogOrmEntity } from "./entities/audit-log.orm-entity";
import { LibraryCardOrmEntity } from "./entities/library-card.orm-entity";
import { ReaderAccountOrmEntity } from "./entities/reader-account.orm-entity";
import { ReaderOrmEntity } from "./entities/reader.orm-entity";
import { PasswordHasher } from "../../security/bcrypt-password-hasher";
import { TypeOrmMembershipUnitOfWork } from "./typeorm-membership-unit-of-work";

describe("TypeOrmMembershipUnitOfWork", () => {
  it("persists reader, card, hashed account and audit through one transaction manager", async () => {
    const writes: Array<{ entity: string; value: unknown }> = [];
    const repositories = new Map<unknown, object>([
      [ReaderOrmEntity, {
        findOne: async () => null,
        save: async (value: unknown) => writes.push({ entity: "reader", value }),
      }],
      [LibraryCardOrmEntity, {
        save: async (value: unknown) => writes.push({ entity: "card", value }),
      }],
      [ReaderAccountOrmEntity, {
        insert: async (value: unknown) => writes.push({ entity: "account", value }),
      }],
      [AuditLogOrmEntity, {
        insert: async (value: unknown) => writes.push({ entity: "audit", value }),
      }],
    ]);
    const manager = {
      getRepository: (entity: unknown) => repositories.get(entity),
    } as EntityManager;
    let transactions = 0;
    const dataSource = {
      transaction: async <T>(work: (entityManager: EntityManager) => Promise<T>) => {
        transactions += 1;
        return work(manager);
      },
    } as DataSource;
    const hasher: PasswordHasher = { hash: async () => "hashed-password" };
    const unitOfWork = new TypeOrmMembershipUnitOfWork(dataSource, hasher);
    const reader = Reader.register({
      id: "11111111-1111-4111-8111-111111111111",
      fullName: "Nguyễn Văn An",
      dateOfBirth: new Date("2000-01-02T00:00:00.000Z"),
      email: "an@example.com",
      identityNumber: "001200000001",
      card: {
        id: "22222222-2222-4222-8222-222222222222",
        cardNumber: "LIB-22222222",
        issuedAt: new Date("2026-07-04T00:00:00.000Z"),
        expiresAt: new Date("2027-07-04T00:00:00.000Z"),
      },
    });

    await unitOfWork.execute(async (transaction) => {
      await transaction.saveReader(reader);
      await transaction.provisionAccount({
        readerId: reader.id,
        username: "reader.an",
        initialPassword: "StrongPass123!",
      });
      await transaction.appendAudit({
        actorId: "33333333-3333-4333-8333-333333333333",
        action: "READER_REGISTERED",
        aggregateId: reader.id,
      });
    });

    expect(transactions).toBe(1);
    expect(writes.map((write) => write.entity)).toEqual(["reader", "card", "account", "audit"]);
    expect(writes.find((write) => write.entity === "account")?.value).toMatchObject({
      passwordHash: "hashed-password",
    });
  });

  it("propagates failures so the DataSource transaction can roll back", async () => {
    let rolledBack = false;
    const dataSource = {
      transaction: async <T>(work: (manager: EntityManager) => Promise<T>) => {
        try {
          return await work({ getRepository: () => ({}) } as unknown as EntityManager);
        } catch (error) {
          rolledBack = true;
          throw error;
        }
      },
    } as DataSource;
    const unitOfWork = new TypeOrmMembershipUnitOfWork(dataSource, { hash: async () => "hash" });

    await expect(
      unitOfWork.execute(async () => {
        throw new Error("account provisioning failed");
      }),
    ).rejects.toThrow("account provisioning failed");
    expect(rolledBack).toBe(true);
  });
});
