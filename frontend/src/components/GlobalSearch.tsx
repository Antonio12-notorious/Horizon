// import React, { useState, useEffect, useCallback } from 'react';
// import { Search, X, User, Briefcase, FileText, Calendar, ArrowRight, Command, Clock, History } from 'lucide-react';
// import { motion, AnimatePresence } from 'motion/react';
// import { useNavigate } from 'react-router-dom';
// import { cn } from '../lib/utils';

// interface SearchResult {
//   id: string;
//   type: 'client' | 'service' | 'invoice' | 'appointment';
//   title: string;
//   subtitle: string;
//   path: string;
// }

// const RECENT_SEARCHES_KEY = 'minierp_recent_searches';

// export function GlobalSearch() {
//   const [isOpen, setIsOpen] = useState(false);
//   const [query, setQuery] = useState('');
//   const [results, setResults] = useState<SearchResult[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [recentSearches, setRecentSearches] = useState<string[]>([]);
//   const navigate = useNavigate();

//   // Load history on mount
//   useEffect(() => {
//     const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
//     if (saved) {
//       try {
//         setRecentSearches(JSON.parse(saved));
//       } catch (e) {
//         console.error('Failed to load search history');
//       }
//     }
//   }, []);

//   const addToHistory = useCallback((term: string) => {
//     if (!term || term.trim().length < 2) return;
    
//     setRecentSearches(prev => {
//       const filtered = prev.filter(s => s !== term);
//       const updated = [term, ...filtered].slice(0, 5);
//       localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
//       return updated;
//     });
//   }, []);

//   const clearHistory = () => {
//     setRecentSearches([]);
//     localStorage.removeItem(RECENT_SEARCHES_KEY);
//   };

//   const handleSearch = useCallback(async (text: string) => {
//     if (text.length < 2) {
//       setResults([]);
//       return;
//     }

//     setLoading(true);
//     try {
//       // In a real app, this would be a single API call like GET /api/search?q=...
//       const [clients, services, invoices, appointments] = await Promise.all([
//         fetch('/api/clients').then(res => res.json()),
//         fetch('/api/services').then(res => res.json()),
//         fetch('/api/invoices').then(res => res.json()),
//         fetch('/api/appointments').then(res => res.json()),
//       ]);

//       const filtered: SearchResult[] = [
//         ...clients.filter((c: any) => c.name.toLowerCase().includes(text.toLowerCase()) || (c.email && c.email.toLowerCase().includes(text.toLowerCase())))
//           .map((c: any) => ({ id: c.id, type: 'client', title: c.name, subtitle: c.email || 'Sem email', path: '/clients' })),
        
//         ...services.filter((s: any) => s.name.toLowerCase().includes(text.toLowerCase()) || (s.description && s.description.toLowerCase().includes(text.toLowerCase())))
//           .map((s: any) => ({ id: s.id, type: 'service', title: s.name, subtitle: `€${s.price}`, path: '/services' })),

//         ...invoices.filter((i: any) => i.id.toLowerCase().includes(text.toLowerCase()) || (i.clientName && i.clientName.toLowerCase().includes(text.toLowerCase())))
//           .map((i: any) => ({ id: i.id, type: 'invoice', title: `Fatura #${i.id}`, subtitle: i.clientName || 'Cliente desconhecido', path: '/invoices' })),

//         ...appointments.filter((a: any) => (a.client?.name && a.client.name.toLowerCase().includes(text.toLowerCase())) || (a.service?.name && a.service.name.toLowerCase().includes(text.toLowerCase())))
//           .map((a: any) => ({ id: a.id, type: 'appointment', title: a.client?.name || 'Cliente', subtitle: a.service?.name || 'Serviço', path: '/appointments' })),
//       ].slice(0, 8);

//       setResults(filtered);
//     } catch (error) {
//       console.error('Search error:', error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     const timer = setTimeout(() => handleSearch(query), 300);
//     return () => clearTimeout(timer);
//   }, [query, handleSearch]);

//   useEffect(() => {
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
//         e.preventDefault();
//         setIsOpen(true);
//       }
//       if (e.key === 'Escape') {
//         setIsOpen(false);
//       }
//       if (e.key === 'Enter' && query.trim().length >= 2 && !loading) {
//         addToHistory(query);
//       }
//     };
//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [query, loading, addToHistory]);

//   const selectResult = (result: SearchResult) => {
//     addToHistory(query || result.title);
//     navigate(result.path);
//     setIsOpen(false);
//   };

//   const getIcon = (type: string) => {
//     switch (type) {
//       case 'client': return <User className="text-blue-500" size={18} />;
//       case 'service': return <Briefcase className="text-emerald-500" size={18} />;
//       case 'invoice': return <FileText className="text-orange-500" size={18} />;
//       case 'appointment': return <Calendar className="text-purple-500" size={18} />;
//       default: return <Search size={18} />;
//     }
//   };

//   const getBadge = (type: string) => {
//     switch (type) {
//       case 'client': return <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Cliente</span>;
//       case 'service': return <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Serviço</span>;
//       case 'invoice': return <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Fatura</span>;
//       case 'appointment': return <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">Marcação</span>;
//       default: return null;
//     }
//   };

