import { BookCopyStatus } from "../enums/book-copy-status.enum";
import { CatalogDomainError } from "../errors/catalog-domain.error";

export interface BookCopySnapshot {
  id: string;
  bookTitleId: string;
  barcode: string;
  rfid: string | null;
  branchId: string;
  shelfLocationId: string;
  status: BookCopyStatus;
}

export type CreateBookCopyInput = Omit<BookCopySnapshot, "status">;
export type UpdateBookCopyInput = Partial<Pick<BookCopySnapshot, "barcode" | "rfid" | "branchId" | "shelfLocationId">>;

export class BookCopy {
  private constructor(private state: BookCopySnapshot) {}
  static create(input: CreateBookCopyInput): BookCopy {
    return new BookCopy(BookCopy.normalize({ ...input, status: BookCopyStatus.AVAILABLE }));
  }
  static restore(snapshot: BookCopySnapshot): BookCopy { return new BookCopy(BookCopy.normalize(snapshot)); }
  get id() { return this.state.id; }
  get bookTitleId() { return this.state.bookTitleId; }
  get barcode() { return this.state.barcode; }
  get rfid() { return this.state.rfid; }
  get branchId() { return this.state.branchId; }
  get shelfLocationId() { return this.state.shelfLocationId; }
  get status() { return this.state.status; }
  updateDetails(input: UpdateBookCopyInput): void {
    const moving = (input.branchId && input.branchId !== this.state.branchId) ||
      (input.shelfLocationId && input.shelfLocationId !== this.state.shelfLocationId);
    if (moving && this.state.status !== BookCopyStatus.AVAILABLE) {
      throw new CatalogDomainError("Only an available copy can change branch or shelf");
    }
    this.state = BookCopy.normalize({ ...this.state, ...input, rfid: input.rfid === undefined ? this.state.rfid : input.rfid });
  }
  toSnapshot(): BookCopySnapshot { return { ...this.state }; }
  private static normalize(value: BookCopySnapshot): BookCopySnapshot {
    const barcode = value.barcode.trim().toUpperCase();
    if (!barcode) throw new CatalogDomainError("Barcode must not be empty");
    if (!value.bookTitleId || !value.branchId || !value.shelfLocationId) {
      throw new CatalogDomainError("Book title, branch and shelf are required");
    }
    return { ...value, barcode, rfid: value.rfid?.trim().toUpperCase() || null };
  }
}
