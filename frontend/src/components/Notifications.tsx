import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, AlertCircle, Clock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { API_URL } from '../config/api';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info';
  category: string;
  read: boolean;
  priority: number;
}

export function Notifications() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('notifications_read');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Actualiza a cada 2 minutos
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = (id: string) => {
    setRemovingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      const updated = new Set(readIds).add(id);
      setReadIds(updated);
      localStorage.setItem('notifications_read', JSON.stringify([...updated]));
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  };

  const removeNotification = (id: string) => {
    setRemovingIds((prev) => new Set([...prev, id]));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      markAsRead(id);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 200);
  };

  const clearAll = () => {
    const allIds = new Set([...readIds, ...notifications.map((n) => n.id)]);
    setReadIds(allIds);
    localStorage.setItem('notifications_read', JSON.stringify([...allIds]));
    setNotifications([]);
    setIsOpen(false);
  };

  const isRead = (n: Notification) => readIds.has(n.id) || n.read;
  const unreadCount = notifications.filter((n) => !isRead(n)).length;
  const unreadNotifications = notifications.filter((n) => !isRead(n));

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="p-2.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all relative group z-[31]"
      >
        <Bell
          size={20}
          className="group-hover:rotate-12 transition-transform"
        />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-sidebar animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[50] bg-black/5 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="fixed left-1/2 -translate-x-1/2 mt-3 md:left-auto md:translate-x-0 md:right-0 w-80 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-black/10 border border-gray-100 dark:border-slate-800 z-[51] overflow-hidden"
            >
              <div className="p-5 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white tracking-tight">
                    Notificações
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                    {unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-md hover:bg-red-100 transition-colors"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {unreadNotifications.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {unreadNotifications.map((n) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "p-4 border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group relative bg-primary/5 dark:bg-primary/10",
                          removingIds.has(n.id) && "opacity-50",
                        )}
                      >
                        <div className="flex gap-3">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                              n.type === "success"
                                ? "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                                : n.type === "warning"
                                  ? "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
                            )}
                          >
                            {n.type === "success" ? (
                              <CheckCircle2 size={16} />
                            ) : n.type === "warning" ? (
                              <AlertCircle size={16} />
                            ) : (
                              <Clock size={16} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                                {n.category}
                              </span>
                              <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            </div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {n.description}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                              {n.time}
                            </p>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="p-1 text-primary hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all active:scale-95"
                            title="Marcar como lida"
                          >
                            <CheckCircle2 size={13} />
                          </button>
                          <button
                            onClick={() => removeNotification(n.id)}
                            className="p-1 text-red-400 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all active:scale-95"
                            title="Remover"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <div className="p-10 text-center">
                    <Bell
                      className="mx-auto text-gray-200 dark:text-slate-700 mb-2"
                      size={32}
                    />
                    <p className="text-sm font-bold text-gray-400">
                      Sem notificações não lidas
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-50 dark:border-slate-800 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-black text-gray-400 hover:text-primary transition-colors tracking-widest uppercase"
                >
                  Ver tudo →
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}