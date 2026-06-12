import React from 'react';
import { CheckCircle2, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export function VerifiedSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50/50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Box size={24} fill="currentColor" fillOpacity={0.2} />
          </div>
          <span className="text-2xl font-black tracking-tighter text-gray-900">MiniERP</span>
        </div>
        
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-emerald-50/50">
          <CheckCircle2 size={48} strokeWidth={2} />
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Email verificado!</h1>
        <p className="text-gray-400 text-sm mb-12 font-medium">
          Sua conta foi verificada com sucesso.
        </p>

        <button 
          onClick={() => navigate('/login')}
          className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
        >
          Fazer login
        </button>

        <div className="relative my-10">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 font-sans"><span className="px-4 bg-white">ou</span></div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="text-primary font-bold text-sm hover:underline block mx-auto transition-all"
        >
          Ir para o dashboard
        </button>
      </motion.div>
    </div>
  );
}
