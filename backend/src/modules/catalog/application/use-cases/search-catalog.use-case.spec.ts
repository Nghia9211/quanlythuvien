import { BookTitle } from "../../domain/entities/book-title";
import { BookCopyStatus } from "../../domain/enums/book-copy-status.enum";
import {
  BookTitleRepository,
  CatalogSearchCriteria,
  CatalogSearchPage,
} from "../../domain/repositories/book-title.repository";
import { SearchCatalogUseCase } from "./search-catalog.use-case";

class RecordingBookTitleRepository implements BookTitleRepository {
  criteria?: CatalogSearchCriteria;

  async search(criteria: CatalogSearchCriteria): Promise<CatalogSearchPage> {
    this.criteria = criteria;
    return {
      total: 1,
      items: [
        BookTitle.restore({
          id: "title-1",
          title: "Domain-Driven Design",
          isbn: "9780321125217",
          authors: ["Eric Evans"],
          subjects: ["Software design"],
          publisher: "Addison-Wesley",
          copies: [
            {
              id: "copy-1",
              branchId: "11111111-1111-4111-8111-111111111111",
              status: BookCopyStatus.AVAILABLE,
            },
          ],
        }),
      ],
    };
  }
}

describe("SearchCatalogUseCase", () => {
  it("normalizes search input and maps paginated catalog results", async () => {
    const repository = new RecordingBookTitleRepository();
    const useCase = new SearchCatalogUseCase(repository);

    const result = await useCase.execute({
      query: "  Domain  ",
      branchId: "11111111-1111-4111-8111-111111111111",
      page: 2,
      limit: 10,
    });

    expect(repository.criteria).toEqual({
      query: "domain",
      branchId: "11111111-1111-4111-8111-111111111111",
      page: 2,
      limit: 10,
    });
    expect(result).toEqual({
      items: [
        {
          id: "title-1",
          title: "Domain-Driven Design",
          isbn: "9780321125217",
          authors: ["Eric Evans"],
          subjects: ["Software design"],
          publisher: "Addison-Wesley",
          availability: [
            {
              branchId: "11111111-1111-4111-8111-111111111111",
              availableCopies: 1,
            },
          ],
        },
      ],
      page: 2,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it.each([
    [{ query: " ", page: 1, limit: 20 }, "Search query must not be empty"],
    [{ query: "book", page: 0, limit: 20 }, "Page must be at least 1"],
    [{ query: "book", page: 1, limit: 101 }, "Limit must be between 1 and 100"],
  ])("rejects invalid criteria %#", async (query, message) => {
    const useCase = new SearchCatalogUseCase(new RecordingBookTitleRepository());
    await expect(useCase.execute(query)).rejects.toThrow(message);
  });
});
