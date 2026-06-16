import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  UserX,
  UserCheck,
  Edit2,
  Trash2,
  Mail,
  Phone,
  History,
  X,
  FileText,
  Filter,
} from "lucide-react";
import { Client, Appointment } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { useCurrency } from "../contexts/CurrencyContext";

export const API_URL = "http://localhost:3001";

export function Clients() {
  const { formatCurrency } = useCurrency();
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "Todos" | "Ativo" | "Inativo"
  >("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("Token não encontrado. Por favor faça login novamente");
          setLoading(false);
          return;
        }

        const headers = getAuthHeaders();

        const [clientsRes, apptsRes, servicesRes] = await Promise.all([
          fetch(`${API_URL}/api/clients`, { headers }),
          fetch(`${API_URL}/api/appointments`, { headers }),
          fetch(`${API_URL}/api/services`, { headers }),
        ]);

        if (!clientsRes.ok)
          throw new Error(`Erro ao carregar clientes: ${clientsRes.status}`);

        const clientsData = await clientsRes.json();
        setClients(Array.isArray(clientsData) ? clientsData : []);

        if (apptsRes.ok) {
          const apptsData = await apptsRes.json();
          setAppointments(Array.isArray(apptsData) ? apptsData : []);
        }

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(Array.isArray(servicesData) ? servicesData : []);
        }
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        toast.error(err.message || "Erro ao carregar dados");
        setClients([]);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredClients = clients.filter((c) => {
    const searchTerm = (search || "").toLowerCase();
    const name = (c.name || "").toLowerCase();
    const email = (c.email || "").toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    const matchesSearch =
      name.includes(searchTerm) ||
      email.includes(searchTerm) ||
      phone.includes(searchTerm);
    const matchesStatus = statusFilter === "Todos" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const clientHistory = appointments.filter(
    (a) => a.clientId === selectedClient?.id,
  );

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "Ativo" ? "Inativo" : "Ativo";
    try {
      const res = await fetch(`${API_URL}/api/clients/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setClients(
          clients.map((c) =>
            c.id === id ? { ...c, status: newStatus as any } : c,
          ),
        );
        toast.success(
          `Cliente ${newStatus === "Ativo" ? "ativado" : "inativado"}`,
        );
      }
    } catch (error) {
      toast.error("Erro ao atualizar status");
    }
  };

  const openHistory = (client: Client) => {
    setSelectedClient(client);
    setIsHistoryOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor, introduza um email válido");
      return;
    }
    if (formData.name.trim().length < 3) {
      toast.error("O nome deve ter pelo menos 3 caracteres");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingClient
        ? `${API_URL}/api/clients/${editingClient.id}`
        : `${API_URL}/api/clients`;
      const method = editingClient ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const data = await res.json();
        if (editingClient) {
          setClients(
            clients.map((c) => (c.id === editingClient.id ? data : c)),
          );
          toast.success("Cliente atualizado com sucesso!");
        } else {
          setClients([data, ...clients]);
          toast.success("Cliente registado com sucesso!");
        }
        closeModal();
      } else {
        const data = await res.json();
        toast.error(data.message || "Erro ao guardar cliente");
      }
    } catch (error) {
      toast.error(
        editingClient
          ? "Erro ao atualizar cliente"
          : "Erro ao registar cliente",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/clients/${clientToDelete}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setClients(clients.filter((c) => c.id !== clientToDelete));
        toast.success("Cliente eliminado");
        setClientToDelete(null);
      } else {
        toast.error("Erro ao eliminar cliente");
      }
    } catch (error) {
      toast.error("Erro ao eliminar cliente");
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      service: client.service || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ name: "", email: "", phone: "", service: "" });
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
            Gestão de Clientes
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium transition-colors">
            Controlo total da sua carteira de clientes
          </p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setFormData({ name: "", email: "", phone: "", service: "" });
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar clientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                showFilters
                  ? "bg-primary text-white"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700",
              )}
            >
              <Filter size={16} /> {showFilters ? "Fechar Filtros" : "Filtros"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-gray-100 dark:border-slate-800 px-6"
            >
              <div className="py-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  {["Todos", "Ativo", "Inativo"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status as any)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        statusFilter === status
                          ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                          : "text-gray-400",
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/50 transition-colors">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                  Cliente
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                  Contacto
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                  Serviço Principal
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                  Status
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
                  Acções
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800 transition-colors">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-110 transition-transform">
                        {(client.name || "S")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">
                          {client.name}
                        </p>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">
                          Membro desde{" "}
                          {new Date(client.createdAt).toLocaleDateString(
                            "pt-PT",
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <p className="text-xs font-bold flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Mail size={12} className="text-gray-400" />{" "}
                        {client.email}
                      </p>
                      <p className="text-xs font-bold flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Phone size={12} className="text-gray-400" />{" "}
                        {client.phone || "—"}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-black text-gray-600 dark:text-gray-300 uppercase text-center transition-colors">
                    {client.service || "—"}
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                        client.status === "Ativo"
                          ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400",
                      )}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all md:translate-x-4 md:group-hover:translate-x-0">
                      <button
                        onClick={() => openHistory(client)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                        title="Histórico de Serviços"
                      >
                        <History size={18} />
                      </button>
                      <button
                        onClick={() => toggleStatus(client.id, client.status)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                      >
                        {client.status === "Ativo" ? (
                          <UserX size={18} />
                        ) : (
                          <UserCheck size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(client)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setClientToDelete(client.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClients.length === 0 && !loading && (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-gray-200 transition-colors">
                <Users size={40} />
              </div>
              <p className="text-gray-400 dark:text-gray-500 font-bold">
                Nenhum cliente encontrado...
              </p>
            </div>
          )}
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-gray-50 dark:divide-slate-800 transition-colors">
          {filteredClients.map((client) => (
            <div key={client.id} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg sm:text-xl shadow-inner flex-shrink-0">
                  {(client.name || "S")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white transition-colors truncate">
                      {client.name}
                    </h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-wider flex-shrink-0",
                        client.status === "Ativo"
                          ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400",
                      )}
                    >
                      {client.status}
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5 truncate">
                    {client.service || "—"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl transition-colors">
                <div className="space-y-0.5">
                  <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Email
                  </p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate lowercase">
                    {client.email}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    Telefone
                  </p>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                    {client.phone || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:gap-3 pt-1">
                <button
                  onClick={() => openHistory(client)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary/5 text-primary rounded-xl font-black text-[10px] uppercase tracking-widest border border-primary/10"
                >
                  <History size={16} /> Histórico
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(client)}
                    className="p-3 bg-gray-50 dark:bg-slate-800 text-gray-400 hover:text-blue-500 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setClientToDelete(client.id)}
                    className="p-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && !loading && (
            <div className="p-10 text-center space-y-4">
              <Users size={40} className="mx-auto text-gray-200" />
              <p className="text-gray-400 font-bold">Sem resultados</p>
            </div>
          )}
        </div>
      </div>

      {/* History Drawer */}
      <AnimatePresence>
        {isHistoryOpen && selectedClient && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-[4px]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 200,
                mass: 0.5,
              }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 z-[51] shadow-2xl flex flex-col transition-colors"
            >
              <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-lg">
                    {(selectedClient.name || "S")
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                      {selectedClient.name}
                    </h2>
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      Histórico de Serviços
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-90"
                >
                  <X />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {clientHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 text-gray-100 dark:text-gray-700 rounded-full flex items-center justify-center transition-colors">
                      <History size={40} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 dark:text-white">
                        Histórico Limpo
                      </p>
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500">
                        Este cliente ainda não realizou marcações no sistema.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-slate-800">
                    {clientHistory
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .map((item, idx) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative pl-12"
                        >
                          <div
                            className={cn(
                              "absolute left-4 top-1 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-xl z-10 transition-colors",
                              item.status === "Concluído"
                                ? "bg-green-500 scale-110"
                                : item.status === "Cancelado"
                                  ? "bg-red-500"
                                  : "bg-blue-500",
                            )}
                          />
                          <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-[2rem] space-y-4 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black text-primary uppercase tracking-widest">
                                {item.service?.name}
                              </span>
                              <span
                                className={cn(
                                  "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter transition-colors",
                                  item.status === "Concluído"
                                    ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                                    : item.status === "Cancelado"
                                      ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                                      : "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
                                )}
                              >
                                {item.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">
                                    Data
                                  </p>
                                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors">
                                    {new Date(item.date).toLocaleDateString(
                                      "pt-PT",
                                    )}
                                  </p>
                                </div>
                                <div className="flex flex-col">
                                  <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">
                                    Hora
                                  </p>
                                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors">
                                    {item.time}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">
                                  Valor
                                </p>
                                <p className="text-sm font-black text-gray-900 dark:text-white transition-colors">
                                  {item.service
                                    ? formatCurrency(item.service.price)
                                    : "--"}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/20 space-y-4 transition-colors">
                <button
                  onClick={() => {
                    setIsHistoryOpen(false);
                    toast.success("A exportar relatório...");
                  }}
                  className="w-full py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-2xl font-black shadow-sm hover:shadow-md hover:border-primary transition-all flex items-center justify-center gap-3 text-sm"
                >
                  <FileText size={20} className="text-primary" />
                  Exportar Histórico (PDF)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Client Creation/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 sm:p-7 z-[51] shadow-2xl border border-gray-100 dark:border-slate-800 transition-colors max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-black mb-8 tracking-tight text-gray-900 dark:text-white transition-colors">
                {editingClient ? "Editar Cliente" : "Registar Novo Cliente"}
              </h2>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-2 tracking-widest">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm"
                    placeholder="Ex: João Silva"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-2 tracking-widest">
                    Email Profissional
                  </label>
                  <input
                    type="email"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm"
                    placeholder="joao@exemplo.com"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-2 tracking-widest">
                      Telefone
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm"
                      placeholder="912..."
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-2 tracking-widest">
                      Serviço Pretendido
                    </label>
                    <select
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm appearance-none"
                      value={formData.service}
                      onChange={(e) =>
                        setFormData({ ...formData, service: e.target.value })
                      }
                    >
                      <option value="" className="dark:bg-slate-900">
                        Selecione um serviço...
                      </option>
                      {services.map((s) => (
                        <option
                          key={s.id}
                          value={s.name}
                          className="dark:bg-slate-900"
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-4 font-black text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-all uppercase text-[10px] tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="uppercase text-[10px] tracking-widest">
                          A guardar...
                        </span>
                      </>
                    ) : (
                      <span className="uppercase text-[10px] tracking-widest">
                        {editingClient
                          ? "Guardar Alterações"
                          : "Salvar Registo"}
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={!!clientToDelete}
        onConfirm={handleDelete}
        onClose={() => setClientToDelete(null)}
        loading={deleting}
        title="Eliminar Cliente"
        description="Tem a certeza que deseja eliminar este cliente? Esta acção não pode ser desfeita e irá remover todos os dados associados."
      />
    </div>
  );
}
