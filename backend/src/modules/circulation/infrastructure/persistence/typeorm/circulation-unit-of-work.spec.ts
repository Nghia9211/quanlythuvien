import { DataSource, EntityManager } from "typeorm";
import { TypeOrmCirculationUnitOfWork } from "./circulation-unit-of-work";
describe("TypeOrmCirculationUnitOfWork", () => {
  it("delegates all work to one transaction manager", async () => {
    const manager = {} as EntityManager; let count = 0;
    const source = { transaction: async <T>(work: (m: EntityManager) => Promise<T>) => { count += 1; return work(manager); } } as DataSource;
    const uow = new TypeOrmCirculationUnitOfWork(source);
    await uow.execute(async () => "ok");
    expect(count).toBe(1);
  });
});
