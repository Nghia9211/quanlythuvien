import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
@Entity("user_accounts")
export class UserAccountOrmEntity {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Index("uq_user_accounts_reader", { unique: true, where: "reader_id IS NOT NULL" })
  @Column({ name: "reader_id", type: "uuid", nullable: true }) readerId: string | null;
  @Index("uq_user_accounts_username", { unique: true }) @Column({ length: 100 }) username: string;
  @Column({ name: "password_hash", length: 100 }) passwordHash: string;
  @Column({ length: 30, default: "reader" }) role: string;
  @Column({ name: "is_active", default: true }) isActive: boolean;
  @Column({ name: "failed_login_attempts", default: 0 }) failedLoginAttempts: number;
  @Column({ name: "locked_until", type: "timestamptz", nullable: true }) lockedUntil: Date | null;
  @Column({ name: "last_login_at", type: "timestamptz", nullable: true }) lastLoginAt: Date | null;
  @Column({ name: "password_changed_at", type: "timestamptz", nullable: true }) passwordChangedAt: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt: Date;
}