//   return (
//     <>
//       <button 
//         onClick={() => setIsOpen(true)}
//         className="hidden md:flex items-center gap-3 px-4 py-2.5 bg-gray-100/50 hover:bg-gray-100 text-gray-400 rounded-2xl transition-all w-64 group truncate"
//       >
//         <Search size={18} className="group-hover:text-primary transition-colors flex-shrink-0" />
//         <span className="text-sm font-medium mr-auto hidden md:inline">Pesquisar em tudo...</span>
//         <div className="hidden md:flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200 text-[10px] font-black">
//           <Command size={10} />
//           <span>K</span>
//         </div>
//       </button>

//       <AnimatePresence>
//         {isOpen && (
//           <>
//             <motion.div 
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               onClick={() => setIsOpen(false)}
//               className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-md"
//             />
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[61] overflow-hidden border border-white/20 transition-colors"
//             >
//               <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-4">
//                 <Search size={24} className="text-primary" />
//                 <input 
//                   autoFocus
//                   type="text" 
//                   placeholder="Pesquisar por clientes, serviços, faturas..."
//                   className="w-full text-xl font-bold focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 bg-transparent dark:text-white"
//                   value={query}
//                   onChange={(e) => setQuery(e.target.value)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter' && query.trim().length >= 2) {
//                       addToHistory(query);
//                     }
//                   }}
//                 />
//                 <button 
//                   onClick={() => setIsOpen(false)}
//                   className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>

//               <div className="max-h-[480px] overflow-y-auto p-4 custom-scrollbar">
//                 {loading ? (
//                   <div className="p-12 text-center">
//                     <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
//                     <p className="text-sm font-bold text-gray-400 dark:text-gray-500">A procurar em todos os módulos...</p>
//                   </div>
//                 ) : results.length > 0 ? (
//                   <div className="space-y-2">
//                     {results.map((result) => (
//                       <button
//                         key={`${result.type}-${result.id}`}
//                         onClick={() => selectResult(result)}
//                         className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-3xl transition-all group text-left"
//                       >
//                         <div className="w-12 h-12 bg-gray-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-lg transition-all">
//                           {getIcon(result.type)}
//                         </div>
//                         <div className="flex-1">
//                           <div className="flex items-center gap-2 mb-0.5">
//                             <h4 className="font-black text-gray-900 dark:text-white tracking-tight">{result.title}</h4>
//                             {getBadge(result.type)}
//                           </div>
//                           <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{result.subtitle}</p>
//                         </div>
//                         <ArrowRight size={18} className="text-gray-200 dark:text-gray-800 group-hover:text-primary transition-colors pr-2" />
//                       </button>
//                     ))}
//                   </div>
//                 ) : query.length > 1 ? (
//                   <div className="p-12 text-center">
//                     <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 text-gray-200 dark:text-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-4">
//                       <Search size={32} />
//                     </div>
//                     <p className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Nenhum resultado encontrado</p>
//                     <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mt-1">Tente pesquisar por outros termos</p>
//                   </div>
//                 ) : (
//                   <div className="p-4 space-y-8">
//                     {recentSearches.length > 0 && (
//                       <section>
//                         <div className="flex items-center justify-between px-4 mb-4">
//                           <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
//                             <Clock size={12} /> Pesquisas Recentes
//                           </p>
//                           <button 
//                             onClick={clearHistory}
//                             className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
//                           >
//                             Limpar
//                           </button>
//                         </div>
//                         <div className="space-y-1">
//                           {recentSearches.map((term, i) => (
//                             <button 
//                               key={i}
//                               onClick={() => setQuery(term)}
//                               className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-2xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:text-primary transition-all group"
//                             >
//                               <History size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors" />
//                               {term}
//                             </button>
//                           ))}
//                         </div>
//                       </section>
//                     )}

//                     <section>
//                       <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 px-4">Sugestões de pesquisa</p>
//                       <div className="grid grid-cols-2 gap-3 px-4">
//                         {['Joao Silva', 'Consultoria', 'Fatura #1', 'Agendamento'].map(sug => (
//                           <button 
//                             key={sug}
//                             onClick={() => setQuery(sug)}
//                             className="px-4 py-3 bg-gray-50 dark:bg-slate-800 hover:bg-primary/5 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-primary transition-all text-left flex items-center gap-2"
//                           >
//                             <Search size={14} className="opacity-50" />
//                             {sug}
//                           </button>
//                         ))}
//                       </div>
//                     </section>
//                   </div>
//                 )}
//               </div>

//               <div className="p-6 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
//                 <div className="flex flex-col md:flex-row md:items-center gap-4 lg:gap-6">
//                   <div className="flex items-center gap-2">
//                     <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-[10px] font-black dark:text-gray-300">ENTER</kbd>
//                     <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Selecionar</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-[10px] font-black dark:text-gray-300">↑↓</kbd>
//                     <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Navegar</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-[10px] font-black dark:text-gray-300">ESC</kbd>
//                     <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Fechar</span>
//                   </div>
//                 </div>
//                 <span className="hidden sm:inline text-[10px] font-black text-primary uppercase tracking-[0.2em]">MiniERP Search</span>
//               </div>
//             </motion.div>
//           </>
//         )}
//       </AnimatePresence>
//     </>
//   );
// }
