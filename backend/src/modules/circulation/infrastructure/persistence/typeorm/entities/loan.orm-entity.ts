import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryColumn, UpdateDateColumn, VersionColumn } from "typeorm";
import { LoanStatus } from "../../../../domain/enums/loan-status.enum";
import { LoanItemOrmEntity } from "./loan-item.orm-entity";
@Entity("loans") @Index("idx_loans_reader_status", ["readerId", "status"])
export class LoanOrmEntity {
  @PrimaryColumn("uuid") id: string; @Column({ name: "reader_id", type: "uuid" }) readerId: string;
  @Column({ name: "card_id", type: "uuid" }) cardId: string; @Column({ name: "branch_id", type: "uuid" }) branchId: string;
  @Column({ name: "staff_id", type: "uuid" }) staffId: string; @Column({ name: "borrowed_at", type: "timestamptz" }) borrowedAt: Date;
  @Column({ type: "enum", enum: LoanStatus, enumName: "loan_status_enum", default: LoanStatus.OPEN }) status: LoanStatus;
  @OneToMany(() => LoanItemOrmEntity, item => item.loan) items: LoanItemOrmEntity[];
  @VersionColumn() version: number; @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt: Date;
}
