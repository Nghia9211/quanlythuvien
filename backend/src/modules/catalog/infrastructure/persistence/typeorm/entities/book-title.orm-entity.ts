import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from "typeorm";
import { BookCopyOrmEntity } from "./book-copy.orm-entity";

@Entity("book_titles")
export class BookTitleOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index("idx_book_titles_title")
  @Column({ type: "varchar", length: 500 })
  title: string;

  @Index("uq_book_titles_isbn", { unique: true, where: "isbn IS NOT NULL" })
  @Column({ type: "varchar", length: 20, nullable: true })
  isbn: string | null;

  @Column({ type: "simple-array", default: "" })
  authors: string[];

  @Column({ type: "simple-array", default: "" })
  subjects: string[];

  @Column({ type: "varchar", length: 255, nullable: true })
  publisher: string | null;

  @OneToMany(() => BookCopyOrmEntity, (copy) => copy.bookTitle)
  copies: BookCopyOrmEntity[];

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
