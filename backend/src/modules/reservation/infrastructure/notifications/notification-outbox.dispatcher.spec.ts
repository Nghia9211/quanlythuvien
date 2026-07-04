import { DataSource } from "typeorm";
import { NotificationPort } from "../../application/ports/notification.port";
import { NotificationOutboxOrmEntity, OutboxStatus } from "../persistence/typeorm/entities/notification-outbox.orm-entity";
import { NotificationOutboxDispatcher } from "./notification-outbox.dispatcher";

describe("NotificationOutboxDispatcher", () => {
  const message = (): NotificationOutboxOrmEntity => ({
    id: "message-1", reservationId: "reservation-1", readerId: "reader-1", type: "HOLD_READY", payload: { copyId: "copy-1" },
    status: OutboxStatus.PENDING, attempts: 0, nextAttemptAt: new Date(0), lastError: null, sentAt: null, createdAt: new Date(0),
  });
  function sourceFor(row: NotificationOutboxOrmEntity) {
    let query = 0; const saved: NotificationOutboxOrmEntity[] = [];
    const repository = { createQueryBuilder: () => {
      query += 1;
      const builder: any = { where: () => builder, andWhere: () => builder, orderBy: () => builder, take: () => builder, setLock: () => builder, setOnLocked: () => builder,
        getMany: async () => [row], getOne: async () => row };
      return builder;
    }, save: async (value: NotificationOutboxOrmEntity) => { saved.push(value); return value; } };
    const source = { transaction: async (work: any) => work({ getRepository: () => repository }) } as DataSource;
    return { source, saved };
  }
  it("marks a delivered notification as sent", async () => {
    const row = message(), fixture = sourceFor(row), notifications: NotificationPort = { send: async () => undefined };
    await new NotificationOutboxDispatcher(fixture.source, notifications).dispatchPending();
    expect(row.status).toBe(OutboxStatus.SENT); expect(row.sentAt).toBeInstanceOf(Date); expect(fixture.saved).toHaveLength(1);
  });
  it("keeps a failed notification durable and schedules a retry", async () => {
    const row = message(), fixture = sourceFor(row), notifications: NotificationPort = { send: async () => { throw new Error("provider unavailable"); } };
    await new NotificationOutboxDispatcher(fixture.source, notifications).dispatchPending();
    expect(row.status).toBe(OutboxStatus.FAILED); expect(row.attempts).toBe(1); expect(row.lastError).toContain("unavailable"); expect(row.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });
});
