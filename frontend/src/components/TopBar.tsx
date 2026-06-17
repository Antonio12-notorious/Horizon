import React, { useState } from "react";
import { Notifications } from "./Notifications";
// import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "../contexts/AuthContext";
import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  User,
  LogOut,
  Settings as SettingsIcon,
  Key,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const { role, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const getRoleBadge = () => {
    switch (role) {
      case "Admin":
        return (
          <span className="bg-red-500/20 text-red-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-1.5">
            <ShieldCheck size={12} /> Admin
          </span>
        );
      case "Utilizador":
        return (
          <span className="bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20 flex items-center gap-1.5">
            <Shield size={12} /> Staff
          </span>
        );
      case "Visualizador":
        return (
          <span className="bg-white/10 text-gray-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1.5">
            <ShieldAlert size={12} /> Visitante
          </span>
        );
    }
  };

  return (
    <header className="h-20 border-b border-white/10 bg-sidebar backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between transition-colors">
      {/* Logo mobile — idêntico ao da Sidebar, visível só em mobile */}
      <div className="flex items-center gap-2.5 lg:hidden flex-shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
          <span className="font-bold text-white text-xl leading-none">H</span>
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">
          Horizon
        </span>
      </div>

      {/* Pesquisa global — desktop: barra expandida | mobile: ícone de lupa */}
      <div className="hidden lg:flex items-center flex-1 justify-center px-4 lg:px-8">
        {/* <GlobalSearch /> */}
      </div>

      <div className="flex items-center gap-3 lg:gap-6 flex-shrink-0">
        <Notifications />

        <div className="h-8 w-px bg-white/10" />

        <div className="flex items-center gap-3 pl-2 relative">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-white tracking-tight leading-none mb-1">
              {user?.name || "Admin User"}
            </p>
            {getRoleBadge()}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-11 h-11 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-gray-300 group hover:bg-primary/20 hover:border-primary/30 transition-all overflow-hidden z-[31] relative shadow-sm"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User
                size={22}
                className="group-hover:text-primary transition-colors"
              />
            )}
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMenuOpen(false)}
                  className="fixed inset-0 z-[50] bg-black/5 backdrop-blur-[2px]"
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-3 w-[280px] sm:w-64 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-primary/20 border border-gray-100 dark:border-slate-800 z-50 overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-50 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary shadow-md border border-gray-100 dark:border-slate-700 overflow-hidden">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={24} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-gray-900 dark:text-white text-base truncate leading-tight">
                          {user?.name || "Utilizador"}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate mt-0.5">
                          {role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all text-left"
                    >
                      <User size={18} className="text-gray-400" />
                      Ver perfil
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all text-left"
                    >
                      <SettingsIcon size={18} className="text-gray-400" />
                      Configurações
                    </button>
                    <button
                      onClick={() => {
                        navigate("/settings?tab=security");
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all text-left"
                    >
                      <Key size={18} className="text-gray-400" />
                      Alterar palavra-passe
                    </button>
                  </div>

                  <div className="p-2 border-t border-gray-50 dark:border-slate-800 bg-gray-50/20 dark:bg-slate-800/10">
                    <button
                      onClick={() => logout()}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all text-left"
                    >
                      <LogOut size={18} />
                      Terminar sessão
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
