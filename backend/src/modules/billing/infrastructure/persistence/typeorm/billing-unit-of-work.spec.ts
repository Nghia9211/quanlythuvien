import { DataSource, EntityManager } from "typeorm";
import { TypeOrmBillingUnitOfWork } from "./billing-unit-of-work";
describe("TypeOrmBillingUnitOfWork",()=>{it("uses one transaction manager",async()=>{let calls=0;const manager={} as EntityManager;const source={transaction:async(work:any)=>{calls++;return work(manager);}} as DataSource;expect(await new TypeOrmBillingUnitOfWork(source).execute(async()=>"ok")).toBe("ok");expect(calls).toBe(1);});});
