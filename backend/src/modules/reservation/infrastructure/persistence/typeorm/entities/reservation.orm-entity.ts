import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn, VersionColumn } from "typeorm";
import { ReservationStatus } from "../../../../domain/reservation";

@Entity("reservations")
@Index("idx_reservations_queue", ["bookTitleId", "branchId", "status", "createdAt"])
@Index("idx_reservations_reader_status", ["readerId", "status"])
export class ReservationOrmEntity {
  @PrimaryColumn("uuid") id: string;
  @Column({ name: "reader_id", type: "uuid" }) readerId: string;
  @Column({ name: "book_title_id", type: "uuid" }) bookTitleId: string;
  @Column({ name: "branch_id", type: "uuid" }) branchId: string;
  @Column({ type: "enum", enum: ReservationStatus, enumName: "reservation_status_enum", default: ReservationStatus.WAITING }) status: ReservationStatus;
  @Column({ name: "copy_id", type: "uuid", nullable: true }) copyId: string | null;
  @Column({ name: "hold_expires_at", type: "timestamptz", nullable: true }) holdExpiresAt: Date | null;
  @Column({ name: "cancel_reason", type: "varchar", length: 500, nullable: true }) cancelReason: string | null;
  @VersionColumn() version: number;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt: Date;
}
