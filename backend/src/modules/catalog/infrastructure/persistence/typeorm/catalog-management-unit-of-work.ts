import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, Not } from "typeorm";
import { CatalogConflictError } from "../../../application/errors/catalog-management.error";
import { CatalogAuditEvent, CatalogManagementTransaction, CatalogManagementUnitOfWork } from "../../../application/ports/catalog-management-unit-of-work.port";
import { BookCopy } from "../../../domain/entities/book-copy";
import { BookTitle } from "../../../domain/entities/book-title";
import { Branch, ShelfLocation } from "../../../domain/entities/library-location";
import { BookCopyOrmEntity } from "./entities/book-copy.orm-entity";
import { BookTitleOrmEntity } from "./entities/book-title.orm-entity";
import { BranchOrmEntity } from "./entities/branch.orm-entity";
import { ShelfLocationOrmEntity } from "./entities/shelf-location.orm-entity";

@Injectable()
export class CatalogManagementTypeOrmUnitOfWork implements CatalogManagementUnitOfWork {
  constructor(private dataSource: DataSource) {}
  async execute<T>(work: (transaction: CatalogManagementTransaction) => Promise<T>): Promise<T> {
    try {
      return await this.dataSource.transaction(manager => work(new CatalogTransaction(manager)));
    } catch (error) {
      const db = error as { code?: string; driverError?: { code?: string } };
      if ((db.code ?? db.driverError?.code) === "23505") throw new CatalogConflictError("Catalog identifier already exists");
      throw error;
    }
  }
}

class CatalogTransaction implements CatalogManagementTransaction {
  constructor(private manager: EntityManager) {}
  async findTitleById(id: string) {
    const x = await this.manager.getRepository(BookTitleOrmEntity).findOne({ where: { id }, relations: { copies: true } });
    return x ? this.mapTitle(x) : null;
  }
  async findTitleByIsbn(isbn: string, excludeId?: string) {
    const x = await this.manager.getRepository(BookTitleOrmEntity).findOne({ where: { isbn, ...(excludeId ? { id: Not(excludeId) } : {}) }, relations: { copies: true } });
    return x ? this.mapTitle(x) : null;
  }
  async saveTitle(value: BookTitle) {
    const x = value.toSnapshot();
    await this.manager.getRepository(BookTitleOrmEntity).save({ id: x.id, title: x.title, isbn: x.isbn, authors: x.authors, subjects: x.subjects, publisher: x.publisher });
  }
  async findCopyById(id: string) {
    const x = await this.manager.getRepository(BookCopyOrmEntity).findOne({ where: { id } }); return x ? this.mapCopy(x) : null;
  }
  async findCopyByIdentifier(barcode: string, rfid?: string | null, excludeId?: string) {
    const excluded = excludeId ? { id: Not(excludeId) } : {};
    const where: any[] = [{ ...excluded, barcode }]; if (rfid) where.push({ ...excluded, rfid });
    const x = await this.manager.getRepository(BookCopyOrmEntity).findOne({ where }); return x ? this.mapCopy(x) : null;
  }
  async saveCopy(value: BookCopy) {
    const x = value.toSnapshot(); await this.manager.getRepository(BookCopyOrmEntity).save(x);
  }
  async findBranchById(id: string) { const x = await this.manager.getRepository(BranchOrmEntity).findOne({ where: { id } }); return x ? Branch.restore(x) : null; }
  async findBranchByCode(code: string) { const x = await this.manager.getRepository(BranchOrmEntity).findOne({ where: { code } }); return x ? Branch.restore(x) : null; }
  async saveBranch(value: Branch) { await this.manager.getRepository(BranchOrmEntity).save(value.toSnapshot()); }
  async findShelfById(id: string) { const x = await this.manager.getRepository(ShelfLocationOrmEntity).findOne({ where: { id } }); return x ? ShelfLocation.restore(x) : null; }
  async findShelfByCode(branchId: string, code: string) { const x = await this.manager.getRepository(ShelfLocationOrmEntity).findOne({ where: { branchId, code } }); return x ? ShelfLocation.restore(x) : null; }
  async saveShelf(value: ShelfLocation) { await this.manager.getRepository(ShelfLocationOrmEntity).save(value.toSnapshot()); }
  async appendAudit(event: CatalogAuditEvent) {
    await this.manager.query(
      `INSERT INTO audit_logs
        (actor_id, action, aggregate_type, aggregate_id, reason, details)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [event.actorId, event.action, "Catalog", event.aggregateId, null, JSON.stringify(event.details ?? {})],
    );
  }
  private mapTitle(x: BookTitleOrmEntity) { return BookTitle.restore({ id: x.id, title: x.title, isbn: x.isbn, authors: x.authors ?? [], subjects: x.subjects ?? [], publisher: x.publisher, copies: (x.copies ?? []).map(c => ({ id: c.id, branchId: c.branchId, status: c.status })) }); }
  private mapCopy(x: BookCopyOrmEntity) {
    if (!x.shelfLocationId) throw new Error(`Book copy ${x.id} has no shelf location`);
    return BookCopy.restore({ id: x.id, bookTitleId: x.bookTitleId, barcode: x.barcode, rfid: x.rfid, branchId: x.branchId, shelfLocationId: x.shelfLocationId, status: x.status });
  }
}
