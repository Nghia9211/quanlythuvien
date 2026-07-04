import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

export enum OutboxStatus { PENDING = "PENDING", SENT = "SENT", FAILED = "FAILED" }

@Entity("notification_outbox")
@Index("idx_notification_outbox_dispatch", ["status", "nextAttemptAt", "createdAt"])
export class NotificationOutboxOrmEntity {
  @PrimaryColumn("uuid") id: string;
  @Column({ name: "reservation_id", type: "uuid" }) reservationId: string;
  @Column({ name: "reader_id", type: "uuid" }) readerId: string;
  @Column({ type: "varchar", length: 100 }) type: string;
  @Column({ type: "jsonb" }) payload: Record<string, unknown>;
  @Column({ type: "enum", enum: OutboxStatus, enumName: "notification_outbox_status_enum", default: OutboxStatus.PENDING }) status: OutboxStatus;
  @Column({ type: "integer", default: 0 }) attempts: number;
  @Column({ name: "next_attempt_at", type: "timestamptz", default: () => "now()" }) nextAttemptAt: Date;
  @Column({ name: "last_error", type: "varchar", length: 1000, nullable: true }) lastError: string | null;
  @Column({ name: "sent_at", type: "timestamptz", nullable: true }) sentAt: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
}
