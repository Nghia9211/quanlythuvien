import type { CatalogGateway } from "../../application/ports/catalog.gateway";
import type { CatalogBranch, CatalogBranchCommand, CatalogCopy, CatalogCopyCommand, CatalogSearchInput, CatalogSearchItem, CatalogShelf, CatalogShelfCommand, CatalogTitle, CatalogTitleCommand, PageMeta } from "../../domain/catalog";
import type { HttpClient } from "../http/http-client";

export class HttpCatalogGateway implements CatalogGateway {
  constructor(private client: HttpClient) {}
  async search(input: Required<Pick<CatalogSearchInput,"query"|"page"|"limit">>&Pick<CatalogSearchInput,"branchId">){const q=new URLSearchParams({query:input.query});if(input.branchId)q.set("branchId",input.branchId);q.set("page",String(input.page));q.set("limit",String(input.limit));const result=await this.client.getResponse<CatalogSearchItem[],PageMeta>(`/catalog?${q.toString()}`,false);return{items:result.data,meta:result.meta!};}
  listBranches(){return this.client.get<CatalogBranch[]>("/catalog/branches");}
  listShelves(id:string){return this.client.get<CatalogShelf[]>(`/catalog/branches/${encodeURIComponent(id)}/shelves`);}
  listCopies(id:string){return this.client.get<CatalogCopy[]>(`/catalog/titles/${encodeURIComponent(id)}/copies`);}
  createTitle(input:CatalogTitleCommand){return this.client.post<CatalogTitle>("/catalog/titles",input);}
  updateTitle(id:string,input:Partial<CatalogTitleCommand>){return this.client.patch<CatalogTitle>(`/catalog/titles/${encodeURIComponent(id)}`,input);}
  createBranch(input:CatalogBranchCommand){return this.client.post<CatalogBranch>("/catalog/branches",input);}
  createShelf(id:string,input:CatalogShelfCommand){return this.client.post<CatalogShelf>(`/catalog/branches/${encodeURIComponent(id)}/shelves`,input);}
  createCopy(input:CatalogCopyCommand){return this.client.post<CatalogCopy>("/catalog/copies",input);}
  updateCopy(id:string,input:Omit<CatalogCopyCommand,"bookTitleId">){return this.client.patch<CatalogCopy>(`/catalog/copies/${encodeURIComponent(id)}`,input);}
}
