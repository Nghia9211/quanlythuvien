import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";
import { ReaderStatus } from "../../../../domain/enums/reader-status.enum";
import { LibraryCardOrmEntity } from "./library-card.orm-entity";

@Entity("readers")
export class ReaderOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "full_name", type: "varchar", length: 200 })
  fullName: string;

  @Column({ name: "date_of_birth", type: "date" })
  dateOfBirth: string;

  @Index("uq_readers_email", { unique: true })
  @Column({ type: "varchar", length: 320 })
  email: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  phone: string | null;

  @Index("uq_readers_identity_number", { unique: true })
  @Column({ name: "identity_number", type: "varchar", length: 20 })
  identityNumber: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  address: string | null;

  @Column({
    type: "enum",
    enum: ReaderStatus,
    enumName: "reader_status_enum",
    default: ReaderStatus.ACTIVE,
  })
  status: ReaderStatus;

  @OneToOne(() => LibraryCardOrmEntity, (card) => card.reader)
  card: LibraryCardOrmEntity;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
