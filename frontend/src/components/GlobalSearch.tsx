import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, X, User, Briefcase, FileText, Calendar,
  CreditCard, ArrowRight, Command, Clock, History,
  LayoutDashboard, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { authFetch } from '../lib/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ResultType = 'client' | 'service' | 'invoice' | 'appointment' | 'payment';

interface SearchResult {
  id: string;
  type: ResultType;
  title: string;
  subtitle: string;
  meta?: string;       // ex: estado da fatura, valor, data
  path: string;        // deep link directo ao registo
}

// ─── Configuração por tipo ────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ResultType, {
  label: string;
  icon: React.ReactNode;
  badgeCls: string;
  groupLabel: string;
}> = {
  client: {
    label: 'Cliente',
    icon: <User size={18} className="text-blue-400" />,
    badgeCls: 'bg-blue-500/10 text-blue-400 dark:bg-blue-500/20 dark:text-blue-300',
    groupLabel: 'Clientes',
  },
  service: {
    label: 'Serviço',
    icon: <Briefcase size={18} className="text-emerald-400" />,
    badgeCls: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    groupLabel: 'Serviços',
  },
  invoice: {
    label: 'Fatura',
    icon: <FileText size={18} className="text-orange-400" />,
    badgeCls: 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300',
    groupLabel: 'Faturas',
  },
  appointment: {
    label: 'Agendamento',
    icon: <Calendar size={18} className="text-purple-400" />,
    badgeCls: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300',
    groupLabel: 'Agendamentos',
  },
  payment: {
    label: 'Pagamento',
    icon: <CreditCard size={18} className="text-teal-400" />,
    badgeCls: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-300',
    groupLabel: 'Pagamentos',
  },
};

// ─── Atalhos rápidos (estado vazio) ───────────────────────────────────────────

const QUICK_LINKS = [
  { label: 'Dashboard',     path: '/',             icon: <LayoutDashboard size={15} /> },
  { label: 'Clientes',      path: '/clients',      icon: <User size={15} /> },
  { label: 'Agendamentos',  path: '/appointments', icon: <Calendar size={15} /> },
  { label: 'Faturas',       path: '/invoices',     icon: <FileText size={15} /> },
  { label: 'Pagamentos',    path: '/payments',     icon: <CreditCard size={15} /> },
  { label: 'Serviços',      path: '/services',     icon: <Briefcase size={15} /> },
];

// ─── Histórico ────────────────────────────────────────────────────────────────

const HISTORY_KEY = 'horizon_search_history';

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(terms: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(terms));
}

// ─── Pesquisa (endpoint único) ────────────────────────────────────────────────

async function fetchResults(q: string): Promise<SearchResult[]> {
  // Endpoint único — o backend filtra todos os modelos
  // GET /api/search?q=texto&limit=10
  // Resposta esperada: { results: SearchResult[] }
  //
  // Fallback: se o endpoint não existir ainda, faz 4 chamadas individuais
  // e constrói os deep links correctos.

  try {
    const res = await authFetch(`/api/search?q=${encodeURIComponent(q)}&limit=10`);
    if (!res.ok) throw new Error('search-endpoint-unavailable');
    const data = await res.json();
    return (data.results ?? data) as SearchResult[];
  } catch {
    const [clients, services, invoices, appointments, payments] = await Promise.all([
      authFetch('/api/clients').then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch('/api/services').then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch('/api/invoices').then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch('/api/appointments').then(r => r.ok ? r.json() : []).catch(() => []),
      authFetch('/api/payments').then(r => r.ok ? r.json() : []).catch(() => []),
    ]);

    const q_lower = q.toLowerCase();
    const match = (val?: string) => val?.toLowerCase().includes(q_lower) ?? false;

    const results: SearchResult[] = [
      ...clients
        .filter((c: any) => match(c.name) || match(c.email) || match(c.phone) || match(c.nif))
        .map((c: any): SearchResult => ({
          id: c.id, type: 'client',
          title: c.name,
          subtitle: c.email ?? c.phone ?? '—',
          meta: c.nif ? `NIF ${c.nif}` : undefined,
          path: `/clients/${c.id}`,
        })),

      ...services
        .filter((s: any) => match(s.name) || match(s.description) || match(s.category))
        .map((s: any): SearchResult => ({
          id: s.id, type: 'service',
          title: s.name,
          subtitle: s.category ?? s.description ?? '—',
          meta: s.price != null ? `${Number(s.price).toFixed(2)} MT` : undefined,
          path: `/services/${s.id}`,
        })),

      ...invoices
        .filter((i: any) => match(i.id) || match(i.number) || match(i.clientName) || match(i.status))
        .map((i: any): SearchResult => ({
          id: i.id, type: 'invoice',
          title: `Fatura ${i.number ?? '#' + i.id}`,
          subtitle: i.clientName ?? '—',
          meta: i.status ?? undefined,
          path: `/invoices/${i.id}`,
        })),

      ...appointments
        .filter((a: any) => match(a.client?.name) || match(a.service?.name) || match(a.notes))
        .map((a: any): SearchResult => ({
          id: a.id, type: 'appointment',
          title: a.client?.name ?? 'Cliente',
          subtitle: a.service?.name ?? '—',
          meta: a.date ? new Date(a.date).toLocaleDateString('pt-MZ') : undefined,
          path: `/appointments/${a.id}`,
        })),

      ...payments
        .filter((p: any) => match(p.reference) || match(p.clientName) || match(p.method))
        .map((p: any): SearchResult => ({
          id: p.id, type: 'payment',
          title: p.clientName ?? `Pagamento ${p.reference ?? p.id}`,
          subtitle: p.method ?? '—',
          meta: p.amount != null ? `${Number(p.amount).toFixed(2)} MT` : undefined,
          path: `/payments/${p.id}`,
        })),
    ];

    return results.slice(0, 10);
  }
}

