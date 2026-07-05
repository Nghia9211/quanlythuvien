import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "../../domain/auth";
import { BrowserSessionStore } from "../auth/browser-session-store";
import { ApiError } from "./api-error";
import { HttpClient } from "./http-client";

const user = { id: "user-1", readerId: null, username: "staff", role: "STAFF" as const };
const session: Session = {
  accessToken: "old-access",
  refreshToken: "old-refresh",
  refreshExpiresAt: "2026-08-01T00:00:00.000Z",
  user,
};

const jsonResponse = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(body),
}) as unknown as Response;

describe("HttpClient", () => {
  let store: BrowserSessionStore;
  let fetcher: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = new BrowserSessionStore(localStorage);
    store.save(session);
    fetcher = vi.fn();
  });

  it("unwraps successful data and attaches a bearer token", async () => {
    fetcher.mockResolvedValue(jsonResponse(200, { success: true, data: { id: "reader-1" } }));
    const client = new HttpClient("/api", store, fetcher);

    await expect(client.get("/readers/reader-1")).resolves.toEqual({ id: "reader-1" });
    expect(fetcher).toHaveBeenCalledWith("/api/readers/reader-1", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer old-access" }),
    }));
  });

  it("invokes browser fetch with the global window context", async () => {
    const browserFetch = function (this: unknown) {
      if (this !== globalThis) throw new TypeError("Illegal invocation");
      return Promise.resolve(jsonResponse(200, { success: true, data: { ok: true } }));
    } as unknown as typeof fetch;
    const client = new HttpClient("/api", store, browserFetch);

    await expect(client.get("/health")).resolves.toEqual({ ok: true });
  });

  it("maps backend validation errors", async () => {
    fetcher.mockResolvedValue(jsonResponse(400, {
      success: false,
      message: "Validation failed",
      errors: ["email must be an email"],
    }));
    const client = new HttpClient("/api", store, fetcher);

    const error = await client.post("/readers", {}).catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, messages: ["email must be an email"] });
  });

  it("retains response metadata when requested", async () => {
    fetcher.mockResolvedValue(jsonResponse(200, {
      success: true,
      data: [{ id: "title-1" }],
      meta: { page: 1, total: 1 },
    }));
    const client = new HttpClient("/api", store, fetcher);
    await expect(client.getResponse("/catalog?query=clean", false)).resolves.toEqual({
      data: [{ id: "title-1" }], meta: { page: 1, total: 1 },
    });
  });

  it("refreshes once and retries the protected request", async () => {
    const refreshed = { ...session, accessToken: "new-access", refreshToken: "new-refresh" };
    fetcher
      .mockResolvedValueOnce(jsonResponse(401, { success: false, message: "Unauthorized" }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: refreshed }))
      .mockResolvedValueOnce(jsonResponse(200, { success: true, data: { id: "reader-1" } }));
    const client = new HttpClient("/api", store, fetcher);

    await expect(client.get("/readers/reader-1")).resolves.toEqual({ id: "reader-1" });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[1][0]).toBe("/api/auth/refresh");
    expect(fetcher.mock.calls[2][1].headers.Authorization).toBe("Bearer new-access");
    expect(store.get()?.refreshToken).toBe("new-refresh");
  });

  it("clears the session when refresh fails without retrying forever", async () => {
    fetcher
      .mockResolvedValueOnce(jsonResponse(401, { success: false, message: "Unauthorized" }))
      .mockResolvedValueOnce(jsonResponse(401, { success: false, message: "Invalid refresh token" }));
    const client = new HttpClient("/api", store, fetcher);

    await expect(client.get("/reports/operations")).rejects.toMatchObject({ status: 401 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(store.get()).toBeNull();
  });
});
