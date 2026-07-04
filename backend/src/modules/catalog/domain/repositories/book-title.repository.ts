import { BookTitle } from "../entities/book-title";

export interface CatalogSearchCriteria {
  query: string;
  branchId?: string;
  page: number;
  limit: number;
}

export interface CatalogSearchPage {
  items: BookTitle[];
  total: number;
}

export interface BookTitleRepository {
  search(criteria: CatalogSearchCriteria): Promise<CatalogSearchPage>;
}
