// import React, { useState } from 'react';
// import { Box, Lock, Mail } from 'lucide-react';
// import { Link, useNavigate } from 'react-router-dom';
// import { motion } from 'motion/react';
// import toast from 'react-hot-toast';

// export function ForgotPassword() {
//   const [email, setEmail] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     // Validation
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       toast.error('Por favor, introduza um email válido');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       // Simulation
//       await new Promise(resolve => setTimeout(resolve, 1500));
//       toast.success('Instruções enviadas para o seu email!');
//       await new Promise(resolve => setTimeout(resolve, 500));
//       navigate('/login');
//     } catch (error) {
//       toast.error('Erro ao processar pedido.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
//       <motion.div 
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         className="w-full max-w-[440px] bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 text-center"
//       >
//         <div className="flex items-center justify-center gap-2 mb-10">
//           <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
//             <Box size={24} fill="currentColor" fillOpacity={0.2} />
//           </div>
//           <span className="text-2xl font-black tracking-tighter text-gray-900">MiniERP</span>
//         </div>
        
//         <div className="w-24 h-24 bg-primary/5 text-primary rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 relative">
//           <div className="absolute inset-0 bg-primary/5 blur-xl rounded-full" />
//           <Lock size={40} className="relative z-10" />
//         </div>

//         <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Recuperar senha</h1>
//         <p className="text-gray-400 text-sm mb-10 font-medium">
//           Digite seu email para receber as instruções
//         </p>

//         <form className="space-y-6 text-left" onSubmit={handleSubmit}>
//           <div className="space-y-2">
//             <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
//             <input 
//               type="email" 
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               placeholder="seu@email.com"
//               className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:text-gray-300"
//               required
//             />
//           </div>

//           <button 
//             disabled={isLoading}
//             className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
//           >
//             {isLoading ? (
//               <>
//                 <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
//                 <span>A enviar...</span>
//               </>
//             ) : (
//               "Enviar instruções"
//             )}
//           </button>
//         </form>

//         <div className="relative my-10">
//           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
//           <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 font-sans"><span className="px-4 bg-white">ou</span></div>
//         </div>

//         <button 
//           onClick={() => navigate('/login')}
//           className="text-primary font-bold text-sm hover:underline block mx-auto transition-all"
//         >
//           Voltar para o login
//         </button>
//       </motion.div>
//     </div>
//   );
// }

import React, { useState } from "react";
import { Lock, Eye, EyeOff, Box, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const rules: Rule[] = [
  { label: "Mínimo 8 caracteres", test: (v) => v.length >= 8 },
  { label: "Pelo menos uma maiúscula", test: (v) => /[A-Z]/.test(v) },
  { label: "Pelo menos um número", test: (v) => /[0-9]/.test(v) },
];

export function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { user, changePassword } = useAuth();
  const navigate = useNavigate();

  const allRulesPassed = rules.every((r) => r.test(next));
  const passwordsMatch = next === confirm && confirm.length > 0;
  const canSubmit = current && allRulesPassed && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      await changePassword(current, next);
      toast.success("Senha alterada com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50 dark:bg-slate-950 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-slate-800"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Box size={24} fill="currentColor" fillOpacity={0.2} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">
              Horizon
            </span>
          </div>

          {user?.mustChangePassword && (
            <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                🔐 Por razões de segurança, deve alterar a sua senha antes de
                continuar.
              </p>
            </div>
          )}

          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {user?.mustChangePassword ? "Definir nova senha" : "Alterar senha"}
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 font-medium">
            {user?.mustChangePassword
              ? "Crie uma senha segura para a sua conta"
              : `Olá, ${user?.name?.split(" ")[0]}. Introduza a sua senha actual e a nova.`}
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Senha actual */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
              {user?.mustChangePassword ? "Senha temporária" : "Senha actual"}
            </label>
            <div className="relative">
              <input
                type={showCurr ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurr(!showCurr)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                {showCurr ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nova senha */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={showNext ? "text" : "password"}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowNext(!showNext)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                {showNext ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Regras */}
            {next.length > 0 && (
              <div className="mt-2 space-y-1 px-1">
                {rules.map((rule) => (
                  <div key={rule.label} className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full flex-shrink-0 transition-colors ${
                        rule.test(next)
                          ? "bg-green-500"
                          : "bg-gray-200 dark:bg-slate-700"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-bold transition-colors ${
                        rule.test(next)
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-400"
                      }`}
                    >
                      {rule.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirmar senha */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border rounded-2xl focus:outline-none focus:ring-4 transition-all font-bold text-sm text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 ${
                confirm.length > 0
                  ? passwordsMatch
                    ? "border-green-300 dark:border-green-700 focus:ring-green-500/10"
                    : "border-red-300 dark:border-red-700 focus:ring-red-500/10"
                  : "border-gray-100 dark:border-slate-700 focus:ring-primary/10"
              }`}
              required
            />
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-[11px] font-bold text-red-500 ml-1">
                As senhas não coincidem
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest mt-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>A guardar...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Definir nova senha
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
