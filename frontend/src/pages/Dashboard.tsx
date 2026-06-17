import React, { useEffect, useState } from "react";
import { Users, Calendar, FileText, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { cn } from "../lib/utils";
import {useCurrency} from "../contexts/CurrencyContext";
import { DashboardData } from "../types";
import { motion } from "motion/react";
import { toast } from "react-hot-toast";

export const API_URL = "http://localhost:3001";


export function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const { formatCurrency } = useCurrency();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erro na resposta");
        return res.json();
      })
      .then((data) => {
        setDashboardData(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar dashboard");
        setError(true);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm font-medium">A carregar dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center text-gray-400">
          <p className="text-lg font-bold text-red-500 mb-1">
            Erro ao carregar dados
          </p>
          <p className="text-sm">Verifica a tua ligação ao servidor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-center mb-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white transition-colors tracking-tight">
          Dashboard
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="text-indigo-600" />}
          label="Clientes"
          value={dashboardData.metrics.clientsCount.toString()}
          trend={dashboardData.metrics.trends.clients}
          trendDetail="vs mês anterior"
          delay={0}
        />
        <StatCard
          icon={<Calendar className="text-green-600" />}
          label="Agendamentos (Hoje)"
          value={dashboardData.metrics.appointmentsToday.toString()}
          trend={dashboardData.metrics.trends.appointments}
          trendDetail="vs ontem"
          delay={0.1}
        />
        <StatCard
          icon={<FileText className="text-blue-600" />}
          label="Faturação (Mês)"
          value={formatCurrency(dashboardData.metrics.billingMonth)}
          trend={dashboardData.metrics.trends.billing}
          trendDetail="vs mês anterior"
          delay={0.2}
        />
        <StatCard
          icon={<FileText className="text-orange-600" />}
          label="Faturas Pendentes"
          value={dashboardData.metrics.pendingInvoices.toString()}
          trend={dashboardData.metrics.trends.pendingInvoices}
          trendDetail="vs mês anterior"
          isWarning
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Faturação (Últimos 6 meses)
              </h3>
              <select className="bg-gray-50 dark:bg-slate-800 dark:text-white border-none rounded-lg text-sm px-2 py-1 focus:ring-0">
                <option>Este ano</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.billingChart}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="val"
                    stroke="#7c3aed"
                    strokeWidth={4}
                    dot={{
                      r: 4,
                      fill: "#7c3aed",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-primary" size={20} />
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Estatuto de Faturas (30 dias)
                </h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Pagas vs Pendentes
              </span>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.invoiceStats}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={60}>
                    {dashboardData.invoiceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Upcoming Appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white">
                Agendamentos (Próximos)
              </h3>
              <button
                onClick={() => {
                  window.location.href = "/Appointments";
                }}
                className="text-primary text-sm font-semibold hover:underline"
              >
                Ver todos →
              </button>
            </div>
            <div className="space-y-4">
              {dashboardData.appointments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  Nenhum agendamento próximo
                </p>
              ) : (
                dashboardData.appointments.map((app) => (
                  <div
                    key={app.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl transition-colors gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.client?.name}`}
                          alt=""
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {app.client?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {app.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 flex-1">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {app.time}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {app.date}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                          app.status === "Concluído"
                            ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                            : app.status === "Cancelado"
                              ? "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                              : "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
                        )}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Pending Invoices Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm h-fit transition-colors"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">
              Faturas Pendentes
            </h3>
            <button onClick={() => {
              window.location.href = '/Invoices'
            }} 
            className="text-primary text-sm font-semibold hover:underline">
              Ver todas →
            </button>
          </div>
          <div className="space-y-4">
            {dashboardData.recentInvoices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                Nenhuma fatura pendente
              </p>
            ) : (
              dashboardData.recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 transition-colors rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                        {inv.id}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {inv.clientName}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-red-500">
                      {/* {formatCurrency(inv.amount)} */}
                      {formatCurrency(inv.total)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {inv.date}
                    </p>
                    <span className="text-[10px] uppercase font-black text-red-500 bg-red-100 dark:bg-red-500/10 px-2 py-0.5 rounded transition-colors tracking-widest">
                      Pendente
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  trendDetail,
  isWarning,
  delay,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm space-y-4 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center transition-colors">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          {label}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-black text-gray-900 dark:text-white transition-colors">
            {value}
          </span>
          <span
            className={cn(
              "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest transition-colors",
              isWarning
                ? "text-orange-600 bg-orange-100 dark:bg-orange-600/10"
                : "text-green-600 bg-green-100 dark:bg-green-600/10",
            )}
          >
            {trend}
          </span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {trendDetail}
        </p>
      </div>
    </motion.div>
  );
}
