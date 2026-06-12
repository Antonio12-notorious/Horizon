// Este ficheiro re-exporta o painel de gestão de utilizadores corporativo
// O componente completo está implementado abaixo

import React, { useState, useEffect, useCallback } from "react";
import {
  Users as UsersIcon,
  Plus,
  Search,
  MoreVertical,
  Shield,
  ShieldOff,
  Lock,
  Unlock,
  RefreshCw,
  Eye,
  X,
  Check,
  Copy,
  UserCheck,
  UserX,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { useAuth, UserRole } from "../contexts/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "ATIVO" | "INATIVO" | "BLOQUEADO" | "PENDENTE";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: Status;
  department?: string;
  contact?: string;
  mustChangePassword: boolean;
  lastLoginAt?: string;
  createdAt: string;
  createdBy?: { id: string; name: string };
}

interface Credentials {
  email: string;
  tempPassword: string;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

const ROLES: { value: UserRole; label: string; color: string }[] = [
  {
    value: "ADMIN",
    label: "Admin",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  {
    value: "GERENTE",
    label: "Gerente",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    value: "OPERADOR",
    label: "Operador",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  {
    value: "VISUALIZADOR",
    label: "Visualizador",
    color: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400",
  },
];

const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; icon: React.ReactNode }
> = {
  ATIVO: {
    label: "Activo",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: <UserCheck size={12} />,
  },
  INATIVO: {
    label: "Inactivo",
    color: "bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400",
    icon: <UserX size={12} />,
  },
  BLOQUEADO: {
    label: "Bloqueado",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: <Lock size={12} />,
  },
  PENDENTE: {
    label: "Pendente",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: <AlertTriangle size={12} />,
  },
};

// ─── Hook API ─────────────────────────────────────────────────────────────────

function useUsersApi() {
  const token = () => localStorage.getItem("token");
  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  });

