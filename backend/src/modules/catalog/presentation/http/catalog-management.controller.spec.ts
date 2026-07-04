import { ConflictException, NotFoundException } from "@nestjs/common";
import { CatalogConflictError, CatalogNotFoundError } from "../../application/errors/catalog-management.error";
import { CatalogManagementController } from "./catalog-management.controller";

describe("CatalogManagementController", () => {
  const ok = { id: "id-1" };
  const useCase = () => ({ execute: async () => ok });
  const controller = (override?: any) => new CatalogManagementController(
    (override ?? useCase()) as any, useCase() as any, useCase() as any,
    useCase() as any, useCase() as any, useCase() as any,
  );

  it("adds authenticated staff id to title creation", async () => {
    let command: any;
    const instance = controller({ execute: async (value: any) => { command = value; return ok; } });
    await instance.createTitle({ title: "DDD", isbn: null, authors: ["Evans"], subjects: [], publisher: null }, "staff-1");
    expect(command).toMatchObject({ title: "DDD", actorId: "staff-1" });
  });

  it("maps conflict and missing errors", async () => {
    const conflict = controller({ execute: async () => { throw new CatalogConflictError("duplicate"); } });
    await expect(conflict.createTitle({} as any, "staff")).rejects.toBeInstanceOf(ConflictException);
    const missing = new CatalogManagementController(
      useCase() as any, { execute: async () => { throw new CatalogNotFoundError("BookTitle", "x"); } } as any,
      useCase() as any, useCase() as any, useCase() as any, useCase() as any,
    );
    await expect(missing.updateTitle("x", {} as any, "staff")).rejects.toBeInstanceOf(NotFoundException);
  });
});
