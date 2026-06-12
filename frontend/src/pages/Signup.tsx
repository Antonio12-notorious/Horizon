// import React, { useState } from 'react';
// import { Box, Eye, EyeOff } from 'lucide-react';
// import { Link, useNavigate } from 'react-router-dom';
// import { motion } from 'motion/react';
// import toast from 'react-hot-toast';

// export function Signup() {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: ''
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

// const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();

//   // ✅ Validar senhas antes de enviar
//   if (formData.password !== formData.confirmPassword) {
//     toast.error("As senhas não coincidem");
//     return;
//   }

//   setIsLoading(true);

//   try {
//     const res = await fetch("http://localhost:3001/api/auth/register", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       // ✅ Enviar apenas os campos que o backend espera
//       body: JSON.stringify({
//         name: formData.name,
//         email: formData.email,
//         password: formData.password,
//       }),
//     });

//     const data = await res.json();

//   if (!res.ok) {
//     console.log("Erro detalhado:", data); 
//     toast.error(data.error || "Erro ao criar conta");
//     return;
//   }
//     toast.success(data.message);

//     navigate("/verify-email", {
//       state: { email: formData.email },
//     });
//   } catch (error) {
//     toast.error("Erro de ligação ao servidor");
//   } finally {
//     setIsLoading(false);
//   }
// };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50 dark:bg-slate-950 transition-colors">
//       <motion.div 
//         initial={{ opacity: 0, scale: 0.95 }}
//         animate={{ opacity: 1, scale: 1 }}
//         className="w-full max-w-[440px] bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-slate-800 transition-all"
//       >
//         <div className="text-center mb-10">
//           <div className="flex items-center justify-center gap-2 mb-6">
//             <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center transition-colors">
//               <Box size={24} fill="currentColor" fillOpacity={0.2} />
//             </div>
//             <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white transition-colors">Horizon</span>
//           </div>
//           <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight transition-colors">Criar nova conta</h1>
//           <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 font-medium transition-colors">Preencha os dados para criar sua conta</p>
//         </div>

//         <form className="space-y-5" onSubmit={handleSubmit}>
//           <div className="space-y-2">
//             <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">Nome completo</label>
//             <input 
//               type="text" 
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               placeholder="Seu nome"
//               className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:text-gray-300 dark:placeholder:text-gray-600"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">Email</label>
//             <input 
//               type="email" 
//               value={formData.email}
//               onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//               placeholder="seu@email.com"
//               className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:text-gray-300 dark:placeholder:text-gray-600 transition-colors"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">Senha</label>
//             <div className="relative">
//               <input 
//                 type={showPassword ? "text" : "password"}
//                 value={formData.password}
//                 onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                 placeholder="Mínimo 8 caracteres"
//                 className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:text-gray-300 dark:placeholder:text-gray-600"
//                 required
//               />
//               <button 
//                 type="button" 
//                 onClick={() => setShowPassword(!showPassword)}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
//               >
//                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             </div>
//           </div>

//           <div className="space-y-2">
//             <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors">Confirmar senha</label>
//             <div className="relative">
//               <input 
//                 type={showConfirmPassword ? "text" : "password"}
//                 value={formData.confirmPassword}
//                 onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
//                 placeholder="Confirme sua senha"
//                 className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:text-gray-300 dark:placeholder:text-gray-600"
//                 required
//               />
//               <button 
//                 type="button" 
//                 onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
//               >
//                 {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//               </button>
//             </div>
//           </div>

//           <div className="flex items-start gap-3 px-1 mt-6">
//             <input type="checkbox" id="terms" className="mt-1 w-4 h-4 rounded border-gray-200 dark:border-slate-700 text-primary focus:ring-primary transition-all cursor-pointer dark:bg-slate-800" required />
//             <label htmlFor="terms" className="text-[10px] font-bold text-gray-400 dark:text-gray-500 leading-tight transition-colors">
//               Li e aceito os <button type="button" className="text-primary hover:underline font-black">Termos de Uso</button> e <button type="button" className="text-primary hover:underline font-black">Política de Privacidade</button>
//             </label>
//           </div>

//           <button 
//             disabled={isLoading}
//             className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest"
//           >
//             {isLoading ? (
//               <>
//                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
//                 <span>A criar conta...</span>
//               </>
//             ) : (
//               "Criar conta"
//             )}
//           </button>
//         </form>

//         <p className="mt-8 text-center text-xs font-bold text-gray-400 dark:text-gray-500 transition-colors">
//           Já tem uma conta? <Link to="/login" className="text-primary hover:underline font-black">Fazer login</Link>
//         </p>
//       </motion.div>
//     </div>
//   );
// }

import { Navigate } from "react-router-dom";
export function Signup() {
  return <Navigate to="/login" replace />;
}