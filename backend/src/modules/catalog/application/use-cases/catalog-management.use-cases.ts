import { BookCopy } from "../../domain/entities/book-copy";
import { BookTitle } from "../../domain/entities/book-title";
import { Branch, ShelfLocation } from "../../domain/entities/library-location";
import { CatalogConflictError, CatalogNotFoundError, CatalogValidationError } from "../errors/catalog-management.error";
import { CatalogManagementUnitOfWork } from "../ports/catalog-management-unit-of-work.port";
import { CatalogIdentifierGenerator } from "../ports/catalog-system.ports";

const titleView = (x: BookTitle) => ({ id: x.id, title: x.title, isbn: x.isbn, authors: [...x.authors], subjects: [...x.subjects], publisher: x.publisher });
const copyView = (x: BookCopy) => x.toSnapshot();

export class CreateBookTitleUseCase {
  constructor(private uow: CatalogManagementUnitOfWork, private ids: CatalogIdentifierGenerator) {}
  execute(c: any) { return this.uow.execute(async tx => {
    const value = BookTitle.create({ id: this.ids.next(), title: c.title, isbn: c.isbn, authors: c.authors, subjects: c.subjects, publisher: c.publisher });
    if (value.isbn && await tx.findTitleByIsbn(value.isbn)) throw new CatalogConflictError("ISBN already exists");
    await tx.saveTitle(value); await tx.appendAudit({ actorId: c.actorId, action: "BOOK_TITLE_CREATED", aggregateId: value.id }); return titleView(value);
  }); }
}
export class UpdateBookTitleUseCase {
  constructor(private uow: CatalogManagementUnitOfWork) {}
  execute(c: any) { return this.uow.execute(async tx => {
    const found = await tx.findTitleById(c.id); if (!found) throw new CatalogNotFoundError("BookTitle", c.id);
    const value = BookTitle.restore(found.toSnapshot()); value.updateMetadata(c);
    if (value.isbn && await tx.findTitleByIsbn(value.isbn, value.id)) throw new CatalogConflictError("ISBN already exists");
    await tx.saveTitle(value); await tx.appendAudit({ actorId: c.actorId, action: "BOOK_TITLE_UPDATED", aggregateId: value.id }); return titleView(value);
  }); }
}
export class CreateBranchUseCase {
  constructor(private uow: CatalogManagementUnitOfWork, private ids: CatalogIdentifierGenerator) {}
  execute(c: any) { return this.uow.execute(async tx => {
    const value = Branch.create({ id: this.ids.next(), code: c.code, name: c.name, address: c.address });
    if (await tx.findBranchByCode(value.code)) throw new CatalogConflictError("Branch code already exists");
    await tx.saveBranch(value); await tx.appendAudit({ actorId: c.actorId, action: "BRANCH_CREATED", aggregateId: value.id }); return value.toSnapshot();
  }); }
}
export class CreateShelfLocationUseCase {
  constructor(private uow: CatalogManagementUnitOfWork, private ids: CatalogIdentifierGenerator) {}
  execute(c: any) { return this.uow.execute(async tx => {
    if (!await tx.findBranchById(c.branchId)) throw new CatalogNotFoundError("Branch", c.branchId);
    const value = ShelfLocation.create({ id: this.ids.next(), branchId: c.branchId, code: c.code, label: c.label });
    if (await tx.findShelfByCode(value.branchId, value.code)) throw new CatalogConflictError("Shelf code already exists in branch");
    await tx.saveShelf(value); await tx.appendAudit({ actorId: c.actorId, action: "SHELF_CREATED", aggregateId: value.id }); return value.toSnapshot();
  }); }
}
async function validateLocation(tx: any, titleId: string, branchId: string, shelfId: string) {
  if (!await tx.findTitleById(titleId)) throw new CatalogNotFoundError("BookTitle", titleId);
  if (!await tx.findBranchById(branchId)) throw new CatalogNotFoundError("Branch", branchId);
  const shelf = await tx.findShelfById(shelfId); if (!shelf) throw new CatalogNotFoundError("Shelf", shelfId);
  if (shelf.branchId !== branchId) throw new CatalogValidationError("Shelf does not belong to selected branch");
}
export class CreateBookCopyUseCase {
  constructor(private uow: CatalogManagementUnitOfWork, private ids: CatalogIdentifierGenerator) {}
  execute(c: any) { return this.uow.execute(async tx => {
    await validateLocation(tx, c.bookTitleId, c.branchId, c.shelfLocationId);
    const value = BookCopy.create({ id: this.ids.next(), bookTitleId: c.bookTitleId, barcode: c.barcode, rfid: c.rfid, branchId: c.branchId, shelfLocationId: c.shelfLocationId });
    if (await tx.findCopyByIdentifier(value.barcode, value.rfid)) throw new CatalogConflictError("Barcode or RFID already exists");
    await tx.saveCopy(value); await tx.appendAudit({ actorId: c.actorId, action: "BOOK_COPY_CREATED", aggregateId: value.id }); return copyView(value);
  }); }
}
export class UpdateBookCopyUseCase {
  constructor(private uow: CatalogManagementUnitOfWork) {}
  execute(c: any) { return this.uow.execute(async tx => {
    const found = await tx.findCopyById(c.id); if (!found) throw new CatalogNotFoundError("BookCopy", c.id);
    const value = BookCopy.restore(found.toSnapshot());
    const branchId = c.branchId ?? value.branchId, shelfId = c.shelfLocationId ?? value.shelfLocationId;
    await validateLocation(tx, value.bookTitleId, branchId, shelfId); value.updateDetails(c);
    if (await tx.findCopyByIdentifier(value.barcode, value.rfid, value.id)) throw new CatalogConflictError("Barcode or RFID already exists");
    await tx.saveCopy(value); await tx.appendAudit({ actorId: c.actorId, action: "BOOK_COPY_UPDATED", aggregateId: value.id }); return copyView(value);
  }); }
}
