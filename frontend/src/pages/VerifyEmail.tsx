import React, { useEffect, useState } from "react";
import { Mail, Box, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import toast from "react-hot-toast";

export function VerifyEmail() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "idle"
  >("idle");
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) return;

    const verifyEmail = async () => {
      setStatus("loading");
      try {
        const res = await fetch(
          `http://localhost:3001/api/auth/verify?token=${token}`,
        );
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          toast.error(data.message || "Erro ao verificar email");
          return;
        }

        setStatus("success");
        toast.success("Email verificado com sucesso!");

        // Redireciona para login após 2 segundos
        setTimeout(() => navigate("/login"), 2000);
      } catch (error) {
        setStatus("error");
        toast.error("Erro de ligação ao servidor");
      }
    };

    verifyEmail();
  }, []);

  const handleResend = async () => {
    // Para implementar futuramente
    toast("Funcionalidade em breve");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Box size={24} fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-gray-900">
            Horizon
          </span>
        </div>

        {/* Ícone dinâmico conforme estado */}
        <div
          className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-all
          ${
            status === "success"
              ? "bg-green-50 text-green-500"
              : status === "error"
                ? "bg-red-50 text-red-500"
                : "bg-primary/5 text-primary"
          }`}
        >
          {status === "success" ? (
            <CheckCircle size={40} strokeWidth={1.5} />
          ) : status === "error" ? (
            <XCircle size={40} strokeWidth={1.5} />
          ) : (
            <Mail size={40} strokeWidth={1.5} />
          )}
        </div>

        {/* Título dinâmico */}
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          {status === "success"
            ? "Email verificado!"
            : status === "error"
              ? "Erro na verificação"
              : status === "loading"
                ? "A verificar..."
                : "Verifique o seu email"}
        </h1>

        <p className="text-gray-400 text-sm mb-10 font-medium">
          {status === "success"
            ? "A redirecionar para o login..."
            : status === "error"
              ? "O link pode ter expirado ou já foi usado."
              : status === "loading"
                ? "Por favor aguarde..."
                : "Enviámos um link de verificação para o seu email"}
        </p>

        {/* Ações */}
        {status !== "success" && (
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-400">
              Não recebeu o email?
            </p>
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-primary font-black text-sm hover:underline disabled:opacity-50"
            >
              {isResending ? "A reenviar..." : "Reenviar email"}
            </button>
          </div>
        )}

        <button
          onClick={() => navigate("/login")}
          className="mt-12 text-primary font-bold text-sm hover:underline block mx-auto"
        >
          Voltar para o login
        </button>
      </motion.div>
    </div>
  );
}
