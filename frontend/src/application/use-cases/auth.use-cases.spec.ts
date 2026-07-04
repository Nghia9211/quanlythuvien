import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthGateway, SessionStore } from "../ports/auth.gateway";
import { LoginUseCase, LogoutUseCase, RestoreSessionUseCase } from "./auth.use-cases";

const user = { id: "user-1", readerId: null, username: "staff", role: "STAFF" as const };
const session = {
  accessToken: "access",
  refreshToken: "refresh",
  refreshExpiresAt: "2026-08-01T00:00:00.000Z",
  user,
};

describe("authentication use cases", () => {
  let auth: AuthGateway;
  let store: SessionStore;

  beforeEach(() => {
    auth = {
      login: vi.fn(),
      me: vi.fn(),
      logout: vi.fn(),
    };
    store = {
      get: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
      subscribe: vi.fn(() => () => undefined),
    };
  });

  it("normalizes the username and persists a successful login", async () => {
    vi.mocked(auth.login).mockResolvedValue(session);

    const result = await new LoginUseCase(auth, store).execute({
      username: " Staff ",
      password: "password1",
    });

    expect(result).toEqual(user);
    expect(auth.login).toHaveBeenCalledWith({ username: "staff", password: "password1" });
    expect(store.save).toHaveBeenCalledWith(session);
  });

  it("rejects incomplete credentials before calling the gateway", async () => {
    await expect(new LoginUseCase(auth, store).execute({ username: "", password: "short" }))
      .rejects.toMatchObject({ message: "Tên đăng nhập và mật khẩu từ 8 ký tự là bắt buộc" });
    expect(auth.login).not.toHaveBeenCalled();
  });

  it("restores the current user only when a saved session exists", async () => {
    vi.mocked(store.get).mockReturnValue(session);
    vi.mocked(auth.me).mockResolvedValue(user);

    await expect(new RestoreSessionUseCase(auth, store).execute()).resolves.toEqual(user);
    expect(auth.me).toHaveBeenCalledOnce();
  });

  it("clears local state even when remote logout fails", async () => {
    vi.mocked(auth.logout).mockRejectedValue(new Error("offline"));

    await expect(new LogoutUseCase(auth, store).execute()).rejects.toThrow("offline");
    expect(store.clear).toHaveBeenCalledOnce();
  });
});
