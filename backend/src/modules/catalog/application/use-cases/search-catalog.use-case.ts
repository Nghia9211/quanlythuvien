import { BookTitleRepository } from "../../domain/repositories/book-title.repository";

export interface SearchCatalogQuery {
  query: string;
  branchId?: string;
  page?: number;
  limit?: number;
}

export interface CatalogSearchItem {
  id: string;
  title: string;
  isbn: string | null;
  authors: readonly string[];
  subjects: readonly string[];
  publisher: string | null;
  availability: Array<{ branchId: string; availableCopies: number }>;
}

export interface SearchCatalogResult {
  items: CatalogSearchItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class InvalidCatalogSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCatalogSearchError";
  }
}

export class SearchCatalogUseCase {
  constructor(private readonly bookTitles: BookTitleRepository) {}

  async execute(input: SearchCatalogQuery): Promise<SearchCatalogResult> {
    const query = input.query.trim().toLocaleLowerCase("vi-VN");
    const page = input.page ?? 1;
    const limit = input.limit ?? 20;

    if (!query) {
      throw new InvalidCatalogSearchError("Search query must not be empty");
    }
    if (!Number.isInteger(page) || page < 1) {
      throw new InvalidCatalogSearchError("Page must be at least 1");
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new InvalidCatalogSearchError("Limit must be between 1 and 100");
    }

    const result = await this.bookTitles.search({
      query,
      branchId: input.branchId,
      page,
      limit,
    });

    return {
      items: result.items.map((book) => ({
        id: book.id,
        title: book.title,
        isbn: book.isbn,
        authors: book.authors,
        subjects: book.subjects,
        publisher: book.publisher,
        availability: book.availability(),
      })),
      page,
      limit,
      total: result.total,
      totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
    };
  }
}
