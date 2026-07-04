import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, VersionColumn } from "typeorm";
import { LoanItemStatus } from "../../../../domain/enums/loan-status.enum";
import { ReturnCondition } from "../../../../domain/enums/return-condition.enum";
import { LoanOrmEntity } from "./loan.orm-entity";
@Entity("loan_items") @Index("idx_loan_items_copy_status", ["copyId", "status"])
export class LoanItemOrmEntity {
  @PrimaryColumn("uuid") id: string; @Column({ name: "loan_id", type: "uuid" }) loanId: string;
  @Column({ name: "copy_id", type: "uuid" }) copyId: string; @Column({ name: "book_title_id", type: "uuid" }) bookTitleId: string;
  @Column({ name: "due_at", type: "timestamptz" }) dueAt: Date;
  @Column({ type: "enum", enum: LoanItemStatus, enumName: "loan_item_status_enum" }) status: LoanItemStatus;
  @Column({ name: "returned_at", type: "timestamptz", nullable: true }) returnedAt: Date | null;
  @Column({ name: "return_condition", type: "enum", enum: ReturnCondition, enumName: "return_condition_enum", nullable: true }) returnCondition: ReturnCondition | null;
  @Column({ name: "overdue_days", default: 0 }) overdueDays: number; @Column({ name: "renewal_count", default: 0 }) renewalCount: number;
  @ManyToOne(() => LoanOrmEntity, loan => loan.items, { onDelete: "RESTRICT" }) @JoinColumn({ name: "loan_id" }) loan: LoanOrmEntity;
  @VersionColumn() version: number;
}
