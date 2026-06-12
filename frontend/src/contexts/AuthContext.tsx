import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "GERENTE" | "OPERADOR" | "VISUALIZADOR";
export type UserStatus = "ATIVO" | "INATIVO" | "BLOQUEADO" | "PENDENTE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  contact?: string;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ mustChangePassword: boolean }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
    role: string; // ou 'Admin' | 'Gerente' | 'Visualizador'
  setRole: (role: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ─── Helpers de storage ───────────────────────────────────────────────────────

const storage = {
  getToken: () => localStorage.getItem("token"),
  getRefreshToken: () => localStorage.getItem("refreshToken"),
  getUser: () => {
    const u = localStorage.getItem("auth_user");
    return u ? (JSON.parse(u) as User) : null;
  },
  setSession: (token: string, refreshToken: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("auth_user", JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("auth_user");
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => storage.getUser());
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Refresh silencioso ──────────────────────────────────────────────────────

  const silentRefresh = useCallback(async (): Promise<boolean> => {
    const refreshToken = storage.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        storage.clearSession();
        return false;
      }

      const data = await res.json();
      storage.setSession(data.token, data.refreshToken, data.user);
      setUser(data.user);

      // agendar próximo refresh (14 minutos — access token dura 15m)
      scheduleRefresh();
      return true;
    } catch {
      storage.clearSession();
      return false;
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(
      () => {
        silentRefresh();
      },
      14 * 60 * 1000,
    );
  }, [silentRefresh]);

  // ── Inicializar sessão ──────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      const token = storage.getToken();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem("auth_user", JSON.stringify(data.user));
          scheduleRefresh();
        } else {
          // token expirado — tentar refresh
          await silentRefresh();
        }
      } catch {
        await silentRefresh();
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [silentRefresh, scheduleRefresh]);

  // ── Login ───────────────────────────────────────────────────────────────────

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || "Credenciais inválidas");
    }

    storage.setSession(data.token, data.refreshToken, data.user);
    setUser(data.user);
    scheduleRefresh();

    return { mustChangePassword: data.mustChangePassword as boolean };
  };

  // ── Logout ──────────────────────────────────────────────────────────────────

  const logout = async () => {
    const token = storage.getToken();
    const refreshToken = storage.getRefreshToken();

    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      /* ignorar erros de rede no logout */
    }

    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    storage.clearSession();
    setUser(null);
    window.location.href = "/login";
  };

  // ── Alterar senha ───────────────────────────────────────────────────────────

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    const token = storage.getToken();
    if (!token) throw new Error("Não autenticado");

    const res = await fetch(`${API_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.error || "Erro ao alterar senha");

    // actualizar flag localmente
    updateUser({ mustChangePassword: false });
  };

  // ── Actualizar user local ───────────────────────────────────────────────────

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem("auth_user", JSON.stringify(updated));
      return updated;
    });
  };

  // ── Verificar role ──────────────────────────────────────────────────────────

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        changePassword,
        hasRole,
        role: user?.role || "",
        setRole: (role: string) => updateUser({ role: role as UserRole }),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
