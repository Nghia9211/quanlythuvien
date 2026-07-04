import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DataSource, In, LessThanOrEqual } from "typeorm";
import { NotificationPort, RESERVATION_NOTIFICATION_PORT } from "../../application/ports/notification.port";
import { NotificationOutboxOrmEntity, OutboxStatus } from "../persistence/typeorm/entities/notification-outbox.orm-entity";

@Injectable()
export class NotificationOutboxDispatcher {
  private readonly logger = new Logger(NotificationOutboxDispatcher.name);
  constructor(private source: DataSource, @Inject(RESERVATION_NOTIFICATION_PORT) private notifications: NotificationPort) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchPending() {
    const now = new Date();
    const messages = await this.source.transaction(manager => manager.getRepository(NotificationOutboxOrmEntity).createQueryBuilder("message")
      .where("message.status IN (:...statuses)", { statuses: [OutboxStatus.PENDING, OutboxStatus.FAILED] })
      .andWhere("message.nextAttemptAt <= :now", { now }).orderBy("message.createdAt", "ASC").take(20)
      .setLock("pessimistic_write").setOnLocked("skip_locked").getMany());
    for (const message of messages) await this.dispatchOne(message.id);
    return messages.length;
  }

  private async dispatchOne(id: string) {
    await this.source.transaction(async manager => {
      const repository = manager.getRepository(NotificationOutboxOrmEntity);
      const message = await repository.createQueryBuilder("message").where("message.id = :id", { id }).setLock("pessimistic_write").getOne();
      if (!message || message.status === OutboxStatus.SENT || message.nextAttemptAt > new Date()) return;
      try {
        await this.notifications.send({ id: message.id, reservationId: message.reservationId, readerId: message.readerId, type: message.type, payload: message.payload });
        message.status = OutboxStatus.SENT; message.sentAt = new Date(); message.lastError = null;
      } catch (error) {
        message.attempts += 1; message.status = OutboxStatus.FAILED; message.lastError = (error as Error).message.slice(0, 1000);
        const delayMinutes = Math.min(60, 2 ** Math.min(message.attempts, 6));
        message.nextAttemptAt = new Date(Date.now() + delayMinutes * 60_000);
        this.logger.warn(`Notification ${message.id} failed; retry ${message.attempts} scheduled`);
      }
      await repository.save(message);
    });
  }
}
