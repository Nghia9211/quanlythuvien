import type { CatalogCopyDraft, CatalogSearchInput, CatalogTitleDraft } from "../../domain/catalog";
import { isUuid, ValidationError } from "../errors";
import type { CatalogGateway } from "../ports/catalog.gateway";

const optional = (value?: string) => value?.trim() || null;
const values = (value: string) => [...new Set(value.split(/[,\n]/).map((part) => part.trim()).filter(Boolean))];
const titleCommand = (draft: CatalogTitleDraft) => {
  const title = draft.title.trim(), authors = values(draft.authorsText), subjects = values(draft.subjectsText);
  if (!title || !authors.length) throw new ValidationError("Tên sách và ít nhất một tác giả là bắt buộc");
  return { title, isbn: optional(draft.isbn), authors, subjects, publisher: optional(draft.publisher) };
};
const uuid = (value: string, label: string) => { if (!isUuid(value)) throw new ValidationError(`${label} phải là UUID hợp lệ`); return value.trim(); };

export class SearchCatalogUseCase { constructor(private gateway: CatalogGateway) {} async execute(input: CatalogSearchInput) { const query=input.query.trim(); const page=input.page??1,limit=input.limit??20;if(!query)throw new ValidationError("Từ khóa tìm kiếm là bắt buộc");if(page<1||limit<1||limit>100)throw new ValidationError("Phân trang không hợp lệ");if(input.branchId)uuid(input.branchId,"ID chi nhánh");return this.gateway.search({query,branchId:input.branchId?.trim()||undefined,page,limit}); } }
export class ListCatalogBranchesUseCase { constructor(private gateway: CatalogGateway) {} execute(){return this.gateway.listBranches();} }
export class ListCatalogShelvesUseCase { constructor(private gateway: CatalogGateway) {} async execute(branchId:string){return this.gateway.listShelves(uuid(branchId,"ID chi nhánh"));} }
export class ListCatalogCopiesUseCase { constructor(private gateway: CatalogGateway) {} async execute(titleId:string){return this.gateway.listCopies(uuid(titleId,"ID đầu sách"));} }
export class CreateCatalogTitleUseCase { constructor(private gateway: CatalogGateway) {} async execute(draft:CatalogTitleDraft){return this.gateway.createTitle(titleCommand(draft));} }
export class UpdateCatalogTitleUseCase { constructor(private gateway: CatalogGateway) {} async execute(id:string,draft:CatalogTitleDraft){return this.gateway.updateTitle(uuid(id,"ID đầu sách"),titleCommand(draft));} }
export class CreateCatalogBranchUseCase { constructor(private gateway: CatalogGateway) {} async execute(input:{code:string;name:string;address?:string}){const code=input.code.trim().toUpperCase(),name=input.name.trim();if(!code||!name)throw new ValidationError("Mã và tên chi nhánh là bắt buộc");return this.gateway.createBranch({code,name,address:optional(input.address)});} }
export class CreateCatalogShelfUseCase { constructor(private gateway: CatalogGateway) {} async execute(branchId:string,input:{code:string;label:string}){const code=input.code.trim().toUpperCase(),label=input.label.trim();if(!code||!label)throw new ValidationError("Mã và nhãn kệ là bắt buộc");return this.gateway.createShelf(uuid(branchId,"ID chi nhánh"),{code,label});} }
const copyCommand=(draft:CatalogCopyDraft)=>{const barcode=draft.barcode.trim().toUpperCase();if(!barcode)throw new ValidationError("Barcode là bắt buộc");return{bookTitleId:uuid(draft.bookTitleId,"ID đầu sách"),branchId:uuid(draft.branchId,"ID chi nhánh"),shelfLocationId:uuid(draft.shelfLocationId,"ID kệ"),barcode,rfid:optional(draft.rfid)};};
export class CreateCopyUseCase { constructor(private gateway: CatalogGateway) {} async execute(draft:CatalogCopyDraft){return this.gateway.createCopy(copyCommand(draft));} }
export class UpdateCopyUseCase { constructor(private gateway: CatalogGateway) {} async execute(id:string,draft:CatalogCopyDraft){const {bookTitleId:_,...command}=copyCommand(draft);return this.gateway.updateCopy(uuid(id,"ID bản sao"),command);} }
