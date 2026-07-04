import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";
@Entity("auth_sessions")
@Index("idx_auth_sessions_account_active", ["accountId", "revokedAt"])
export class AuthSessionOrmEntity {
  @PrimaryColumn("uuid") id: string;
  @Column({ name: "account_id", type: "uuid" }) accountId: string;
  @Column({ name: "refresh_token_hash", length: 64 }) refreshTokenHash: string;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt: Date;
  @Column({ name: "rotated_at", type: "timestamptz", nullable: true }) rotatedAt: Date | null;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true }) revokedAt: Date | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
}
