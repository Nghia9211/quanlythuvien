import type { LoginInput, User } from "../../domain/auth";
import { ValidationError } from "../errors";
import type { AuthGateway, SessionStore } from "../ports/auth.gateway";

export class LoginUseCase {
  constructor(private readonly auth: AuthGateway, private readonly sessions: SessionStore) {}

  async execute(input: LoginInput): Promise<User> {
    const username = input.username.trim().toLowerCase();
    if (!username || input.password.length < 8) {
      throw new ValidationError("Tên đăng nhập và mật khẩu từ 8 ký tự là bắt buộc");
    }
    const session = await this.auth.login({ username, password: input.password });
    this.sessions.save(session);
    return session.user;
  }
}

export class RestoreSessionUseCase {
  constructor(private readonly auth: AuthGateway, private readonly sessions: SessionStore) {}

  async execute(): Promise<User | null> {
    if (!this.sessions.get()) return null;
    try {
      return await this.auth.me();
    } catch (error) {
      this.sessions.clear();
      throw error;
    }
  }
}

export class LogoutUseCase {
  constructor(private readonly auth: AuthGateway, private readonly sessions: SessionStore) {}

  async execute(): Promise<void> {
    try {
      await this.auth.logout();
    } finally {
      this.sessions.clear();
    }
  }
}
