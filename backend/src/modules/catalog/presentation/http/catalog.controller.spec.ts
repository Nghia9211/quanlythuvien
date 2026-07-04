import { SearchCatalogUseCase } from "../../application/use-cases/search-catalog.use-case";
import { BookTitleRepository } from "../../domain/repositories/book-title.repository";
import { CatalogController } from "./catalog.controller";

describe("CatalogController", () => {
  it("returns data and pagination metadata from the search use case", async () => {
    const repository: BookTitleRepository = {
      search: async () => ({ items: [], total: 0 }),
    };
    const controller = new CatalogController(new SearchCatalogUseCase(repository));

    const response = await controller.search({ query: "architecture", page: 1, limit: 20 });

    expect(response).toEqual({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it("translates application validation failures to HTTP 400", async () => {
    const repository: BookTitleRepository = {
      search: async () => ({ items: [], total: 0 }),
    };
    const controller = new CatalogController(new SearchCatalogUseCase(repository));

    await expect(
      controller.search({ query: "   ", page: 1, limit: 20 }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