// ─── Agrupar resultados por tipo ──────────────────────────────────────────────

function groupResults(results: SearchResult[]): [ResultType, SearchResult[]][] {
  const map = new Map<ResultType, SearchResult[]>();
  for (const r of results) {
    if (!map.has(r.type)) map.set(r.type, []);
    map.get(r.type)!.push(r);
  }
  return Array.from(map.entries());
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [activeIdx, setActiveIdx] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ── Fechar / abrir ──────────────────────────────────────────────────────────

  const open = () => { setIsOpen(true); setQuery(''); setResults([]); setActiveIdx(-1); };
  const close = () => { setIsOpen(false); setQuery(''); setResults([]); setActiveIdx(-1); };

  // ── Histórico ───────────────────────────────────────────────────────────────

  const pushHistory = useCallback((term: string) => {
    if (!term || term.trim().length < 2) return;
    setHistory(prev => {
      const next = [term, ...prev.filter(s => s !== term)].slice(0, 6);
      saveHistory(next);
      return next;
    });
  }, []);

  const clearHistory = () => { setHistory([]); localStorage.removeItem(HISTORY_KEY); };

  // ── Pesquisa com debounce ────────────────────────────────────────────────────

  useEffect(() => {
    if (query.length < 2) { setResults([]); setActiveIdx(-1); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetchResults(query);
        setResults(r);
        setActiveIdx(-1);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  // ── Atalhos de teclado globais ───────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open(); }
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  // ── Navegação ↑↓ Enter ───────────────────────────────────────────────────────

  const flatResults = results;
  const maxIdx = flatResults.length - 1;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, maxIdx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (activeIdx >= 0 && flatResults[activeIdx]) {
        selectResult(flatResults[activeIdx]);
      } else if (query.trim().length >= 2) {
        pushHistory(query.trim());
      }
    }
  };

  // Scroll automático para o item activo
  useEffect(() => {
    if (activeIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  // ── Seleccionar resultado ────────────────────────────────────────────────────

  const selectResult = (result: SearchResult) => {
    pushHistory(query || result.title);
    navigate(result.path);
    close();
  };

  const selectQuickLink = (path: string) => { navigate(path); close(); };

  // ── Render ───────────────────────────────────────────────────────────────────

  const grouped = groupResults(results);

  // índice global por grupo para o activeIdx funcionar
  let globalIdx = 0;

  return (
    <>
      {/* ── Trigger desktop ── */}
      <button
        onClick={open}
        className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-2xl transition-all w-64 group"
      >
        <Search size={16} className="group-hover:text-primary transition-colors flex-shrink-0" />
        <span className="text-sm font-medium mr-auto text-gray-500">Pesquisar...</span>
        <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded-md">
          <Command size={10} className="text-gray-500" />
          <span className="text-[10px] font-bold text-gray-500">K</span>
        </div>
      </button>

      {/* ── Trigger mobile (ícone) ── */}
      <button
        onClick={open}
        className="md:hidden flex items-center justify-end gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 rounded-2xl transition-all w-34 group"
        aria-label="Abrir pesquisa"
      >
        <Search size={18} />
        <span className="text-sm font-medium mr-auto text-gray-500">Pesquisar...</span>

      </button>

      {/* ── Modal ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={close}
              className="fixed inset-0 bg-black/70 z-[60] backdrop-blur-sm"
            />

            {/* Painel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.97, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[8%] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-[61] overflow-hidden border border-gray-100 dark:border-slate-800"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-slate-800">
                <Search size={20} className={cn('flex-shrink-0 transition-colors', loading ? 'text-primary animate-pulse' : 'text-gray-400 dark:text-gray-500')} />
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  placeholder="Pesquisar clientes, faturas, serviços..."
                  className="flex-1 text-base font-medium focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 bg-transparent text-gray-900 dark:text-white"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {query && (
                  <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }} className="p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 transition-colors">
                    <X size={16} />
                  </button>
                )}
                <button onClick={close} className="p-1.5 text-gray-300 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400 transition-colors ml-1">
                  <X size={18} />
                </button>
              </div>

              {/* Corpo */}
              <div ref={listRef} className="max-h-[60vh] overflow-y-auto overscroll-contain">

                {/* Loading */}
                {loading && (
                  <div className="flex items-center gap-3 px-6 py-5 text-sm text-gray-400 dark:text-gray-500">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
                    A procurar em todos os módulos...
                  </div>
                )}

                {/* Resultados agrupados */}
                {!loading && results.length > 0 && (
                  <div className="p-3">
                    {grouped.map(([type, items]) => {
                      const cfg = TYPE_CONFIG[type];
                      return (
                        <div key={type} className="mb-2">
                          {/* Cabeçalho do grupo */}
                          <div className="flex items-center gap-2 px-3 py-1.5">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">{cfg.groupLabel}</span>
                            <div className="flex-1 h-px bg-gray-100 dark:bg-slate-800" />
                          </div>

                          {items.map(result => {
                            const idx = globalIdx++;
                            const isActive = idx === activeIdx;
                            return (
                              <button
                                key={`${result.type}-${result.id}`}
                                data-idx={idx}
                                onClick={() => selectResult(result)}
                                onMouseEnter={() => setActiveIdx(idx)}
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left group',
                                  isActive
                                    ? 'bg-primary/5 dark:bg-primary/10'
                                    : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                                )}
                              >
                                {/* Ícone */}
                                <div className={cn(
                                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
                                  isActive ? 'bg-primary/10 dark:bg-primary/20' : 'bg-gray-100 dark:bg-slate-800'
                                )}>
                                  {cfg.icon}
                                </div>

                                {/* Texto */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{result.title}</span>
                                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide flex-shrink-0', cfg.badgeCls)}>
                                      {cfg.label}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">{result.subtitle}</span>
                                    {result.meta && (
                                      <>
                                        <span className="text-gray-200 dark:text-gray-700">·</span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{result.meta}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Seta */}
                                <ChevronRight size={15} className={cn('flex-shrink-0 transition-colors', isActive ? 'text-primary' : 'text-gray-200 dark:text-gray-700')} />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sem resultados */}
                {!loading && query.length >= 2 && results.length === 0 && (
                  <div className="py-14 text-center px-6">
                    <div className="w-14 h-14 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Search size={26} className="text-gray-200 dark:text-slate-600" />
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">Nenhum resultado para "{query}"</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Tenta outros termos — nome, email, número de fatura...</p>
                  </div>
                )}

                {/* Estado vazio: histórico + atalhos rápidos */}
                {!loading && query.length < 2 && (
                  <div className="p-4 space-y-5">

                    {/* Histórico */}
                    {history.length > 0 && (
                      <section>
                        <div className="flex items-center justify-between px-2 mb-2">
                          <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                            <Clock size={11} /> Recentes
                          </span>
                          <button onClick={clearHistory} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wide">
                            Limpar
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          {history.map((term, i) => (
                            <button
                              key={i}
                              onClick={() => setQuery(term)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-all group text-left"
                            >
                              <History size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors flex-shrink-0" />
                              <span className="flex-1 truncate font-medium">{term}</span>
                              <ArrowRight size={13} className="text-gray-200 dark:text-gray-700 group-hover:text-primary transition-colors" />
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Atalhos rápidos */}
                    <section>
                      <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] px-2 mb-2 block">
                        Acesso rápido
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {QUICK_LINKS.map(link => (
                          <button
                            key={link.path}
                            onClick={() => selectQuickLink(link.path)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-all text-left group"
                          >
                            <span className="text-gray-400 group-hover:text-primary transition-colors">{link.icon}</span>
                            {link.label}
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </div>

              {/* Rodapé */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {[
                    { key: '↑↓', label: 'Navegar' },
                    { key: 'Enter', label: 'Abrir' },
                    { key: 'Esc', label: 'Fechar' },
                  ].map(k => (
                    <div key={k.key} className="flex items-center gap-1.5">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-[10px] font-bold text-gray-500 dark:text-gray-400">{k.key}</kbd>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide hidden sm:inline">{k.label}</span>
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest hidden sm:inline">Horizon Search</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}