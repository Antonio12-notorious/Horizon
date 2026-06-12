import { ReactNode } from "react";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  status: 'Ativo' | 'Inativo';
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

export interface Appointment {
  type: ReactNode;
  id: string;
  clientId: string;
  date: string;
  time: string;
  status: 'Pendente' | 'Concluído' | 'Cancelado';
  serviceId: string;
  client?: Client;
  service?: Service;
}

export interface InvoiceItem {
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Invoice {
  amount(amount: any): import("react").ReactNode;
  id: string;
  clientId: string;
  clientName: string;
  items: InvoiceItem[];
  total: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  date: string;
  dueDate: string;
}

export type UserRole = 'Admin' | 'Utilizador' | 'Visualizador';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Ativo' | 'Inativo';
  avatar?: string;
  phone?: string;
  location?: string;
}

export interface DashboardData {
  billingChart: ChartData<any> | undefined;
  metrics: {
    trends: any;
    clientsCount: number;
    appointmentsToday: number;
    billingMonth: number;
    pendingInvoices: number;
  };
  invoiceStats: { name: string; total: number; color: string }[];
  appointments: Appointment[];
  recentInvoices: Invoice[];
}
