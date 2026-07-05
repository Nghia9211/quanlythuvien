import type { CatalogBranch, CatalogBranchCommand, CatalogCopy, CatalogCopyCommand, CatalogSearchInput, CatalogSearchResult, CatalogShelf, CatalogShelfCommand, CatalogTitle, CatalogTitleCommand } from "../../domain/catalog";

export interface CatalogGateway {
  search(input: Required<Pick<CatalogSearchInput, "query" | "page" | "limit">> & Pick<CatalogSearchInput, "branchId">): Promise<CatalogSearchResult>;
  listBranches(): Promise<CatalogBranch[]>;
  listShelves(branchId: string): Promise<CatalogShelf[]>;
  listCopies(bookTitleId: string): Promise<CatalogCopy[]>;
  createTitle(input: CatalogTitleCommand): Promise<CatalogTitle>;
  updateTitle(id: string, input: Partial<CatalogTitleCommand>): Promise<CatalogTitle>;
  createBranch(input: CatalogBranchCommand): Promise<CatalogBranch>;
  createShelf(branchId: string, input: CatalogShelfCommand): Promise<CatalogShelf>;
  createCopy(input: CatalogCopyCommand): Promise<CatalogCopy>;
  updateCopy(id: string, input: Omit<CatalogCopyCommand, "bookTitleId">): Promise<CatalogCopy>;
}
