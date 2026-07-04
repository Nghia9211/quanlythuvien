export { CatalogDomainError } from "../../domain/errors/catalog-domain.error";
export class CatalogManagementError extends Error {}
export class CatalogConflictError extends CatalogManagementError {}
export class CatalogNotFoundError extends CatalogManagementError {
  constructor(resource: string, id: string) { super(`${resource} ${id} was not found`); }
}
export class CatalogValidationError extends CatalogManagementError {}
