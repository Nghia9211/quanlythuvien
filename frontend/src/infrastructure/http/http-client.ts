import type { SessionStore } from "../../application/ports/auth.gateway";
import type { Session } from "../../domain/auth";
import { ApiError } from "./api-error";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[] | null;
}

export class HttpClient {
  private refreshPromise: Promise<Session> | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly sessions: SessionStore,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  get<T>(path: string, authenticated = true): Promise<T> {
    return this.request<T>(path, { method: "GET" }, authenticated);
  }

  post<T>(path: string, body?: unknown, authenticated = true): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }, authenticated);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, true);
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    authenticated: boolean,
    canRetry = true,
  ): Promise<T> {
    const session = this.sessions.get();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    if (authenticated && session) headers.Authorization = `Bearer ${session.accessToken}`;

    const response = await this.fetcher.call(globalThis, `${this.baseUrl}${path}`, { ...init, headers });
    if (response.status === 401 && authenticated && canRetry && session) {
      await this.refresh(session.refreshToken);
      return this.request<T>(path, init, authenticated, false);
    }

    return this.read<T>(response);
  }

  private async refresh(refreshToken: string): Promise<Session> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.performRefresh(refreshToken).finally(() => {
        this.refreshPromise = null;
      });
    }
    return this.refreshPromise;
  }

  private async performRefresh(refreshToken: string): Promise<Session> {
    const response = await this.fetcher.call(globalThis, `${this.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    try {
      const session = await this.read<Session>(response);
      this.sessions.save(session);
      return session;
    } catch (error) {
      this.sessions.clear();
      throw error;
    }
  }

  private async read<T>(response: Response): Promise<T> {
    let payload: ApiEnvelope<T> | undefined;
    try {
      payload = await response.json() as ApiEnvelope<T>;
    } catch {
      if (response.ok) return undefined as T;
    }
    if (!response.ok || !payload?.success) {
      const messages = payload?.errors?.length
        ? payload.errors
        : [payload?.message || "Không thể kết nối đến máy chủ"];
      throw new ApiError(response.status, messages);
    }
    return payload.data;
  }
}
