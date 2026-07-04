import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BookTitle } from "../../../../domain/entities/book-title";
import {
  BookTitleRepository,
  CatalogSearchCriteria,
  CatalogSearchPage,
} from "../../../../domain/repositories/book-title.repository";
import { BookTitleOrmEntity } from "../entities/book-title.orm-entity";

@Injectable()
export class TypeOrmBookTitleRepository implements BookTitleRepository {
  constructor(
    @InjectRepository(BookTitleOrmEntity)
    private readonly repository: Repository<BookTitleOrmEntity>,
  ) {}

  async search(criteria: CatalogSearchCriteria): Promise<CatalogSearchPage> {
    const term = `%${this.escapeLikePattern(criteria.query)}%`;
    const query = this.repository
      .createQueryBuilder("bookTitle")
      .leftJoinAndSelect("bookTitle.copies", "copy")
      .where(
        `(
          unaccent(LOWER(bookTitle.title)) LIKE unaccent(:term) ESCAPE '\\'
          OR unaccent(LOWER(COALESCE(bookTitle.isbn, ''))) LIKE unaccent(:term) ESCAPE '\\'
          OR unaccent(LOWER(COALESCE(bookTitle.authors, ''))) LIKE unaccent(:term) ESCAPE '\\'
          OR unaccent(LOWER(COALESCE(bookTitle.subjects, ''))) LIKE unaccent(:term) ESCAPE '\\'
        )`,
        { term },
      )
      .orderBy("bookTitle.title", "ASC")
      .skip((criteria.page - 1) * criteria.limit)
      .take(criteria.limit)
      .distinct(true);

    if (criteria.branchId) {
      query.andWhere("copy.branchId = :branchId", { branchId: criteria.branchId });
    }

    const [records, total] = await query.getManyAndCount();
    return {
      total,
      items: records.map((record) =>
        BookTitle.restore({
          id: record.id,
          title: record.title,
          isbn: record.isbn,
          authors: record.authors ?? [],
          subjects: record.subjects ?? [],
          publisher: record.publisher,
          copies: (record.copies ?? []).map((copy) => ({
            id: copy.id,
            branchId: copy.branchId,
            status: copy.status,
          })),
        }),
      ),
    };
  }

  private escapeLikePattern(value: string): string {
    return value.replace(/[\\%_]/g, "\\$&");
  }
}
