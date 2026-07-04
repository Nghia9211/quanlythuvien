import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("reservation_policies")
@Index("idx_reservation_policies_active", ["isActive", "effectiveFrom"])
export class ReservationPolicyOrmEntity {
  @PrimaryColumn("uuid") id: string;
  @Column({ name: "max_active_reservations", type: "integer" }) maxActiveReservations: number;
  @Column({ name: "hold_hours", type: "integer" }) holdHours: number;
  @Column({ name: "effective_from", type: "timestamptz" }) effectiveFrom: Date;
  @Column({ name: "is_active", type: "boolean", default: true }) isActive: boolean;
}
