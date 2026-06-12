import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./layouts/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { ChangePassword } from "./pages/ChangePassword";
import { Clients } from "./pages/Clients";
import { Services } from "./pages/Services";
import { Appointments } from "./pages/Appointments";
import { Invoices } from "./pages/Invoices";
import { Users } from "./pages/Users";
import { Settings } from "./pages/Settings";
import { Profile } from "./pages/Profile";
import NotificationsPage from "./pages/Notifications";
import { AuthProvider, useAuth, UserRole } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AccentProvider } from "./contexts/AccentContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";

// ─── Protected Route ──────────────────────────────────────────────────────────

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-primary tracking-widest uppercase">
        A carregar...
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

// ─── Placeholder ──────────────────────────────────────────────────────────────

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-8">
    <h2 className="text-2xl font-bold mb-4 tracking-tight text-gray-900 dark:text-white transition-colors">
      {title}
    </h2>
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm text-gray-500 dark:text-gray-400 italic font-medium transition-colors">
      Esta página está em desenvolvimento...
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AccentProvider>
          <CurrencyProvider>
            <AuthProvider>
              <Toaster position="top-right" />
              <Routes>
                {/* Públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/change-password" element={<ChangePassword />} />

                {/* Dashboard — todos os roles */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "ADMIN",
                        "GERENTE",
                        "OPERADOR",
                        "VISUALIZADOR",
                      ]}
                    >
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Clientes */}
                <Route
                  path="/clients"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "ADMIN",
                        "GERENTE",
                        "OPERADOR",
                        "VISUALIZADOR",
                      ]}
                    >
                      <Clients />
                    </ProtectedRoute>
                  }
                />

                {/* Serviços */}
                <Route
                  path="/services"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN", "GERENTE", 'OPERADOR']}>
                      <Services />
                    </ProtectedRoute>
                  }
                />

                {/* Agendamentos */}
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN", "GERENTE", "OPERADOR"]}
                    >
                      <Appointments />
                    </ProtectedRoute>
                  }
                />

                {/* Facturas */}
                <Route
                  path="/invoices"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN", "GERENTE", "OPERADOR"]}
                    >
                      <Invoices />
                    </ProtectedRoute>
                  }
                />

                {/* Utilizadores — apenas ADMIN */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={["ADMIN"]}>
                      <Users />
                    </ProtectedRoute>
                  }
                />

                {/* Pagamentos */}
                <Route
                  path="/payments"
                  element={
                    <ProtectedRoute
                      allowedRoles={["ADMIN", "GERENTE", "OPERADOR"]}
                    >
                      <PlaceholderPage title="Controlo de Pagamentos" />
                    </ProtectedRoute>
                  }
                />

                {/* Definições */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "ADMIN",
                        "GERENTE",
                        "OPERADOR",
                        "VISUALIZADOR",
                      ]}
                    >
                      <Settings />
                    </ProtectedRoute>
                  }
                />

                {/* Perfil */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "ADMIN",
                        "GERENTE",
                        "OPERADOR",
                        "VISUALIZADOR",
                      ]}
                    >
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Notificações */}
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute
                      allowedRoles={[
                        "ADMIN",
                        "GERENTE",
                        "OPERADOR",
                        "VISUALIZADOR",
                      ]}
                    >
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </CurrencyProvider>
        </AccentProvider>
      </ThemeProvider>
    </Router>
  );
}