  const fetchUsers = async (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    const res = await fetch(`${API_URL}/api/users${qs}`, {
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || "Erro ao carregar utilizadores");
    return data.users as UserItem[];
  };

  const createUser = async (body: object) => {
    const res = await fetch(`${API_URL}/api/users`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao criar utilizador");
    return data as { user: UserItem; credentials: Credentials };
  };

  const updateUser = async (id: string, body: object) => {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao actualizar");
    return data.user as UserItem;
  };

  const setStatus = async (
    id: string,
    action: "activate" | "deactivate" | "block",
  ) => {
    const res = await fetch(`${API_URL}/api/users/${id}/${action}`, {
      method: "PATCH",
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao alterar estado");
    return data.user as UserItem;
  };

  const resetPassword = async (id: string) => {
    const res = await fetch(`${API_URL}/api/users/${id}/reset-password`, {
      method: "PATCH",
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao redefinir senha");
    return data.credentials as Credentials;
  };

  return { fetchUsers, createUser, updateUser, setStatus, resetPassword };
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function Users() {
  const { user: me } = useAuth();
  const api = useUsersApi();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    department: "",
    role: "OPERADOR" as UserRole,
  });

 const load = useCallback(async () => {
  setIsLoading(true);
  try {
    const params: Record<string, string> = {};
    if (search)       params.search = search;
    if (filterRole)   params.role   = filterRole;
    if (filterStatus) params.status = filterStatus;
    const data = await api.fetchUsers(params);
    console.log("USERS DATA:", data); // debug temporário
    setUsers(Array.isArray(data) ? data : []);  // ← garantir array
  } catch (err: any) {
    console.error("LOAD ERROR:", err); // debug temporário
    toast.error(err.message);
    setUsers([]); // ← garantir array mesmo em erro
  } finally {
    setIsLoading(false);
  }
}, [search, filterRole, filterStatus]);

useEffect(() => {
    load();
}, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.createUser(form);
      setUsers((prev) => [result.user, ...prev]);
      setCredentials(result.credentials);
      setShowCreate(false);
      setForm({
        name: "",
        email: "",
        contact: "",
        department: "",
        role: "OPERADOR",
      });
      toast.success("Utilizador criado com sucesso");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    try {
      const updated = await api.updateUser(editTarget.id, {
        name: editTarget.name,
        email: editTarget.email,
        contact: editTarget.contact,
        department: editTarget.department,
        role: editTarget.role,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
      );
      setEditTarget(null);
      toast.success("Utilizador actualizado");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleStatus = async (
    id: string,
    action: "activate" | "deactivate" | "block",
  ) => {
    try {
      const updated = await api.setStatus(id, action);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id ? { ...u, status: updated.status } : u,
        ),
      );
      setMenuOpen(null);
      toast.success(
        action === "activate"
          ? "Conta activada"
          : action === "deactivate"
            ? "Conta desactivada"
            : "Conta bloqueada",
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResetPassword = async (id: string) => {
    try {
      const creds = await api.resetPassword(id);
      setCredentials(creds);
      setMenuOpen(null);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, mustChangePassword: true } : u)),
      );
      toast.success("Senha redefinida");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getRoleConfig = (role: UserRole) =>
    ROLES.find((r) => r.value === role)!;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Gestão de Utilizadores
          </h1>
          <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
            {users.length} utilizador{users.length !== 1 ? "es" : ""} registado
            {users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
        >
          <Plus size={16} /> Novo utilizador
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome ou email..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-normal placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
        >
          <option value="">Todos os perfis</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
        >
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-gray-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <UsersIcon size={40} className="mb-3 opacity-30" />
            <p className="font-bold text-sm">Nenhum utilizador encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-slate-800">
                  {[
                    "Utilizador",
                    "Perfil",
                    "Departamento",
                    "Estado",
                    "Último acesso",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-6 py-4 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const roleConf = getRoleConfig(u.role);
                  const statusConf = STATUS_CONFIG[u.status];
                  const isMe = u.id === me?.id;

                  return (
                    <tr
                      key={u.id}
                      className="border-b border-gray-50 dark:border-slate-800/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                              {u.name}
                              {isMe && (
                                <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-black">
                                  Você
                                </span>
                              )}
                              {u.mustChangePassword && (
                                <span className="text-[9px] bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full font-black">
                                  ⚠ senha temp.
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-black ${roleConf.color}`}
                        >
                          <Shield size={10} /> {roleConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          {u.department || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-black ${statusConf.color}`}
                        >
                          {statusConf.icon} {statusConf.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {u.lastLoginAt
                            ? new Date(u.lastLoginAt).toLocaleString("pt-PT", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Nunca"}
                        </span>
                      </td>
                      <td className="px-6 py-4 relative">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setMenuOpen(menuOpen === u.id ? null : u.id)
                            }
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-400"
                          >
                            <MoreVertical size={16} />
                          </button>
                          <AnimatePresence>
                            {menuOpen === u.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden"
                              >
                                <button
                                  onClick={() => {
                                    setEditTarget(u);
                                    setMenuOpen(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                  <Eye size={14} /> Editar dados
                                </button>
                                {u.status !== "ATIVO" && (
                                  <button
                                    onClick={() =>
                                      handleStatus(u.id, "activate")
                                    }
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                  >
                                    <Unlock size={14} /> Activar conta
                                  </button>
                                )}
                                {u.status === "ATIVO" && !isMe && (
                                  <button
                                    onClick={() =>
                                      handleStatus(u.id, "deactivate")
                                    }
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                                  >
                                    <ShieldOff size={14} /> Desactivar conta
                                  </button>
                                )}
                                {u.status !== "BLOQUEADO" && !isMe && (
                                  <button
                                    onClick={() => handleStatus(u.id, "block")}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <Lock size={14} /> Bloquear conta
                                  </button>
                                )}
                                <div className="border-t border-gray-100 dark:border-slate-700" />
                                <button
                                  onClick={() => handleResetPassword(u.id)}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                >
                                  <RefreshCw size={14} /> Redefinir senha
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal criar */}
      <AnimatePresence>
        {showCreate && (
          <Modal title="Novo utilizador" onClose={() => setShowCreate(false)}>
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Nome completo">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="João Silva"
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Email corporativo">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="joao@empresa.com"
                  required
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Contacto">
                  <input
                    value={form.contact}
                    onChange={(e) =>
                      setForm({ ...form, contact: e.target.value })
                    }
                    placeholder="+258 84 000 0000"
                    className={inputClass}
                  />
                </Field>
                <Field label="Departamento">
                  <input
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    placeholder="Ex: Financeiro"
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Perfil de acesso">
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as UserRole })
                  }
                  className={inputClass}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium bg-gray-50 dark:bg-slate-800 rounded-xl px-4 py-3">
                🔐 Uma senha temporária será gerada automaticamente. O
                utilizador será obrigado a alterá-la no primeiro login.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className={btnSecondary}
                >
                  Cancelar
                </button>
                <button type="submit" className={btnPrimary}>
                  Criar utilizador
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal editar */}
      <AnimatePresence>
        {editTarget && (
          <Modal title="Editar utilizador" onClose={() => setEditTarget(null)}>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Field label="Nome completo">
                <input
                  value={editTarget.name}
                  onChange={(e) =>
                    setEditTarget({ ...editTarget, name: e.target.value })
                  }
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={editTarget.email}
                  onChange={(e) =>
                    setEditTarget({ ...editTarget, email: e.target.value })
                  }
                  required
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Contacto">
                  <input
                    value={editTarget.contact ?? ""}
                    onChange={(e) =>
                      setEditTarget({ ...editTarget, contact: e.target.value })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Departamento">
                  <input
                    value={editTarget.department ?? ""}
                    onChange={(e) =>
                      setEditTarget({
                        ...editTarget,
                        department: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Perfil de acesso">
                <select
                  value={editTarget.role}
                  onChange={(e) =>
                    setEditTarget({
                      ...editTarget,
                      role: e.target.value as UserRole,
                    })
                  }
                  className={inputClass}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className={btnSecondary}
                >
                  Cancelar
                </button>
                <button type="submit" className={btnPrimary}>
                  Guardar alterações
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Modal credenciais */}
      <AnimatePresence>
        {credentials && (
          <Modal
            title="Credenciais geradas"
            onClose={() => setCredentials(null)}
          >
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  ⚠️ Copie e distribua estas credenciais de forma segura. A
                  senha não será exibida novamente.
                </p>
              </div>
              <CredentialRow label="Email" value={credentials.email} />
              <CredentialRow
                label="Senha temporária"
                value={credentials.tempPassword}
                secret
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                O utilizador será obrigado a alterar a senha no primeiro login.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const subject = encodeURIComponent(
                      "Credenciais de Acesso ao Sistema",
                    );
                    const body = encodeURIComponent(
                      `Olá,\n\nAs suas credenciais de acesso ao sistema foram criadas.\n\n📧 Email: ${credentials.email}\n🔐 Senha temporária: ${credentials.tempPassword}\n\n⚠️ Por segurança, será obrigado a alterar a senha no primeiro login.\n\nCumprimentos,\nEquipa de TI`,
                    );
                    window.open(
                      `mailto:${credentials.email}?subject=${subject}&body=${body}`,
                      "_blank",
                    );
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-all"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Enviar por Email
                </button>
                <button
                  onClick={() => setCredentials(null)}
                  className={btnPrimary}
                >
                  <Check size={14} /> Confirmar
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-400"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function CredentialRow({
  label,
  value,
  secret,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success("Copiado!");
  };

  return (
    <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-2xl px-4 py-3">
      <div>
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-900 dark:text-white font-mono mt-0.5">
          {secret && !revealed ? "••••••••••••" : value}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {secret && (
          <button
            onClick={() => setRevealed(!revealed)}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-400"
          >
            {revealed ? <X size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button
          onClick={copy}
          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-gray-400"
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:font-normal placeholder:text-gray-300 dark:placeholder:text-gray-600";
const btnPrimary =
  "flex-1 flex items-center gap-2 py-3 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] justify-center";
const btnSecondary =
  "flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-2xl font-black text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-center";
