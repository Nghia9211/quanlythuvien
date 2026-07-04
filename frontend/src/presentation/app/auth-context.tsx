import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "../../domain/auth";
import { useServices } from "./services-context";

type AuthStatus = "restoring" | "authenticated" | "anonymous";
interface AuthState {
  user: User | null;
  status: AuthStatus;
  login(username: string, password: string): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const services = useServices();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("restoring");

  useEffect(() => {
    let active = true;
    services.restoreSession.execute()
      .then((restored) => {
        if (!active) return;
        setUser(restored);
        setStatus(restored ? "authenticated" : "anonymous");
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setStatus("anonymous");
      });
    const unsubscribe = services.sessions.subscribe((session) => {
      if (!session && active) {
        setUser(null);
        setStatus("anonymous");
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [services]);

  const value = useMemo<AuthState>(() => ({
    user,
    status,
    async login(username, password) {
      const current = await services.login.execute({ username, password });
      setUser(current);
      setStatus("authenticated");
    },
    async logout() {
      try {
        await services.logout.execute();
      } finally {
        setUser(null);
        setStatus("anonymous");
      }
    },
  }), [services, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthProvider is missing");
  return auth;
}
