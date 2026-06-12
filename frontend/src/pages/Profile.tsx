import React, { useState, useRef } from 'react';
import { User, Mail, Shield, Calendar, MapPin, Phone, Camera, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';

export const API_URL = "http://localhost:3001";

export function Profile() {
  const { user, role, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+351 912 345 678',
    location: user?.location || 'Lisboa, Portugal'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter menos de 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateUser({ avatar: reader.result as string });
        toast.success('Foto de perfil atualizada!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    updateUser({ 
      name: formData.name, 
      email: formData.email,
      phone: formData.phone,
      location: formData.location
    });
    setIsEditing(false);
    toast.success('Perfil atualizado com sucesso!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 lg:p-0">
      <div className="relative h-48 bg-gradient-to-r from-primary to-primary/80 dark:from-primary/90 dark:to-primary/60 rounded-[2.5rem] overflow-hidden group">
        <div className="absolute inset-0 bg-black/10 opacity-50" />
      </div>

      <div className="px-4 sm:px-8 -mt-20 relative z-10">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
            <div 
              className="relative w-32 h-32 bg-gray-100 dark:bg-slate-800 rounded-[2.5rem] border-8 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-gray-400 dark:text-gray-500 transition-all cursor-pointer group hover:scale-105 active:scale-95 overflow-hidden"
              onClick={handlePhotoClick}
            >
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={64} />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                <Camera size={24} />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handlePhotoChange} 
              />
            </div>
            <div className="text-center md:text-left flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 w-full focus:ring-2 focus:ring-primary/20 transition-all font-sans"
                    />
                  </motion.div>
                ) : (
                  <motion.h1 
                    layoutId="profile-name"
                    className="text-3xl font-black text-gray-900 dark:text-white tracking-tight transition-colors truncate"
                  >
                    {user?.name}
                  </motion.h1>
                )}
              </AnimatePresence>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <Shield size={14} /> {role}
                </span>
                <div className="flex items-center gap-2 pl-4 border-l border-gray-200 dark:border-slate-800">
                  <MapPin size={14} className="text-gray-400" />
                  {isEditing ? (
                    <input 
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 w-32 focus:ring-1 focus:ring-primary/20"
                    />
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500 text-sm font-bold transition-colors truncate max-w-[120px]">
                      {user?.location || 'Cidade da Beira, Mocambique'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ ...formData, name: user?.name || '', email: user?.email || '' });
                    }}
                    className="flex-1 md:flex-none px-6 py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex-1 md:flex-none px-6 py-3 bg-primary text-white rounded-2xl font-black text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Salvar
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full md:w-auto px-8 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-black text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg active:scale-95"
                >
                  Editar Perfil
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50 dark:border-slate-800">
            <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] transition-colors">Informações de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
                  <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Email</p>
                    {isEditing ? (
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="text-sm font-bold text-gray-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 w-full"
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{user?.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
                  <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center text-primary shadow-sm flex-shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest transition-colors">Telemóvel</p>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="text-sm font-bold text-gray-900 dark:text-white bg-transparent border-none p-0 focus:ring-0 w-full"
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{user?.phone || '+258 8786 68672'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] transition-colors">Atividade Recente</h3>
              <div className="space-y-3 font-sans">
                {[
                  { action: 'Emitiu Fatura #INV-002', time: 'Há 2 horas' },
                  { action: 'Criou novo cliente: Ana Martins', time: 'Há 1 dia' },
                  { action: 'Alterou configurações do sistema', time: 'Há 3 dias' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-colors group">
                    <div className="w-2 h-2 bg-primary rounded-full group-hover:scale-150 transition-transform" />
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 flex-1 transition-colors">{item.action}</p>
                    <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase transition-colors">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
