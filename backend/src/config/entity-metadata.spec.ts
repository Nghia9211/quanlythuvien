import { getMetadataArgsStorage } from "typeorm";
import { BranchOrmEntity } from "@modules/catalog/infrastructure/persistence/typeorm/entities/branch.orm-entity";
import { PaymentTransactionOrmEntity } from "@modules/billing/infrastructure/persistence/typeorm/entities/payment-transaction.orm-entity";

describe("nullable entity column metadata", () => {
  it.each([[BranchOrmEntity, "address"], [PaymentTransactionOrmEntity, "providerReference"]] as const)("declares an explicit database type for %p.%s", (target, propertyName) => {
    const column = getMetadataArgsStorage().columns.find(value => value.target === target && value.propertyName === propertyName);
    expect(column?.options.type).toBe("varchar");
  });
});
