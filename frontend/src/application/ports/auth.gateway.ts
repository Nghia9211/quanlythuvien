import type { LoginInput, Session, User } from "../../domain/auth";

export interface AuthGateway {
  login(input: LoginInput): Promise<Session>;
  me(): Promise<User>;
  logout(): Promise<void>;
}

export interface SessionStore {
  get(): Session | null;
  save(session: Session): void;
  clear(): void;
  subscribe(listener: (session: Session | null) => void): () => void;
}
