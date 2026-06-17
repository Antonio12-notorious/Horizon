import React, { useState, useEffect } from "react";
import { FileText, Plus, Search, Download, Trash2, Filter } from "lucide-react";
import { cn } from "../lib/utils";
import { useCurrency } from "../contexts/CurrencyContext";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { API_URL } from "../config/api";
import { generateInvoicePDF } from "../lib/generateInvoice";


const authFetch = (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
};

type Client = { id: string; name: string; email: string; phone?: string };
type Service = { id: string; name: string; description?: string; price: number; status: string };
type InvoiceItem = { id: string; serviceId: string; quantity: number; unitPrice: number; subtotal: number; service: Service };
type Invoice = {
  id: string; clientId: string; client: Client; issueDate: string;
  dueDate?: string; total: number; notes?: string;
  status: "Pago" | "Pendente" | "Cancelado"; items: InvoiceItem[]; createdAt: string;
};

export function Invoices() {
  const { formatCurrency } = useCurrency();
const primaryColor =
  getComputedStyle(document.documentElement)
    .getPropertyValue("--color-primary")
    .trim() || "#2563eb";
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | "Pago" | "Pendente" | "Cancelado">("Todos");
  const [showFilters, setShowFilters] = useState(false);

  const initialFormData = {
    clientId: "", dueDate: "",
    date: new Date().toISOString().split("T")[0],
    notes: "", items: [] as { serviceId: string; quantity: number }[],
  };
  const [formData, setFormData] = useState(initialFormData);

  async function loadData() {
    try {
      setLoading(true);
      const [invoicesRes, clientsRes, servicesRes] = await Promise.all([
        authFetch(`${API_URL}/api/invoices`),
        authFetch(`${API_URL}/api/clients`),
        authFetch(`${API_URL}/api/services`),
      ]);
      const invoicesData = await invoicesRes.json();
      const clientsData = await clientsRes.json();
      const servicesData = await servicesRes.json();
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      setClients(Array.isArray(clientsData) ? clientsData : []);
      setServices(Array.isArray(servicesData) ? servicesData.filter((s: Service) => s.status === "Ativo") : []);
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const totalAmount = formData.items.reduce((acc, item) => {
    const service = services.find((s) => s.id === item.serviceId);
    return acc + (service?.price || 0) * item.quantity;
  }, 0);

  const addItem = () => {
    if (services.length === 0) { toast.error("Nenhum serviço ativo cadastrado"); return; }
    setFormData({ ...formData, items: [...formData.items, { serviceId: services[0].id, quantity: 1 }] });
  };

  const removeItem = (index: number) => {
    setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
  };

  const updateItem = (index: number, updates: Partial<{ serviceId: string; quantity: number }>) => {
    setFormData({ ...formData, items: formData.items.map((item, i) => i === index ? { ...item, ...updates } : item) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) { toast.error("Por favor, selecione um cliente"); return; }
    if (!formData.dueDate) { toast.error("Por favor, defina uma data de vencimento"); return; }
    if (formData.items.length === 0) { toast.error("Adicione pelo menos um item à fatura"); return; }
    setSubmitting(true);
    try {
      const res = await authFetch(`${API_URL}/api/invoices`, {
        method: "POST",
        body: JSON.stringify({ clientId: formData.clientId, issueDate: formData.date, dueDate: formData.dueDate, notes: formData.notes, items: formData.items }),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.message || "Erro ao emitir fatura");
      setInvoices([response.data, ...invoices]);
      setIsModalOpen(false);
      setFormData(initialFormData);
      toast.success("Fatura emitida com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao emitir fatura");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await authFetch(`${API_URL}/api/invoices/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.message || "Erro ao atualizar fatura");
      setInvoices(invoices.map((inv) => inv.id === id ? { ...inv, status: newStatus as Invoice["status"] } : inv));
      toast.success(`Fatura marcada como ${newStatus}`);
    } catch (error) {
      toast.error("Erro ao atualizar fatura");
    }
  };

  const handleDelete = async () => {
    if (!invoiceToDelete) return;
    setDeleting(true);
    try {
      const res = await authFetch(`${API_URL}/api/invoices/${invoiceToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao eliminar fatura");
      setInvoices(invoices.filter((i) => i.id !== invoiceToDelete));
      toast.success("Fatura eliminada");
      setInvoiceToDelete(null);
    } catch (error) {
      toast.error("Erro ao eliminar fatura");
    } finally {
      setDeleting(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const clientName = inv.client?.name || "";
    const matchesSearch = inv.id.toLowerCase().includes(searchQuery.toLowerCase()) || clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generatePDF = (invoice: Invoice) => {
    generateInvoicePDF(invoice, formatCurrency, primaryColor);
    toast.success("PDF gerado com sucesso!");
  };
  
  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <header className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white transition-colors truncate">
            Faturamento
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium transition-colors truncate">
            Controle as suas faturas
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Emitir Fatura</span>
        </button>
      </header>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Pesquisar faturas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                showFilters
                  ? "bg-primary text-white"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700",
              )}
            >
              <Filter size={16} />
              {showFilters ? "Fechar Filtros" : "Filtros"}
            </button>
            <button
              onClick={() => {
                if (filteredInvoices.length === 0) {
                  toast.error("Nenhuma fatura para exportar");
                  return;
                }
                const headers = [
                  "ID",
                  "Cliente",
                  "Total",
                  "Data Emissão",
                  "Vencimento",
                  "Status",
                ];
                const rows = filteredInvoices.map((inv) => [
                  inv.id,
                  inv.client?.name || "",
                  inv.total.toString(),
                  new Date(inv.issueDate).toLocaleDateString(),
                  inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "",
                  inv.status,
                ]);
                const csv = [headers, ...rows]
                  .map((r) => r.join(","))
                  .join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "faturas.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success("CSV exportado!");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 rounded-xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
            >
              <Download size={16} /> Exportar CSV
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
                  {["Todos", "Pago", "Pendente", "Cancelado"].map((status) => (
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

        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/50">
                {[
                  "ID Fatura",
                  "Cliente",
                  "Valor Total",
                  "Data Emissão",
                  "Status",
                  "Acções",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />{" "}
                      Carregando faturas...
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-gray-200">
                      <FileText size={40} />
                    </div>
                    <p className="text-gray-400 dark:text-gray-500 font-bold">
                      Nenhuma fatura encontrada...
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-gray-500 dark:text-gray-400 font-mono">
                        #{inv.id.slice(-6).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                        {inv.client?.name || "Cliente não encontrado"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Vence:{" "}
                        {inv.dueDate
                          ? new Date(inv.dueDate).toLocaleDateString()
                          : "Sem vencimento"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base font-black text-gray-900 dark:text-white">
                        {formatCurrency(inv.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={inv.status}
                        onChange={(e) => updateStatus(inv.id, e.target.value)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none cursor-pointer focus:ring-0",
                          inv.status === "Pago"
                            ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                            : inv.status === "Pendente"
                              ? "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400"
                              : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400",
                        )}
                      >
                        <option value="Pendente" className="dark:bg-slate-900">
                          Pendente
                        </option>
                        <option value="Pago" className="dark:bg-slate-900">
                          Pago
                        </option>
                        <option value="Cancelado" className="dark:bg-slate-900">
                          Cancelado
                        </option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generatePDF(inv)}
                          className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="Descarregar PDF"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          onClick={() => setInvoiceToDelete(inv.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-gray-50 dark:divide-slate-800">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-gray-400">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />{" "}
              Carregando...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">
              Sem faturas...
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div key={inv.id} className="p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-black text-gray-400 font-mono">
                      #{inv.id.slice(-6).toUpperCase()}
                    </span>
                    <p className="text-lg font-black text-gray-900 dark:text-white">
                      {inv.client?.name || "Cliente não encontrado"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-primary">
                      {formatCurrency(inv.total)}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 pt-2">
                  <select
                    value={inv.status}
                    onChange={(e) => updateStatus(inv.id, e.target.value)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border-none bg-gray-50 dark:bg-slate-800 cursor-pointer focus:ring-2 focus:ring-primary/10",
                      inv.status === "Pago"
                        ? "text-green-600 dark:text-green-400"
                        : inv.status === "Pendente"
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-red-600 dark:text-red-400",
                    )}
                  >
                    <option value="Pendente" className="dark:bg-slate-900">
                      Pendente
                    </option>
                    <option value="Pago" className="dark:bg-slate-900">
                      Pago
                    </option>
                    <option value="Cancelado" className="dark:bg-slate-900">
                      Cancelado
                    </option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => generatePDF(inv)}
                      className="p-3 bg-primary/5 text-primary rounded-xl"
                    >
                      <Download size={20} />
                    </button>
                    <button
                      onClick={() => setInvoiceToDelete(inv.id)}
                      className="p-3 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center py-1">
                  Vence:{" "}
                  {inv.dueDate
                    ? new Date(inv.dueDate).toLocaleDateString()
                    : "Sem vencimento"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 sm:p-7 z-[51] shadow-2xl border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText size={20} />
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  Emitir Nova Fatura
                </h2>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Cliente */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">
                    Cliente
                  </label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                  >
                    <option value="" className="dark:bg-slate-900">
                      Selecione o cliente...
                    </option>
                    {clients.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        className="dark:bg-slate-900"
                      >
                        {c.name}
                        {c.email ? ` — ${c.email}` : ""}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && !loading && (
                    <p className="text-[10px] text-red-400 ml-1">
                      Nenhum cliente encontrado. Crie um cliente primeiro.
                    </p>
                  )}
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">
                      Data Emissão
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">
                      Vencimento
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
                    />
                  </div>
                </div>

                {/* Itens */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">
                    Itens / Serviços
                  </label>
                  <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-3xl space-y-3 border border-gray-100 dark:border-slate-800">
                    {formData.items.length === 0 && (
                      <p className="text-[10px] text-gray-400 text-center py-2 uppercase tracking-widest">
                        Nenhum item adicionado
                      </p>
                    )}
                    {formData.items.map((item, index) => {
                      const service = services.find(
                        (s) => s.id === item.serviceId,
                      );
                      const subtotal = (service?.price || 0) * item.quantity;
                      return (
                        <div
                          key={index}
                          className="flex flex-wrap sm:flex-nowrap items-center gap-2 pb-3 border-b border-gray-200/50 dark:border-slate-700/50 last:border-0 last:pb-0"
                        >
                          <select
                            value={item.serviceId}
                            onChange={(e) =>
                              updateItem(index, { serviceId: e.target.value })
                            }
                            className="flex-1 min-w-[120px] bg-white dark:bg-slate-800 border-none text-xs font-black dark:text-white focus:ring-0 rounded-xl px-3 py-2 shadow-sm"
                          >
                            {services.map((s) => (
                              <option
                                key={s.id}
                                value={s.id}
                                className="dark:bg-slate-900"
                              >
                                {s.name} — {formatCurrency(s.price)}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, {
                                  quantity: parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-14 bg-white dark:bg-slate-800 border-none text-xs font-black text-center dark:text-white focus:ring-0 rounded-xl px-2 py-2 shadow-sm"
                            />
                            <div className="min-w-[90px] text-right font-black text-xs text-gray-900 dark:text-white">
                              {formatCurrency(subtotal)}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="p-2 text-red-400 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={addItem}
                      disabled={services.length === 0}
                      className="text-[9px] font-black text-primary uppercase tracking-widest hover:bg-primary/5 px-3 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + Adicionar Item
                    </button>
                  </div>
                  {services.length === 0 && !loading && (
                    <p className="text-[10px] text-red-400 ml-1">
                      Nenhum serviço ativo. Crie um serviço primeiro.
                    </p>
                  )}
                </div>

                {/* Notas */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Notas adicionais da fatura..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm min-h-[80px]"
                  />
                </div>

                {/* Total + Botões */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                      Total
                    </p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setFormData(initialFormData);
                      }}
                      className="flex-1 sm:flex-none px-6 py-3 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 sm:flex-none px-8 py-3 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {submitting ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Emitir"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={!!invoiceToDelete}
        onClose={() => setInvoiceToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar Fatura"
        description="Tem a certeza que deseja eliminar esta fatura? Esta acção não pode ser desfeita."
      />
    </div>
  );
}