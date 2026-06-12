import { useState } from 'react';
import { 
  Bell, Lock, Globe, Database, CreditCard, Shield,
  Moon, Sun, Laptop, Check, Eye, EyeOff, Palette,
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';
import { useAccent, ACCENT_COLORS, AccentColor } from '../contexts/AccentContext';
import { useCurrency, CURRENCIES, CurrencyCode } from '../contexts/CurrencyContext';

export const API_URL = "http://localhost:3001";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const { currency, setCurrency } = useCurrency();

  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState(() => localStorage.getItem('settings_company') || 'CrysTech');
  const [language, setLanguage] = useState(() => localStorage.getItem('settings_language') || 'Português (Moçambique)');

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('settings_notifications');
    return saved ? JSON.parse(saved) : { invoices: true, appointments: true, monthlyReports: false, stockAlerts: true };
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [passwords, setPasswords] = useState({ current: '', next: '' });

  const handleUpdateEmail = () => {
    if (!newEmail.includes('@')) { toast.error('Email inválido'); return; }
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
      loading: 'A atualizar email...', success: 'Email atualizado!', error: 'Erro ao atualizar email',
    });
  };

  const handleUpdatePassword = () => {
    if (passwords.next.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
      loading: 'A processar...', success: 'Palavra-passe alterada!', error: 'Erro na alteração',
    });
    setPasswords({ current: '', next: '' });
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('settings_company', companyName);
    localStorage.setItem('settings_language', language);
    localStorage.setItem('settings_notifications', JSON.stringify(notifications));
    setTimeout(() => {
      setSaving(false);
      toast.success('Configurações guardadas!');
    }, 800);
  };

  const tabs = [
    { id: 'general',       label: 'Geral',         icon: Globe      },
    { id: 'appearance',    label: 'Aparência',      icon: Palette    },
    { id: 'notifications', label: 'Notificações',   icon: Bell       },
    { id: 'security',      label: 'Segurança',      icon: Lock       },
    { id: 'billing',       label: 'Faturação',      icon: CreditCard },
    { id: 'backup',        label: 'Backup & Dados', icon: Database   },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div>
        <h1 className="text-4xl font-black ml-2 tracking-tight text-gray-900 dark:text-white mb-2">Configurações</h1>
        <p className="text-gray-500 ml-2 dark:text-gray-400 font-medium">Gerencie as preferências globais</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left group",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-gray-500 hover:bg-white dark:hover:bg-slate-900 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Icon size={18} className={cn(activeTab === tab.id ? "" : "text-gray-400 group-hover:text-primary transition-colors")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-slate-800">

          {/* GERAL */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Informações do Sistema</h3>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nome da Empresa</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm dark:text-white"
                />
              </div>

              {/* Moeda */}
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Moeda do Sistema</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Moedas em destaque */}
                  {(['MZN', 'USD', 'EUR'] as CurrencyCode[]).map((code) => {
                    const c = CURRENCIES[code];
                    const isActive = currency === code;
                    return (
                      <button key={code} type="button"
                        onClick={() => { setCurrency(code); toast.success(`Moeda alterada para ${c.label}`, { duration: 1500 }); }}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
                          isActive
                            ? "border-primary bg-primary/5"
                            : "border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 bg-gray-50 dark:bg-slate-800"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0",
                          isActive ? "bg-primary text-white" : "bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-300"
                        )}>
                          {c.symbol}
                        </div>
                        <div>
                          <p className={cn("font-black text-xs", isActive ? "text-primary" : "text-gray-700 dark:text-gray-300")}>
                            {code}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium">{c.label.split(' ')[0]}</p>
                        </div>
                        {isActive && <Check size={14} className="text-primary ml-auto" />}
                      </button>
                    );
                  })}
                </div>

                {/* Outras moedas */}
                <div className="flex items-center gap-3 flex-wrap pt-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Outras:</span>
                  {(['BRL', 'GBP'] as CurrencyCode[]).map((code) => {
                    const c = CURRENCIES[code];
                    const isActive = currency === code;
                    return (
                      <button key={code} type="button"
                        onClick={() => { setCurrency(code); toast.success(`Moeda alterada para ${c.label}`, { duration: 1500 }); }}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 text-xs font-black transition-all flex items-center gap-2",
                          isActive
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-gray-100 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:border-gray-200"
                        )}
                      >
                        <span>{c.symbol}</span> {code}
                        {isActive && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>

                {/* Preview */}
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exemplo:</span>
                  <span className="font-black text-gray-900 dark:text-white text-sm">
                    {new Intl.NumberFormat(CURRENCIES[currency].locale, {
                      style: 'currency', currency, minimumFractionDigits: 2
                    }).format(1250.99)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Idioma / Região</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm dark:text-white"
                >
                  <option>Português (Moçambique)</option>
                  <option>Português (Portugal)</option>
                  <option>English (UK)</option>
                  <option>Spanish (ES)</option>
                </select>
              </div>
            </div>
          )}

          {/* APARÊNCIA */}
          {activeTab === 'appearance' && (
            <div className="space-y-8">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Aparência do Painel</h3>

              <div className="space-y-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Tema</p>
                <div className="grid grid-cols-3 gap-4">
                  {[{ id: 'light', label: 'Claro', icon: Sun }, { id: 'dark', label: 'Escuro', icon: Moon }, { id: 'system', label: 'Sistema', icon: Laptop }].map((t) => {
                    const ThemeIcon = t.icon;
                    const isActive = theme === t.id;
                    return (
                      <button key={t.id} type="button" onClick={() => setTheme(t.id as any)}
                        className={cn(
                          "p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 font-bold text-[10px] uppercase tracking-widest",
                          isActive ? "border-primary bg-primary/5 text-primary" : "border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-gray-400"
                        )}
                      >
                        <ThemeIcon size={20} />
                        {t.label}
                        {isActive && <Check size={12} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cor de Destaque</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {(Object.entries(ACCENT_COLORS) as [AccentColor, typeof ACCENT_COLORS[AccentColor]][]).map(([key, color]) => {
                    const isActive = accent === key;
                    return (
                      <button key={key} type="button"
                        onClick={() => { setAccent(key); toast.success(`Cor: ${color.label}`, { duration: 1500 }); }}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                          isActive ? "border-gray-900 dark:border-white scale-105 shadow-lg" : "border-gray-100 dark:border-slate-800 hover:border-gray-300"
                        )}
                      >
                        <div className="w-8 h-8 rounded-full shadow-md flex items-center justify-center" style={{ backgroundColor: color.hex }}>
                          {isActive && <Check size={14} className="text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{color.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICAÇÕES */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Preferências de Notificação</h3>
              <div className="space-y-4">
                {[
                  { key: 'invoices',       title: 'Novas Faturas',         desc: 'Aviso quando uma nova fatura for gerada' },
                  { key: 'appointments',   title: 'Lembretes de Marcação', desc: 'Aviso 1 hora antes de cada consulta' },
                  { key: 'monthlyReports', title: 'Relatórios Mensais',    desc: 'Sumário financeiro todo dia 1 do mês' },
                  { key: 'stockAlerts',    title: 'Alertas de Stock',      desc: 'Aviso quando recursos estão baixos' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    </div>
                    <button type="button" onClick={() => setNotifications((p: any) => ({ ...p, [item.key]: !p[item.key] }))}
                      className={cn("w-12 h-6 rounded-full relative transition-all duration-300", notifications[item.key as keyof typeof notifications] ? "bg-primary" : "bg-gray-300 dark:bg-slate-700")}
                    >
                      <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300", notifications[item.key as keyof typeof notifications] ? "right-1" : "left-1")} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SEGURANÇA */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Segurança da Conta</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex gap-4">
                <Shield className="text-blue-500 shrink-0" size={24} />
                <div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-300">Autenticação de Dois Fatores</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Adicione uma camada extra de segurança.</p>
                  <button className="mt-3 text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest hover:underline">Configurar Agora</button>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Alterar Email</label>
                  <div className="flex gap-2">
                    <input type="email" placeholder="Novo email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm dark:text-white"
                    />
                    <button onClick={handleUpdateEmail} className="px-4 py-3 bg-gray-900 dark:bg-white dark:text-black text-white text-xs font-black rounded-2xl uppercase tracking-widest">Alterar</button>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Alterar Palavra-passe</label>
                  <div className="relative">
                    <input type={showCurrentPassword ? "text" : "password"} placeholder="Palavra-passe atual" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm dark:text-white"
                    />
                    <button onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input type={showNewPassword ? "text" : "password"} placeholder="Nova palavra-passe" value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 font-bold text-sm dark:text-white"
                    />
                    <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <button onClick={handleUpdatePassword} className="w-full py-3 bg-primary text-white text-xs font-black rounded-2xl uppercase tracking-widest shadow-lg shadow-primary/20">
                    Confirmar Alteração
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FATURAÇÃO */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Plano & Faturação</h3>
              <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard size={120} /></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Plano Atual</p>
                  <h4 className="text-3xl font-black mb-1">Business Pro</h4>
                  <p className="text-sm font-bold text-gray-400 mb-8">Válido até 31 de Outubro, 2024</p>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest">Gerir Assinatura</button>
                    <button className="px-6 py-3 bg-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest">Ver Faturas</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6">Backup & Exportação</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => toast.promise(new Promise(r => setTimeout(r, 3000)), { loading: 'A gerar backup...', success: 'Backup concluído!', error: 'Falha no backup' })}
                  className="p-6 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[2rem] text-left hover:border-primary transition-all"
                >
                  <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-sm"><Database size={24} /></div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Backup Manual</h4>
                  <p className="text-xs text-gray-500 mt-1">Gere um backup completo da base de dados.</p>
                </button>
                <button onClick={() => toast.success('A exportar dados...')}
                  className="p-6 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-[2rem] text-left hover:border-emerald-500 transition-all"
                >
                  <div className="w-12 h-12 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 shadow-sm"><Globe size={24} /></div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Exportar CSV</h4>
                  <p className="text-xs text-gray-500 mt-1">Exporte clientes e faturas para Excel/CSV.</p>
                </button>
              </div>
            </div>
          )}

          {['general', 'notifications'].includes(activeTab) && (
            <div className="mt-10 pt-6 border-t border-gray-50 dark:border-slate-800 flex justify-end">
              <button onClick={handleSave} disabled={saving}
                className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-70"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
                Guardar Alterações
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
