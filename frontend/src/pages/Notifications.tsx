import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Search,
  RefreshCw,
} from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "react-hot-toast";
import { API_URL } from "../config/api";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "success" | "warning" | "info";
  category: string;
  read: boolean;
  priority: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "unread" | "Faturas" | "Agenda" | "Clientes"
  >("all");
  const [search, setSearch] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem("notifications_read");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const isRead = (n: Notification) => readIds.has(n.id) || n.read;

  const markAsRead = (id: string) => {
    const updated = new Set(readIds).add(id);
    setReadIds(updated);
    localStorage.setItem("notifications_read", JSON.stringify([...updated]));
  };

  const markAllRead = () => {
    const updated = new Set([...readIds, ...notifications.map((n) => n.id)]);
    setReadIds(updated);
    localStorage.setItem("notifications_read", JSON.stringify([...updated]));
    toast.success("Todas marcadas como lidas");
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    markAsRead(id);
    toast.success("Notificação removida");
  };

  const clearAll = () => {
    const updated = new Set([...readIds, ...notifications.map((n) => n.id)]);
    setReadIds(updated);
    localStorage.setItem("notifications_read", JSON.stringify([...updated]));
    setNotifications([]);
    toast.success("Notificações limpas");
  };

  const categories = ["all", "unread", "Faturas", "Agenda", "Clientes"];

  const filtered = notifications.filter((n) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "unread"
          ? !isRead(n)
          : n.category === filter;
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Centro de Notificações
          </h2>
          <p className="text-gray-400 text-sm mt-1 font-medium">
            {unreadCount > 0
              ? `${unreadCount} notificação${unreadCount !== 1 ? "ões" : ""} não lida${unreadCount !== 1 ? "s" : ""}`
              : "Tudo em dia"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchNotifications}
            className="p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-400 hover:text-primary rounded-2xl transition-all"
            title="Actualizar"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={markAllRead}
            className="px-5 py-3 bg-white dark:bg-slate-800 text-primary border border-primary/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/5 transition-all"
          >
            Marcar lidas
          </button>
          <button
            onClick={clearAll}
            className="px-5 py-3 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all"
          >
            Limpar tudo
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filtros */}
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-slate-800 rounded-xl flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat as any)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  filter === cat
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-gray-400 hover:text-gray-600",
                )}
              >
                {cat === "all"
                  ? "Todas"
                  : cat === "unread"
                    ? `Não lidas ${unreadCount > 0 ? `(${unreadCount})` : ""}`
                    : cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-primary/10 font-bold text-sm"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {loading ? (
            <div className="p-16 flex items-center justify-center gap-3 text-gray-400">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              A carregar notificações...
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.length > 0 ? (
                filtered.map((n) => (
                  <motion.div
                    layout
                    key={n.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className={cn(
                      "p-6 flex flex-col sm:flex-row gap-4 group relative transition-colors",
                      !isRead(n)
                        ? "bg-primary/5 dark:bg-primary/10"
                        : "hover:bg-gray-50 dark:hover:bg-slate-800/50",
                    )}
                  >
                    {/* Ícone */}
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm",
                        n.type === "success"
                          ? "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                          : n.type === "warning"
                            ? "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
                      )}
                    >
                      {n.type === "success" ? (
                        <CheckCircle2 size={22} />
                      ) : n.type === "warning" ? (
                        <AlertCircle size={22} />
                      ) : (
                        <Clock size={22} />
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                          {n.category}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          {n.time}
                        </span>
                        {!isRead(n) && (
                          <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                            Nova
                          </span>
                        )}
                      </div>
                      <h3 className="font-black text-gray-900 dark:text-white tracking-tight">
                        {n.title}
                      </h3>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {n.description}
                      </p>
                    </div>

                    {/* Acções */}
                    <div className="flex items-center gap-2 sm:self-center opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isRead(n) && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="p-3 bg-white dark:bg-slate-800 text-gray-400 hover:text-primary rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-all"
                          title="Marcar como lida"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="p-3 bg-white dark:bg-slate-800 text-gray-400 hover:text-red-500 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 transition-all"
                        title="Remover"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-gray-200 dark:text-slate-700">
                    <Bell size={40} />
                  </div>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                    {search
                      ? "Nenhuma notificação encontrada"
                      : "Sem notificações de momento"}
                  </p>
                  {!search && (
                    <p className="text-xs text-gray-400">
                      As notificações aparecem automaticamente com a actividade
                      do sistema
                    </p>
                  )}
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
