import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { BookCopyOrmEntity } from "@modules/catalog/infrastructure/persistence/typeorm/entities/book-copy.orm-entity";
import { LibraryCardOrmEntity } from "@modules/membership/infrastructure/persistence/typeorm/entities/library-card.orm-entity";
import { Loan } from "../../../domain/entities/loan";
import { LoanItemStatus } from "../../../domain/enums/loan-status.enum";
import { CirculationAuditEvent, CirculationCopy, CirculationTransaction, CirculationUnitOfWork } from "../../../application/ports/circulation-unit-of-work.port";
import { LoanItemOrmEntity } from "./entities/loan-item.orm-entity";
import { LoanOrmEntity } from "./entities/loan.orm-entity";
import { LoanPolicyOrmEntity } from "./entities/loan-policy.orm-entity";
@Injectable() export class TypeOrmCirculationUnitOfWork implements CirculationUnitOfWork {
  constructor(private source: DataSource) {} execute<T>(work: (tx: CirculationTransaction) => Promise<T>) { return this.source.transaction(manager => work(new Tx(manager))); }
}
class Tx implements CirculationTransaction {
  constructor(private m: EntityManager) {}
  async findReaderByCard(cardNumber: string) {
    const card = await this.m.getRepository(LibraryCardOrmEntity).createQueryBuilder("card").innerJoinAndSelect("card.reader", "reader").where("card.cardNumber = :cardNumber", { cardNumber }).setLock("pessimistic_write").getOne();
    return card?.reader ? { readerId: card.reader.id, cardId: card.id, cardNumber: card.cardNumber, readerStatus: card.reader.status, cardStatus: card.status, cardExpiresAt: card.expiresAt } : null;
  }
  countActiveItems(readerId: string) { return this.m.getRepository(LoanItemOrmEntity).createQueryBuilder("item").innerJoin("item.loan", "loan", "loan.readerId = :readerId", { readerId }).where("item.status = :status", { status: LoanItemStatus.ON_LOAN }).getCount(); }
  async findCopiesByBarcodes(values: string[]) { const rows = await this.m.getRepository(BookCopyOrmEntity).createQueryBuilder("copy").where("copy.barcode IN (:...values)", { values }).setLock("pessimistic_write").getMany(); return rows.map(this.copy); }
  async saveCopies(values: CirculationCopy[]) { await this.m.getRepository(BookCopyOrmEntity).save(values.map(x => ({ id: x.id, status: x.status as any }))); }
  async findOpenItemsByBarcodes(values: string[]) {
    const copies = await this.findCopiesByBarcodes(values), byId = new Map(copies.map(x => [x.id, x]));
    const items = await this.m.getRepository(LoanItemOrmEntity).find({ where: { copyId: In(copies.map(x => x.id)), status: LoanItemStatus.ON_LOAN }, relations: { loan: { items: true } } });
    return items.map(item => ({ loan: this.loan(item.loan), item: this.loan(item.loan).items.find(x => x.id === item.id)!, copy: byId.get(item.copyId)! }));
  }
  async findLoanById(id: string) { const row = await this.m.getRepository(LoanOrmEntity).createQueryBuilder("loan").innerJoinAndSelect("loan.items", "item").where("loan.id = :id", { id }).setLock("pessimistic_write").getOne(); return row ? this.loan(row) : null; }
  async saveLoan(value: Loan) { const x = value.toSnapshot(); await this.m.getRepository(LoanOrmEntity).save({ id: x.id, readerId: x.readerId, cardId: x.cardId, branchId: x.branchId, staffId: x.staffId, borrowedAt: x.borrowedAt, status: x.status }); await this.m.getRepository(LoanItemOrmEntity).save(x.items.map(i => ({ ...i, loanId: x.id }))); }
  async findLoansByReader(readerId: string) { const rows = await this.m.getRepository(LoanOrmEntity).find({ where: { readerId }, relations: { items: true }, order: { borrowedAt: "DESC" } }); return rows.map(x => this.loan(x)); }
  async getActivePolicy() { const x = await this.m.getRepository(LoanPolicyOrmEntity).findOne({ where: { isActive: true }, order: { effectiveFrom: "DESC" } }); if (!x) throw new Error("Active loan policy is not configured"); return { id: x.id, maxActiveItems: x.maxActiveItems, loanDays: x.loanDays, maxRenewals: x.maxRenewals, renewalDays: x.renewalDays }; }
  async appendAudit(e: CirculationAuditEvent) { await this.m.query(`INSERT INTO audit_logs (actor_id,action,aggregate_type,aggregate_id,reason,details) VALUES ($1,$2,$3,$4,$5,$6::jsonb)`, [e.actorId,e.action,"Loan",e.aggregateId,null,JSON.stringify(e.details ?? {})]); }
  async isCopyHeldForReader(copyId: string, readerId: string) {
    const rows = await this.m.query("SELECT id FROM reservations WHERE copy_id = $1 AND reader_id = $2 AND status = 'ON_HOLD' FOR UPDATE", [copyId, readerId]);
    return rows.length > 0;
  }
  async completeHeldReservations(copyIds: string[], readerId: string) {
    if (!copyIds.length) return;
    await this.m.query("UPDATE reservations SET status = 'COMPLETED', updated_at = now(), version = version + 1 WHERE copy_id = ANY($1::uuid[]) AND reader_id = $2 AND status = 'ON_HOLD'", [copyIds, readerId]);
  }
  private copy(x: BookCopyOrmEntity): CirculationCopy { return { id: x.id, bookTitleId: x.bookTitleId, barcode: x.barcode, branchId: x.branchId, status: x.status }; }
  private loan(x: LoanOrmEntity) { return Loan.restore({ id: x.id, readerId: x.readerId, cardId: x.cardId, branchId: x.branchId, staffId: x.staffId, borrowedAt: x.borrowedAt, status: x.status, items: (x.items ?? []).map(i => ({ id: i.id, copyId: i.copyId, bookTitleId: i.bookTitleId, dueAt: i.dueAt, status: i.status, returnedAt: i.returnedAt, returnCondition: i.returnCondition, overdueDays: i.overdueDays, renewalCount: i.renewalCount })) }); }
}
