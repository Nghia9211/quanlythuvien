import { DataSource, EntityManager } from "typeorm";
import { TypeOrmReservationUnitOfWork } from "./reservation-unit-of-work";

describe("TypeOrmReservationUnitOfWork", () => {
  it("delegates one use case to exactly one database transaction", async () => {
    const manager = {} as EntityManager; let calls = 0;
    const source = { transaction: async <T>(work: (value: EntityManager) => Promise<T>) => { calls += 1; return work(manager); } } as DataSource;
    const result = await new TypeOrmReservationUnitOfWork(source).execute(async () => "ok");
    expect(result).toBe("ok"); expect(calls).toBe(1);
  });
});
