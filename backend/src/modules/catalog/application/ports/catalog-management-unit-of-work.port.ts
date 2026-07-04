import { BookCopy } from "../../domain/entities/book-copy";
import { BookTitle } from "../../domain/entities/book-title";
import { Branch, ShelfLocation } from "../../domain/entities/library-location";
export interface CatalogAuditEvent { actorId: string; action: string; aggregateId: string; details?: Record<string, unknown>; }
export interface CatalogManagementTransaction {
  findTitleById(id: string): Promise<BookTitle | null>; findTitleByIsbn(isbn: string, excludeId?: string): Promise<BookTitle | null>; saveTitle(value: BookTitle): Promise<void>;
  findCopyById(id: string): Promise<BookCopy | null>; findCopyByIdentifier(barcode: string, rfid?: string | null, excludeId?: string): Promise<BookCopy | null>; saveCopy(value: BookCopy): Promise<void>;
  findBranchById(id: string): Promise<Branch | null>; findBranchByCode(code: string): Promise<Branch | null>; saveBranch(value: Branch): Promise<void>;
  findShelfById(id: string): Promise<ShelfLocation | null>; findShelfByCode(branchId: string, code: string): Promise<ShelfLocation | null>; saveShelf(value: ShelfLocation): Promise<void>;
  appendAudit(event: CatalogAuditEvent): Promise<void>;
}
export interface CatalogManagementUnitOfWork { execute<T>(work: (transaction: CatalogManagementTransaction) => Promise<T>): Promise<T>; }
