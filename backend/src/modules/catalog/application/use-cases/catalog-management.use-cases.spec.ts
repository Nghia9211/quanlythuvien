import { BookCopy } from "../../domain/entities/book-copy";
import { BookTitle } from "../../domain/entities/book-title";
import { Branch, ShelfLocation } from "../../domain/entities/library-location";
import {
  CatalogAuditEvent,
  CatalogManagementTransaction,
  CatalogManagementUnitOfWork,
} from "../ports/catalog-management-unit-of-work.port";
import { CatalogIdentifierGenerator } from "../ports/catalog-system.ports";
import {
  CreateBookCopyUseCase,
  CreateBookTitleUseCase,
  CreateBranchUseCase,
  CreateShelfLocationUseCase,
  UpdateBookCopyUseCase,
  UpdateBookTitleUseCase,
} from "./catalog-management.use-cases";
import { CatalogConflictError, CatalogNotFoundError } from "../errors/catalog-management.error";

class SequenceIds implements CatalogIdentifierGenerator {
  private index = 0;
  constructor(private ids: string[]) {}
  next(): string { return this.ids[this.index++]; }
}

class MemoryCatalog implements CatalogManagementUnitOfWork, CatalogManagementTransaction {
  titles = new Map<string, BookTitle>();
  copies = new Map<string, BookCopy>();
  branches = new Map<string, Branch>();
  shelves = new Map<string, ShelfLocation>();
  audits: CatalogAuditEvent[] = [];
  execute<T>(work: (transaction: CatalogManagementTransaction) => Promise<T>): Promise<T> { return work(this); }
  findTitleById(id: string) { return Promise.resolve(this.titles.get(id) ?? null); }
  findTitleByIsbn(isbn: string, excludeId?: string) {
    return Promise.resolve([...this.titles.values()].find((x) => x.isbn === isbn && x.id !== excludeId) ?? null);
  }
  saveTitle(value: BookTitle) { this.titles.set(value.id, value); return Promise.resolve(); }
  findCopyById(id: string) { return Promise.resolve(this.copies.get(id) ?? null); }
  findCopyByIdentifier(barcode: string, rfid?: string | null, excludeId?: string) {
    return Promise.resolve([...this.copies.values()].find((x) => x.id !== excludeId &&
      (x.barcode === barcode || (!!rfid && x.rfid === rfid))) ?? null);
  }
  saveCopy(value: BookCopy) { this.copies.set(value.id, value); return Promise.resolve(); }
  findBranchById(id: string) { return Promise.resolve(this.branches.get(id) ?? null); }
  findBranchByCode(code: string) { return Promise.resolve([...this.branches.values()].find((x) => x.code === code) ?? null); }
  saveBranch(value: Branch) { this.branches.set(value.id, value); return Promise.resolve(); }
  findShelfById(id: string) { return Promise.resolve(this.shelves.get(id) ?? null); }
  findShelfByCode(branchId: string, code: string) {
    return Promise.resolve([...this.shelves.values()].find((x) => x.branchId === branchId && x.code === code) ?? null);
  }
  saveShelf(value: ShelfLocation) { this.shelves.set(value.id, value); return Promise.resolve(); }
  appendAudit(event: CatalogAuditEvent) { this.audits.push(event); return Promise.resolve(); }
}

describe("Catalog management use cases", () => {
  it("creates and updates a title with duplicate ISBN protection", async () => {
    const store = new MemoryCatalog();
    const create = new CreateBookTitleUseCase(store, new SequenceIds(["title-1", "title-2"]));
    const update = new UpdateBookTitleUseCase(store);
    const first = await create.execute({
      actorId: "staff-1", title: "Clean Architecture", isbn: "9780134494166",
      authors: ["Robert C. Martin"], subjects: ["Software"], publisher: "Pearson",
    });
    await expect(create.execute({ ...first, actorId: "staff-1", title: "Duplicate" })).rejects.toBeInstanceOf(
      CatalogConflictError,
    );
    const changed = await update.execute({ id: first.id, actorId: "staff-1", title: "Clean Architecture 2" });
    expect(changed.title).toBe("Clean Architecture 2");
    expect(store.audits.map((x) => x.action)).toEqual(["BOOK_TITLE_CREATED", "BOOK_TITLE_UPDATED"]);
  });

  it("configures a branch and shelf then creates and relocates a copy", async () => {
    const store = new MemoryCatalog();
    const ids = new SequenceIds(["branch-1", "shelf-1", "title-1", "copy-1", "branch-2", "shelf-2"]);
    const createBranch = new CreateBranchUseCase(store, ids);
    const createShelf = new CreateShelfLocationUseCase(store, ids);
    const createTitle = new CreateBookTitleUseCase(store, ids);
    const createCopy = new CreateBookCopyUseCase(store, ids);
    const updateCopy = new UpdateBookCopyUseCase(store);
    const branch = await createBranch.execute({ actorId: "staff-1", code: "HN01", name: "Trung tâm", address: "HN" });
    const shelf = await createShelf.execute({ actorId: "staff-1", branchId: branch.id, code: "A-01", label: "Kệ A" });
    const title = await createTitle.execute({ actorId: "staff-1", title: "DDD", isbn: null, authors: ["Evans"], subjects: [], publisher: null });
    const copy = await createCopy.execute({
      actorId: "staff-1", bookTitleId: title.id, barcode: "BC-001", rfid: "RF-001",
      branchId: branch.id, shelfLocationId: shelf.id,
    });
    expect(copy.barcode).toBe("BC-001");

    const branch2 = await createBranch.execute({ actorId: "staff-1", code: "HN02", name: "Phía Tây", address: "HN" });
    const shelf2 = await createShelf.execute({ actorId: "staff-1", branchId: branch2.id, code: "B-01", label: "Kệ B" });
    const moved = await updateCopy.execute({ id: copy.id, actorId: "staff-1", branchId: branch2.id, shelfLocationId: shelf2.id });
    expect(moved.branchId).toBe(branch2.id);
  });

  it("rejects missing titles and shelves from another branch", async () => {
    const store = new MemoryCatalog();
    const ids = new SequenceIds(["branch-1", "branch-2", "shelf-1", "copy-1"]);
    const branches = new CreateBranchUseCase(store, ids);
    const shelves = new CreateShelfLocationUseCase(store, ids);
    const copy = new CreateBookCopyUseCase(store, ids);
    const b1 = await branches.execute({ actorId: "staff", code: "B1", name: "One", address: null });
    const b2 = await branches.execute({ actorId: "staff", code: "B2", name: "Two", address: null });
    const shelf = await shelves.execute({ actorId: "staff", branchId: b1.id, code: "S1", label: "Shelf" });
    await expect(copy.execute({
      actorId: "staff", bookTitleId: "missing", barcode: "BC", rfid: null,
      branchId: b2.id, shelfLocationId: shelf.id,
    })).rejects.toBeInstanceOf(CatalogNotFoundError);
  });
});
