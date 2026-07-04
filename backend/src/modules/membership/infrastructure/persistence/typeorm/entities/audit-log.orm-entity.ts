import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("audit_logs")
@Index("idx_audit_logs_aggregate", ["aggregateType", "aggregateId"])
export class AuditLogOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_audit_logs_actor")
  @Column({ name: "actor_id", type: "uuid" })
  actorId: string;

  @Column({ type: "varchar", length: 100 })
  action: string;

  @Column({ name: "aggregate_type", type: "varchar", length: 100 })
  aggregateType: string;

  @Column({ name: "aggregate_id", type: "uuid" })
  aggregateId: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  reason: string | null;

  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  details: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
