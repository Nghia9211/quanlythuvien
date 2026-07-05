import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogGateway } from "../ports/catalog.gateway";
import { CreateCatalogTitleUseCase, CreateCopyUseCase, SearchCatalogUseCase } from "./catalog.use-cases";

describe("Catalog use cases", () => {
  let gateway: CatalogGateway;
  beforeEach(() => {
    gateway = {
      search: vi.fn(), listBranches: vi.fn(), listShelves: vi.fn(), listCopies: vi.fn(),
      createTitle: vi.fn(), updateTitle: vi.fn(), createBranch: vi.fn(), createShelf: vi.fn(),
      createCopy: vi.fn(), updateCopy: vi.fn(),
    };
  });

  it("rejects an empty search query", async () => {
    await expect(new SearchCatalogUseCase(gateway).execute({ query: "  ", page: 1, limit: 20 }))
      .rejects.toMatchObject({ message: "Từ khóa tìm kiếm là bắt buộc" });
    expect(gateway.search).not.toHaveBeenCalled();
  });

  it("normalizes unique authors and subjects", async () => {
    vi.mocked(gateway.createTitle).mockResolvedValue({ id: "title-1", title: "Clean Architecture", isbn: null, authors: ["Robert Martin"], subjects: ["Software", "Design"], publisher: null });
    await new CreateCatalogTitleUseCase(gateway).execute({
      title: " Clean Architecture ", isbn: "", publisher: "",
      authorsText: "Robert Martin, Robert Martin", subjectsText: "Software\nDesign",
    });
    expect(gateway.createTitle).toHaveBeenCalledWith({
      title: "Clean Architecture", isbn: null, publisher: null,
      authors: ["Robert Martin"], subjects: ["Software", "Design"],
    });
  });

  it("normalizes a copy barcode and optional RFID", async () => {
    await new CreateCopyUseCase(gateway).execute({
      bookTitleId: "550e8400-e29b-41d4-a716-446655440000",
      branchId: "123e4567-e89b-42d3-a456-426614174000",
      shelfLocationId: "123e4567-e89b-42d3-a456-426614174001",
      barcode: " copy-001 ", rfid: " ",
    });
    expect(gateway.createCopy).toHaveBeenCalledWith(expect.objectContaining({ barcode: "COPY-001", rfid: null }));
  });
});
