import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";
@Entity("branches")
export class BranchOrmEntity {
  @PrimaryColumn("uuid") id: string;
  @Index("uq_branches_code", { unique: true }) @Column({ length: 50 }) code: string;
  @Column({ length: 200 }) name: string;
  @Column({ type: 'varchar', length: 500, nullable: true }) address: string | null;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt: Date;
}
