export interface CatalogTitle { id: string; title: string; isbn: string | null; authors: string[]; subjects: string[]; publisher: string | null; }
export interface CatalogSearchItem extends CatalogTitle { availability: Array<{ branchId: string; availableCopies: number }>; }
export interface PageMeta { page: number; limit: number; total: number; totalPages: number; }
export interface CatalogSearchInput { query: string; branchId?: string; page?: number; limit?: number; }
export interface CatalogSearchResult { items: CatalogSearchItem[]; meta: PageMeta; }
export interface CatalogBranch { id: string; code: string; name: string; address: string | null; }
export interface CatalogShelf { id: string; branchId: string; code: string; label: string; }
export interface CatalogCopy { id: string; bookTitleId: string; barcode: string; rfid: string | null; branchId: string; shelfLocationId: string; status: string; }
export interface CatalogTitleCommand { title: string; isbn: string | null; authors: string[]; subjects: string[]; publisher: string | null; }
export interface CatalogTitleDraft { title: string; isbn?: string; authorsText: string; subjectsText: string; publisher?: string; }
export interface CatalogBranchCommand { code: string; name: string; address: string | null; }
export interface CatalogShelfCommand { code: string; label: string; }
export interface CatalogCopyCommand { bookTitleId: string; barcode: string; rfid: string | null; branchId: string; shelfLocationId: string; }
export interface CatalogCopyDraft { bookTitleId: string; barcode: string; rfid?: string; branchId: string; shelfLocationId: string; }
