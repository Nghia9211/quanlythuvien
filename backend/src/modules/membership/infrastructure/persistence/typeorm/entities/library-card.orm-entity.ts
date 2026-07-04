import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { CardStatus } from "../../../../domain/enums/card-status.enum";
import { ReaderOrmEntity } from "./reader.orm-entity";

@Entity("library_cards")
export class LibraryCardOrmEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Index("uq_library_cards_reader", { unique: true })
  @Column({ name: "reader_id", type: "uuid" })
  readerId: string;

  @Index("uq_library_cards_number", { unique: true })
  @Column({ name: "card_number", type: "varchar", length: 50 })
  cardNumber: string;

  @Column({
    type: "enum",
    enum: CardStatus,
    enumName: "library_card_status_enum",
    default: CardStatus.ACTIVE,
  })
  status: CardStatus;

  @Column({ name: "issued_at", type: "timestamptz" })
  issuedAt: Date;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt: Date;

  @Column({ name: "lock_reason", type: "varchar", length: 500, nullable: true })
  lockReason: string | null;

  @OneToOne(() => ReaderOrmEntity, (reader) => reader.card, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "reader_id" })
  reader?: ReaderOrmEntity;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
