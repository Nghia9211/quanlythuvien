import { Column, Entity, Index, PrimaryColumn } from "typeorm";
@Entity("loan_policies") @Index("idx_loan_policies_active", ["isActive", "effectiveFrom"])
export class LoanPolicyOrmEntity {
  @PrimaryColumn("uuid") id: string; @Column({ name: "max_active_items" }) maxActiveItems: number;
  @Column({ name: "loan_days" }) loanDays: number; @Column({ name: "max_renewals" }) maxRenewals: number;
  @Column({ name: "renewal_days" }) renewalDays: number; @Column({ name: "effective_from", type: "timestamptz" }) effectiveFrom: Date;
  @Column({ name: "is_active", default: true }) isActive: boolean;
}
