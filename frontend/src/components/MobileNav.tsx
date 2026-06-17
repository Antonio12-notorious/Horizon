import React, { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  MoreHorizontal,
  Briefcase,
  CreditCard,
  UserCheck,
  Settings,
  UserCircle,
  LogOut,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Eye,
  Bell,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useAuth, UserRole } from "../contexts/AuthContext";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NavItemDef {
  icon: React.ElementType;
  label: string;
  path: string;
  roles: UserRole[];
}

// ─── Bottom Nav (5 itens fixos) ───────────────────────────────────────────────

const BOTTOM_NAV_ITEMS: NavItemDef[] = [
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
];

// ─── Bottom Sheet (módulos secundários) ───────────────────────────────────────

const SHEET_MAIN_ITEMS: NavItemDef[] = [
  {
    icon: Briefcase,
    label: "Serviços",
    path: "/services",
    roles: ["ADMIN", "GERENTE", "OPERADOR"],
  },
  {
    icon: CreditCard,
    label: "Pagamentos",
    path: "/payments",
    roles: ["ADMIN", "GERENTE", "OPERADOR"],
  },
  {
    icon: UserCheck,
    label: "Utilizadores",
    path: "/users",
    roles: ["ADMIN"],
  },
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
      icon: <ShieldCheck className="text-red-400" size={12} />,
    },
    GERENTE: {
      label: "Gerente",
      icon: <Shield className="text-blue-400" size={12} />,
    },
    OPERADOR: {
      label: "Operador",
      icon: <ShieldAlert className="text-green-400" size={12} />,
    },
    VISUALIZADOR: {
      label: "Visualizador",
      icon: <Eye className="text-gray-400" size={12} />,
    },
  };

// ─── Utilitário: iniciais do nome ─────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

function BottomSheet({ isOpen, onClose }: BottomSheetProps) {
  const { user, logout } = useAuth();
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef<number>(0);

  // Fecha ao carregar em ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Swipe para baixo para fechar
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null) return;
    dragCurrentY.current = e.touches[0].clientY;
    const delta = dragCurrentY.current - dragStartY.current;
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`;
    }
  }, []);
  const onTouchEnd = useCallback(() => {
    if (dragStartY.current === null) return;
    const delta = dragCurrentY.current - dragStartY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    if (delta > 80) onClose();
    dragStartY.current = null;
  }, [onClose]);

  if (!user) return null;

  const role = user.role;
  const roleConf = ROLE_CONFIG[role];
  const filteredMain = SHEET_MAIN_ITEMS.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-sidebar rounded-t-[20px] border-t border-white/10 pb-[calc(4rem+env(safe-area-inset-bottom))]"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-9 h-1 rounded-full bg-white/20" />
            </div>

            {/* Fechar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Fechar menu"
            >
              <X size={16} />
            </button>

            {/* Perfil do utilizador */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {getInitials(user.name)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user.name}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {roleConf.icon}
                  <span className="text-gray-400 text-[11px]">
                    {roleConf.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-red-500/10 text-red-400 text-[11px] font-medium px-2.5 py-1 rounded-full">
                <Bell size={11} />
                <span>3</span>
              </div>
            </div>

            {/* Módulos principais */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold px-1 mb-3">
                Módulos
              </p>
              <div className="grid grid-cols-2 gap-2">
                {filteredMain.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all",
                        isActive
                          ? "bg-primary/20 border-primary/30 text-white"
                          : "bg-white/[0.03] border-white/[0.06] text-gray-400 hover:bg-white/[0.07] hover:text-gray-200",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          size={20}
                          className={cn(
                            isActive ? "text-primary" : "text-gray-400",
                          )}
                        />
                        <span className="text-[11px] font-medium text-center leading-tight">
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Rodapé: Perfil + Sair */}
            <div className="px-4 pt-2 pb-1 border-t border-white/[0.07] mx-4 mt-2 flex gap-2">
              <NavLink
                to="/profile"
                onClick={onClose}
                className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07] text-gray-300 hover:bg-white/[0.08] hover:text-white transition-all"
              >
                <UserCircle size={16} className="text-gray-400" />
                <span className="text-[13px] font-medium">Perfil</span>
              </NavLink>
              <button
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 hover:bg-red-500/[0.15] hover:text-red-300 transition-all"
              >
                <LogOut size={16} />
                <span className="text-[13px] font-medium">Sair</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── MobileNav principal ──────────────────────────────────────────────────────

export function MobileNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const role = user.role;
  const filteredNav = BOTTOM_NAV_ITEMS.filter((item) =>
    item.roles.includes(role),
  );

  // Verifica se a rota activa pertence ao sheet (não à bottom nav)
  const sheetPaths = SHEET_MAIN_ITEMS.map((i) => i.path);
  const isSheetRouteActive = sheetPaths.some(
    (p) => location.pathname === p || location.pathname.startsWith(p + "/"),
  );

  return (
    <>
      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-sidebar border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Navegação principal"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {filteredNav.map((item) => {
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname === item.path ||
                  location.pathname.startsWith(item.path + "/");

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSheetOpen(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[52px] py-1.5 px-3 rounded-xl transition-all",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-300",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-xl transition-all",
                    isActive ? "bg-primary/15" : "",
                  )}
                >
                  <item.icon size={22} />
                </div>
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* Botão Mais */}
          <button
            onClick={() => setSheetOpen((prev) => !prev)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[52px] py-1.5 px-3 rounded-xl transition-all",
              sheetOpen || isSheetRouteActive
                ? "text-primary"
                : "text-gray-500 hover:text-gray-300",
            )}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
            aria-label="Mais opções"
          >
            <div
              className={cn(
                "p-1.5 rounded-xl transition-all",
                sheetOpen || isSheetRouteActive ? "bg-primary/15" : "",
              )}
            >
              <MoreHorizontal size={22} />
            </div>
            <span className="text-[10px] font-medium leading-none">Mais</span>
          </button>
        </div>
      </nav>
    </>
  );
}
