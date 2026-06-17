import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trash2,
  Tag,
} from "lucide-react";
import { Appointment, Client, Service } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { useCurrency } from "../contexts/CurrencyContext";

export const API_URL = "http://localhost:3001";

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// ─── Calendário em tempo real ────────────────────────────────────────────────
function CalendarCard({ appointments }: { appointments: Appointment[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Dias do mês com offset para começar na segunda-feira
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // 0=Dom → ajustar para 0=Seg
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [month, year]);

  // Conjunto de dias que têm agendamentos neste mês/ano
  const daysWithAppointments = useMemo(() => {
    const set = new Set<number>();
    appointments.forEach((a) => {
      const d = new Date(a.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [appointments, year, month]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((d, i) => (
          <span
            key={i}
            className="text-[10px] font-bold text-gray-400 dark:text-gray-500"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} />;
          }

          const hasAppt = daysWithAppointments.has(day);
          const todayDay = isToday(day);

          return (
            <div
              key={day}
              className={cn(
                "aspect-square rounded-xl text-sm font-medium flex flex-col items-center justify-center relative transition-all",
                todayDay
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : hasAppt
                    ? "bg-primary/10 dark:bg-primary/20 text-primary font-bold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800",
              )}
            >
              {day}
              {/* Ponto indicador de agendamento */}
              {hasAppt && !todayDay && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="mt-4 flex items-center gap-3 text-[10px] text-gray-400 font-medium">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          Hoje
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary/30 inline-block" />
          Com agendamento
        </span>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function Appointments() {
  const { formatCurrency } = useCurrency();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
    null,
  );

  const [activeFilters, setActiveFilters] = useState<string[]>([
    "Pendente",
    "Concluído",
    "Cancelado",
  ]);

  const [formData, setFormData] = useState({
    clientId: "",
    serviceId: "",
    date: "",
    time: "",
    status: "Pendente",
  });

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    const headers = getAuthHeaders();

    Promise.all([
      fetch(`${API_URL}/api/appointments`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/api/clients`, { headers }).then((r) => r.json()),
      fetch(`${API_URL}/api/services`, { headers }).then((r) => r.json()),
    ])
      .then(([apptData, clientsData, servicesData]) => {
        setAppointments(Array.isArray(apptData) ? apptData : []);
        setClients(Array.isArray(clientsData) ? clientsData : []);
        setServices(Array.isArray(servicesData) ? servicesData : []);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar dados");
        setIsLoading(false);
      });
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/appointments/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, status: newStatus as any } : a,
          ),
        );
        toast.success(`Marcação ${newStatus.toLowerCase()}`);
      }
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async () => {
    if (!appointmentToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/appointments/${appointmentToDelete}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      if (res.ok) {
        setAppointments((prev) =>
          prev.filter((a) => a.id !== appointmentToDelete),
        );
        toast.success("Marcação eliminada");
        setAppointmentToDelete(null);
      }
    } catch {
      toast.error("Erro ao eliminar marcação");
    } finally {
      setDeleting(false);
    }
  };

  const filteredAppointments = appointments.filter((a) =>
    activeFilters.includes(a.status),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId)
      return toast.error("Por favor, selecione um cliente");
    if (!formData.serviceId)
      return toast.error("Por favor, selecione um serviço");
    if (!formData.date || !formData.time)
      return toast.error("Por favor, preencha a data e a hora");

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/appointments`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        const newAppt = data.data || data;

        setAppointments((prev) => [
          {
            ...newAppt,
            client: clients.find((c) => c.id === formData.clientId),
            service: services.find((s) => s.id === formData.serviceId),
          },
          ...prev,
        ]);

        setIsModalOpen(false);
        setFormData({
          clientId: "",
          serviceId: "",
          date: "",
          time: "",
          status: "Pendente",
        });
        toast.success("Agendamento marcado com sucesso!");
      } else {
        const data = await res.json();
        toast.error(data.message || "Erro ao marcar agendamento");
      }
    } catch {
      toast.error("Erro ao marcar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white transition-colors truncate">
            Agendamento
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm font-medium transition-colors truncate">
            Controlo total de agendamentos e horarios
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-shrink-0 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Novo Agendamento</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar — Calendário real + Filtros */}
        <div className="lg:col-span-1 space-y-6">
          {/* ✅ Calendário com dados reais */}
          <CalendarCard appointments={appointments} />

          {/* Filtros */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="font-bold mb-4 text-gray-900 dark:text-white">
              Filtros
            </h3>
            <div className="space-y-2">
              {["Pendente", "Concluído", "Cancelado"].map((status) => (
                <label
                  key={status}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-primary focus:ring-primary dark:bg-slate-800"
                    checked={activeFilters.includes(status)}
                    onChange={() =>
                      setActiveFilters((prev) =>
                        prev.includes(status)
                          ? prev.filter((f) => f !== status)
                          : [...prev, status],
                      )
                    }
                  />
                  {status}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de marcações */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
            <h2 className="font-bold px-2 text-gray-900 dark:text-white">
              Marcações
            </h2>
            <button className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary transition-colors">
              <Filter size={16} />
              Ordenar por hora
            </button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400 italic">
                A carregar agendamentos...
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800 text-center text-gray-400 transition-colors">
                Nenhum agendamento encontrado
              </div>
            ) : (
              filteredAppointments.map((appt, index) => (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center justify-center w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-2xl group-hover:bg-primary/5 dark:group-hover:bg-primary/10 transition-colors">
                      <span className="text-sm font-bold text-gray-400 dark:text-gray-500 group-hover:text-primary/60">
                        {appt.time?.split(":")[0]}
                      </span>
                      <span className="text-xl font-black text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                        {appt.time?.split(":")[1]}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white transition-colors">
                        {appt.client?.name || "—"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 transition-colors">
                        <Tag size={14} /> {appt.service?.name || "—"}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {new Date(appt.date).toLocaleDateString("pt-PT")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 justify-between md:justify-end">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase transition-colors">
                        Contacto
                      </p>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                        {appt.client?.phone || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors",
                          appt.status === "Concluído"
                            ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                            : appt.status === "Cancelado"
                              ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                              : "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
                        )}
                      >
                        {appt.status}
                      </span>
                      <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => updateStatus(appt.id, "Concluído")}
                          className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl transition-all"
                          title="Marcar como Concluído"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                        <button
                          onClick={() => updateStatus(appt.id, "Cancelado")}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                          title="Cancelar Marcação"
                        >
                          <XCircle size={20} />
                        </button>
                        <button
                          onClick={() => setAppointmentToDelete(appt.id)}
                          className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                          title="Eliminar"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de criação */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 sm:p-7 z-[51] shadow-2xl border border-gray-100 dark:border-slate-800 transition-colors max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
                  <CalendarIcon size={24} />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white transition-colors">
                  Novo Agendamento
                </h2>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-2 tracking-widest transition-colors">
                    Escolher Cliente
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm appearance-none"
                    required
                    value={formData.clientId}
                    onChange={(e) =>
                      setFormData({ ...formData, clientId: e.target.value })
                    }
                  >
                    <option value="" className="dark:bg-slate-900">
                      Selecione um cliente...
                    </option>
                    {clients.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        className="dark:bg-slate-900"
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-2 tracking-widest transition-colors">
                    Serviço Pretendido
                  </label>
                  <select
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm appearance-none"
                    required
                    value={formData.serviceId}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceId: e.target.value })
                    }
                  >
                    <option value="" className="dark:bg-slate-900">
                      Selecione um serviço...
                    </option>
                    {services.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        className="dark:bg-slate-900"
                      >
                        {s.name} ({formatCurrency(s.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-2 tracking-widest transition-colors">
                      Data
                    </label>
                    <input
                      type="date"
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-2 tracking-widest transition-colors">
                      Hora
                    </label>
                    <input
                      type="time"
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 dark:text-white border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm"
                      required
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-primary text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>A agendar...</span>
                      </>
                    ) : (
                      "Confirmar Agendamento"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={!!appointmentToDelete}
        onClose={() => setAppointmentToDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar Agendamento"
        description="Tem a certeza que deseja eliminar esta marcação? Esta acção não pode ser desfeita."
      />
    </div>
  );
}
