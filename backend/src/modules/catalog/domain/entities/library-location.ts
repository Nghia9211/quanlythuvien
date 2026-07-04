import { CatalogDomainError } from "../errors/catalog-domain.error";

export interface BranchSnapshot { id: string; code: string; name: string; address: string | null; }
export interface ShelfLocationSnapshot { id: string; branchId: string; code: string; label: string; }

export class Branch {
  private constructor(private state: BranchSnapshot) {}
  static create(input: BranchSnapshot): Branch {
    const code = input.code.trim().toUpperCase();
    const name = input.name.trim().replace(/\s+/g, " ");
    if (!code || !name) throw new CatalogDomainError("Branch code and name are required");
    return new Branch({ ...input, code, name, address: input.address?.trim() || null });
  }
  static restore(input: BranchSnapshot) { return Branch.create(input); }
  get id() { return this.state.id; } get code() { return this.state.code; }
  get name() { return this.state.name; } get address() { return this.state.address; }
  toSnapshot() { return { ...this.state }; }
}

export class ShelfLocation {
  private constructor(private state: ShelfLocationSnapshot) {}
  static create(input: ShelfLocationSnapshot): ShelfLocation {
    const code = input.code.trim().toUpperCase(); const label = input.label.trim();
    if (!input.branchId || !code || !label) throw new CatalogDomainError("Shelf branch, code and label are required");
    return new ShelfLocation({ ...input, code, label });
  }
  static restore(input: ShelfLocationSnapshot) { return ShelfLocation.create(input); }
  get id() { return this.state.id; } get branchId() { return this.state.branchId; }
  get code() { return this.state.code; } get label() { return this.state.label; }
  toSnapshot() { return { ...this.state }; }
}
