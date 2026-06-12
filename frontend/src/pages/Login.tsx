import React, { useState } from "react";
import { Lock, Eye, EyeOff, Box } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor, introduza um email válido");
      return;
    }

    setIsLoading(true);

    try {
      const { mustChangePassword } = await login(email, password);

      if (mustChangePassword) {
        toast("Deve alterar a sua senha antes de continuar.", { icon: "🔐" });
        navigate("/change-password");
      } else {
        toast.success("Bem-vindo de volta!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50 dark:bg-slate-950 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 dark:border-slate-800 transition-all"
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
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Acesso corporativo
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 font-medium">
            Introduza as suas credenciais para continuar
          </p>
        </div>

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
              Email corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@empresa.com"
              className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:text-gray-300 dark:placeholder:text-gray-600"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 dark:text-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm text-gray-900 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end px-1">
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>A verificar...</span>
              </>
            ) : (
              <>
                <Lock size={16} />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[11px] text-gray-300 dark:text-gray-600 font-medium">
            Acesso restrito a utilizadores autorizados.
            <br />
            Contacte o administrador para obter credenciais.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
