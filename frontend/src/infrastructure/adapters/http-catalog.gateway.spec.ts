import { describe, expect, it, vi } from "vitest";
import type { HttpClient } from "../http/http-client";
import { HttpCatalogGateway } from "./http-catalog.gateway";

describe("HttpCatalogGateway", () => {
  it("maps search metadata and management routes", async () => {
    const client = {
      getResponse: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }),
      get: vi.fn().mockResolvedValue([]), post: vi.fn().mockResolvedValue({}), patch: vi.fn().mockResolvedValue({}),
    } as unknown as HttpClient;
    const gateway = new HttpCatalogGateway(client);
    await gateway.search({ query: "clean architecture", branchId: "branch/a", page: 2, limit: 10 });
    await gateway.listShelves("branch/a");
    await gateway.listCopies("title/a");
    await gateway.createBranch({ code: "MAIN", name: "Main", address: null });
    expect(client.getResponse).toHaveBeenCalledWith("/catalog?query=clean+architecture&branchId=branch%2Fa&page=2&limit=10", false);
    expect(client.get).toHaveBeenCalledWith("/catalog/branches/branch%2Fa/shelves");
    expect(client.get).toHaveBeenCalledWith("/catalog/titles/title%2Fa/copies");
    expect(client.post).toHaveBeenCalledWith("/catalog/branches", { code: "MAIN", name: "Main", address: null });
  });
});
