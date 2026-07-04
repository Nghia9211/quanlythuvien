import { BookCopyStatus } from "../enums/book-copy-status.enum";
import { CatalogDomainError } from "../errors/catalog-domain.error";

export interface BookCopySnapshot {
  id: string;
  branchId: string;
  status: BookCopyStatus;
}

export interface BookTitleSnapshot {
  id: string;
  title: string;
  isbn: string | null;
  authors: string[];
  subjects: string[];
  publisher: string | null;
  copies: BookCopySnapshot[];
}

export interface CreateBookTitleInput {
  id: string;
  title: string;
  isbn: string | null;
  authors: string[];
  subjects: string[];
  publisher: string | null;
}

export interface UpdateBookTitleInput {
  title?: string;
  isbn?: string | null;
  authors?: string[];
  subjects?: string[];
  publisher?: string | null;
}

export interface BranchAvailability {
  branchId: string;
  availableCopies: number;
}

export class BookTitle {
  private constructor(private state: BookTitleSnapshot) {}

  static create(input: CreateBookTitleInput): BookTitle {
    return new BookTitle(BookTitle.normalize({ ...input, copies: [] }));
  }

  static restore(snapshot: BookTitleSnapshot): BookTitle {
    return new BookTitle(BookTitle.normalize(snapshot));
  }

  get id(): string {
    return this.state.id;
  }

  get title(): string {
    return this.state.title;
  }

  get isbn(): string | null {
    return this.state.isbn;
  }

  get authors(): readonly string[] {
    return this.state.authors;
  }

  get subjects(): readonly string[] {
    return this.state.subjects;
  }

  get publisher(): string | null {
    return this.state.publisher;
  }

  updateMetadata(input: UpdateBookTitleInput): void {
    this.state = BookTitle.normalize({
      ...this.state,
      title: input.title ?? this.state.title,
      isbn: input.isbn === undefined ? this.state.isbn : input.isbn,
      authors: input.authors ?? this.state.authors,
      subjects: input.subjects ?? this.state.subjects,
      publisher: input.publisher === undefined ? this.state.publisher : input.publisher,
    });
  }

  toSnapshot(): BookTitleSnapshot {
    return { ...this.state, authors: [...this.state.authors], subjects: [...this.state.subjects], copies: this.state.copies.map((x) => ({ ...x })) };
  }

  availability(): BranchAvailability[] {
    const counts = new Map<string, number>();

    for (const copy of this.state.copies) {
      if (copy.status === BookCopyStatus.AVAILABLE) {
        counts.set(copy.branchId, (counts.get(copy.branchId) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .map(([branchId, availableCopies]) => ({ branchId, availableCopies }))
      .sort((left, right) => left.branchId.localeCompare(right.branchId));
  }

  private static normalize(snapshot: BookTitleSnapshot): BookTitleSnapshot {
    const title = snapshot.title.trim().replace(/\s+/g, " ");
    if (!title) throw new CatalogDomainError("Book title must not be empty");
    const authors = snapshot.authors.map((x) => x.trim()).filter(Boolean);
    if (authors.length === 0) throw new CatalogDomainError("At least one author is required");
    const isbn = snapshot.isbn?.replace(/[\s-]/g, "").toUpperCase() || null;
    if (isbn && !BookTitle.isValidIsbn(isbn)) throw new CatalogDomainError("ISBN checksum is invalid");
    return {
      ...snapshot,
      title,
      isbn,
      authors,
      subjects: snapshot.subjects.map((x) => x.trim()).filter(Boolean),
      publisher: snapshot.publisher?.trim() || null,
      copies: snapshot.copies.map((x) => ({ ...x })),
    };
  }

  private static isValidIsbn(isbn: string): boolean {
    if (/^\d{13}$/.test(isbn)) {
      const total = [...isbn].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
      return total % 10 === 0;
    }
    if (/^\d{9}[\dX]$/.test(isbn)) {
      const total = [...isbn].reduce((sum, digit, index) => sum + (digit === "X" ? 10 : Number(digit)) * (10 - index), 0);
      return total % 11 === 0;
    }
    return false;
  }
}
