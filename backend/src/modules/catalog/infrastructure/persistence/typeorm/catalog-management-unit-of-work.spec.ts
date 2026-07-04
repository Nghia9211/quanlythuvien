import { DataSource, EntityManager } from "typeorm";
import { BookTitle } from "../../../domain/entities/book-title";
import { CatalogManagementTypeOrmUnitOfWork } from "./catalog-management-unit-of-work";
import { BookTitleOrmEntity } from "./entities/book-title.orm-entity";

describe("CatalogManagementTypeOrmUnitOfWork", () => {
  it("uses one transaction manager for catalog writes", async () => {
    const writes: unknown[] = [];
    const queries: Array<{ sql: string; parameters: unknown[] }> = [];
    const manager = {
      getRepository: (entity: unknown) => entity === BookTitleOrmEntity
        ? { save: async (value: unknown) => writes.push(value) }
        : { insert: async (value: unknown) => writes.push(value) },
      insert: async (_table: string, value: unknown) => writes.push(value),
      query: async (sql: string, parameters: unknown[]) => queries.push({ sql, parameters }),
    } as unknown as EntityManager;
    let transactions = 0;
    const dataSource = {
      transaction: async <T>(work: (manager: EntityManager) => Promise<T>) => {
        transactions += 1; return work(manager);
      },
    } as DataSource;
    const uow = new CatalogManagementTypeOrmUnitOfWork(dataSource);
    const title = BookTitle.create({ id: "title-1", title: "DDD", isbn: null, authors: ["Evans"], subjects: [], publisher: null });
    await uow.execute(async tx => {
      await tx.saveTitle(title);
      await tx.appendAudit({ actorId: "staff-1", action: "BOOK_TITLE_CREATED", aggregateId: title.id });
    });
    expect(transactions).toBe(1);
    expect(writes).toHaveLength(1);
    expect(queries[0].sql).toContain("actor_id");
    expect(queries[0].parameters).toContain("BOOK_TITLE_CREATED");
  });
});
