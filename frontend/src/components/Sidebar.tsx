import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  FileText,
  CreditCard,
  UserCheck,
  Settings,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Eye,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, UserRole } from "../contexts/AuthContext";

// ─── Menu items ───────────────────────────────────────────────────────────────

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/",
    roles: ["ADMIN", "GERENTE", "OPERADOR", "VISUALIZADOR"],
  },
  {
    icon: Users,
    label: "Clientes",
    path: "/clients",
    roles: ["ADMIN", "GERENTE", "OPERADOR"],
  },
  {
    icon: Briefcase,
    label: "Serviços",
    path: "/services",
    roles: ["ADMIN", "GERENTE", "OPERADOR"],
  },
  {
    icon: Calendar,
    label: "Agenda",
    path: "/appointments",
    roles: ["ADMIN", "GERENTE", "OPERADOR"],
  },
  {
    icon: FileText,
    label: "Faturas",
    path: "/invoices",
    roles: ["ADMIN", "GERENTE", "OPERADOR"],
  },
  {
    icon: CreditCard,
    label: "Pagamentos",
    path: "/payments",
    roles: ["ADMIN", "GERENTE", "OPERADOR"],
  },
  { icon: UserCheck, label: "Utilizadores", path: "/users", roles: ["ADMIN"] },
  {
    icon: Settings,
    label: "Definições",
    path: "/settings",
    roles: ["ADMIN", "GERENTE", "OPERADOR"],
  },
];

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ReactNode }> =
  {
    ADMIN: {
      label: "Administrador",
      icon: <ShieldCheck className="text-red-400" size={14} />,
    },
    GERENTE: {
      label: "Gerente",
      icon: <Shield className="text-blue-400" size={14} />,
    },
    OPERADOR: {
      label: "Operador",
      icon: <ShieldAlert className="text-green-400" size={14} />,
    },
    VISUALIZADOR: {
      label: "Visualizador",
      icon: <Eye className="text-gray-400" size={14} />,
    },
  };

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role;
  const roleConf = ROLE_CONFIG[role];
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar text-white rounded-md"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-white transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-auto",
          !isOpen && "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-xl">H</span>
            </div>
            <h1 className="text-xl font-semibold">Horizon</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {filteredMenuItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Perfil activo */}
          <div className="px-4 py-4 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-2">
                Perfil Activo
              </p>
              <div className="flex items-center gap-2 bg-sidebar p-2.5 rounded-lg border border-white/10">
                <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center">
                  {roleConf.icon}
                </div>
                <span className="font-bold text-xs text-white">
                  {roleConf.label}
                </span>
              </div>
              <div className="mt-2 px-1">
                <p className="text-[10px] text-gray-500 font-medium truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-gray-600 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={() => logout()}
              className="flex items-center gap-3 w-full px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
