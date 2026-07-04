import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from "typeorm";
@Entity("shelf_locations")
@Index("uq_shelf_locations_branch_code", ["branchId", "code"], { unique: true })
export class ShelfLocationOrmEntity {
  @PrimaryColumn("uuid") id: string;
  @Column({ name: "branch_id", type: "uuid" }) branchId: string;
  @Column({ length: 50 }) code: string;
  @Column({ length: 200 }) label: string;
  @CreateDateColumn({ name: "created_at", type: "timestamptz" }) createdAt: Date;
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" }) updatedAt: Date;
}
