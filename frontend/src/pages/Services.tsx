import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Search,
  Tag,
  Filter,
} from "lucide-react";
import { Service } from "../types";
import { cn } from "../lib/utils";
import { useCurrency } from "../contexts/CurrencyContext";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";

export const API_URL = "http://localhost:3001";

export function Services() {
  const { formatCurrency } = useCurrency();

  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    | "Todos"
    | "Desenvolvimento"
    | "Email Corporativo"
    | "Assistência Técnica"
    | "Segurança Cibernética"
    | "Redes"
    | "Cloud e Servidores"
  >("Todos");
  const [showFilters, setShowFilters] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    description: "",
    category: "Desenvolvimento",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/api/services`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setServices)
      .catch(() => toast.error("Erro ao carregar serviços"));
  }, []);

 const filteredServices = services.filter((s) => {
   const matchesSearch =
     (s.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
     (s.description?.toLowerCase() || "").includes(search.toLowerCase());
   const matchesCategory =
     categoryFilter === "Todos" || (s as any).category === categoryFilter;
   return matchesSearch && matchesCategory;
 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim().length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres");
      return;
    }
    if (formData.price <= 0) {
      toast.error("O preço deve ser superior a 0");
      return;
    }
    setSubmitting(true);
    try {
      const url = editingService
        ? `${API_URL}/api/services/${editingService.id}`
        : `${API_URL}/api/services`;
      const method = editingService ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const data = await res.json();
        const newService = data.data || data;
        if (editingService) {
          setServices(
            services.map((s) => (s.id === editingService.id ? newService : s)),
          );
          toast.success("Serviço atualizado!");
        } else {
          setServices([newService, ...services]);
          toast.success("Serviço adicionado!");
        }
        closeModal();
      }
    } catch (error) {
      toast.error(editingService ? "Erro ao atualizar" : "Erro ao adicionar");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/api/services/${serviceToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setServices(services.filter((s) => s.id !== serviceToDelete));
        toast.success("Serviço eliminado");
        setServiceToDelete(null);
      }
    } catch {
      toast.error("Erro ao eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const startEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price,
      description: service.description || "",
      category: (service as any).category || "Desenvolvimento",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setFormData({
      name: "",
      price: 0,
      description: "",
      category: "Desenvolvimento",
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Serviços & Produtos
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Gerencie o seu catálogo de oferta
          </p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setFormData({
              name: "",
              price: 0,
              description: "",
              category: "Desenvolvimento",
            });
            setIsModalOpen(true);
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <Plus size={20} /> Novo Item
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Pesquisar no catálogo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
              />
            </div>
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
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-gray-50 dark:border-slate-800 px-6"
              >
                <div className="py-4 block gap-2 p-1 bg-gray-50 dark:bg-slate-800 rounded-xl w-fit">
                  {[
                    "Todos",
                    "Desenvolvimento",
                    "Email Corporativo",
                    "Assistência Técnica",
                    "Segurança Cibernética",
                    "Redes",
                    "Cloud e Servidores",
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat as any)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        categoryFilter === cat
                          ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                          : "text-gray-400",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {filteredServices.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all overflow-hidden"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(service)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setServiceToDelete(service.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mt-2">
                  {service.description}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">
                    Preço
                  </p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">
                    {formatCurrency(service.price)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                  <Tag size={18} />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 sm:p-7 z-[51] shadow-2xl border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                {editingService ? "Editar Serviço" : "Novo Item"}
              </h2>
              <form className="space-y-4 font-sans" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                    Nome do Item
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                      Preço
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                      Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option className="dark:bg-slate-900">
                        Desenvolvimento
                      </option>
                      <option className="dark:bg-slate-900">
                        Email Corporativo
                      </option>
                      <option className="dark:bg-slate-900">
                        Assistência Técnica
                      </option>
                      <option className="dark:bg-slate-900">
                        Segurança Cibernética
                      </option>
                      <option className="dark:bg-slate-900">Redes</option>
                      <option className="dark:bg-slate-900">
                        Cloud e Servidores
                      </option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 h-24 resize-none"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-4 font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl uppercase text-[11px] tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-70 uppercase text-[11px] tracking-widest"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>A guardar...</span>
                      </>
                    ) : editingService ? (
                      "Guardar Alterações"
                    ) : (
                      "Salvar Item"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={!!serviceToDelete}
        onClose={() => setServiceToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar Serviço"
        description="Tem a certeza que deseja eliminar este serviço? Esta acção não pode ser desfeita."
      />
    </div>
  );
}
