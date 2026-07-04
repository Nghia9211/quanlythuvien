import { Repository, SelectQueryBuilder } from "typeorm";
import { BookCopyStatus } from "../../../../domain/enums/book-copy-status.enum";
import { CatalogSearchCriteria } from "../../../../domain/repositories/book-title.repository";
import { BookTitleOrmEntity } from "../entities/book-title.orm-entity";
import { TypeOrmBookTitleRepository } from "./typeorm-book-title.repository";

class QueryBuilderStub {
  parameters: Record<string, unknown> = {};

  leftJoinAndSelect(): this { return this; }
  where(_query: string, parameters: Record<string, unknown>): this {
    Object.assign(this.parameters, parameters);
    return this;
  }
  andWhere(_query: string, parameters: Record<string, unknown>): this {
    Object.assign(this.parameters, parameters);
    return this;
  }
  orderBy(): this { return this; }
  skip(): this { return this; }
  take(): this { return this; }
  distinct(): this { return this; }
  async getManyAndCount(): Promise<[BookTitleOrmEntity[], number]> {
    return [
      [{
        id: "title-1",
        title: "100% Architecture",
        isbn: null,
        authors: ["Author"],
        subjects: ["Architecture"],
        publisher: null,
        version: 1,
        copies: [
          {
            id: "copy-1",
            bookTitleId: "title-1",
            branchId: "11111111-1111-4111-8111-111111111111",
            barcode: "BC-001",
            rfid: null,
            shelfLocationId: "22222222-2222-4222-8222-222222222222",
            status: BookCopyStatus.AVAILABLE,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
      1,
    ];
  }
}

describe("TypeOrmBookTitleRepository", () => {
  it("escapes wildcard input, applies branch filtering, and returns domain entities", async () => {
    const builder = new QueryBuilderStub();
    const ormRepository = {
      createQueryBuilder: () => builder as unknown as SelectQueryBuilder<BookTitleOrmEntity>,
    } as Repository<BookTitleOrmEntity>;
    const repository = new TypeOrmBookTitleRepository(ormRepository);
    const criteria: CatalogSearchCriteria = {
      query: "100%_architecture",
      branchId: "11111111-1111-4111-8111-111111111111",
      page: 1,
      limit: 20,
    };

    const result = await repository.search(criteria);

    expect(builder.parameters).toEqual({
      term: "%100\\%\\_architecture%",
      branchId: "11111111-1111-4111-8111-111111111111",
    });
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe("100% Architecture");
    expect(result.items[0].availability()).toEqual([
      {
        branchId: "11111111-1111-4111-8111-111111111111",
        availableCopies: 1,
      },
    ]);
  });
});
