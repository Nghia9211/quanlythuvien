import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";
import { BookCopyStatus } from "../../../../domain/enums/book-copy-status.enum";
import { BookTitleOrmEntity } from "./book-title.orm-entity";

@Entity("book_copies")
@Index("idx_book_copies_branch_status", ["branchId", "status"])
export class BookCopyOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "book_title_id", type: "uuid" })
  bookTitleId: string;

  @Column({ name: "branch_id", type: "uuid" })
  branchId: string;

  @Index("uq_book_copies_barcode", { unique: true })
  @Column({ type: "varchar", length: 100 })
  barcode: string;

  @Index("uq_book_copies_rfid", { unique: true, where: "rfid IS NOT NULL" })
  @Column({ type: "varchar", length: 100, nullable: true })
  rfid: string | null;

  @Column({ name: "shelf_location_id", type: "uuid", nullable: true })
  shelfLocationId: string;

  @Column({
    type: "enum",
    enum: BookCopyStatus,
    enumName: "book_copy_status_enum",
    default: BookCopyStatus.AVAILABLE,
  })
  status: BookCopyStatus;

  @ManyToOne(() => BookTitleOrmEntity, (bookTitle) => bookTitle.copies, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "book_title_id" })
  bookTitle?: BookTitleOrmEntity;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
