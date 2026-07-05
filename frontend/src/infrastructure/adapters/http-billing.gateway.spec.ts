import { describe, expect, it, vi } from "vitest";
import type { HttpClient } from "../http/http-client";
import { HttpBillingGateway } from "./http-billing.gateway";

describe("HttpBillingGateway", () => {
  it("maps all staff billing routes", async () => {
    const client = {
      get: vi.fn().mockResolvedValue([]),
      post: vi.fn().mockResolvedValue({}),
    } as unknown as HttpClient;
    const gateway = new HttpBillingGateway(client);

    await gateway.listFines("reader/a");
    await gateway.listPayments("reader/a");
    await gateway.createPayment({ readerId: "reader/a", fineIds: ["fine-1"], method: "ONLINE" });
    await gateway.simulatePayment("payment/a", "FAILED");

    expect(client.get).toHaveBeenNthCalledWith(1, "/fines/readers/reader%2Fa");
    expect(client.get).toHaveBeenNthCalledWith(2, "/payments/readers/reader%2Fa");
    expect(client.post).toHaveBeenNthCalledWith(1, "/payments", {
      readerId: "reader/a", fineIds: ["fine-1"], method: "ONLINE",
    });
    expect(client.post).toHaveBeenNthCalledWith(2, "/payments/payment%2Fa/simulate", { result: "FAILED" });
  });
});
