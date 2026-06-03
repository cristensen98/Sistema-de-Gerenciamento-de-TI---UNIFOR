import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Wrench, User as UserIcon, Mail, Building2, Briefcase, X, MessageCircle, Phone } from 'lucide-react';
import { User } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';

const RoleIcon = ({ role }: { role: User['role'] }) => {
  switch (role) {
    case 'Administrador':
      return <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    case 'Técnico':
      return <Wrench className="w-4 h-4 text-primary" />;
    default:
      return <UserIcon className="w-4 h-4 text-slate-500" />;
  }
};

export default function ViewUserModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const { user: currentUser } = useAuth();
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, branchesRes, deptsRes] = await Promise.all([
          apiFetch(`/api/users/${userId}`),
          apiFetch('/api/branches'),
          apiFetch('/api/departments')
        ]);
        
        if (userRes.ok) setViewingUser(await userRes.json());
        if (branchesRes.ok) setBranches(await branchesRes.json());
        if (deptsRes.ok) setDepartments(await deptsRes.json());
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  if (!userId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
        >
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : viewingUser ? (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Perfil
                  </h2>
                  {viewingUser.status === 'Inativo' && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg">Inativo</span>
                  )}
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center shadow-inner overflow-hidden border-2 border-slate-100 dark:border-slate-800">
                    {viewingUser.avatarUrl ? (
                      <img src={viewingUser.avatarUrl} alt={viewingUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-10 h-10" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{viewingUser.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <RoleIcon role={viewingUser.role} />
                      <span className={`text-sm font-bold uppercase tracking-widest ${
                        viewingUser.role === 'Administrador' ? 'text-purple-700 dark:text-purple-400' :
                        viewingUser.role === 'Técnico' ? 'text-primary' :
                        'text-slate-500'
                      }`}>
                        {viewingUser.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">E-mail</label>
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Mail className="w-4 h-4 text-primary" />
                        {viewingUser.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cargo / Função</label>
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Briefcase className="w-4 h-4 text-primary" />
                        {viewingUser.jobTitle || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Número para Contato</label>
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        {viewingUser.contactNumber || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ramal</label>
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Phone className="w-4 h-4 text-primary" />
                        {viewingUser.extension || '-'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Empresa / Filial</label>
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Building2 className="w-4 h-4 text-primary" />
                        {branches.find(b => b.id === viewingUser.branchId)?.name || viewingUser.branchId || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Setor</label>
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <Building2 className="w-4 h-4 text-primary" />
                        {departments.find(d => d.id === viewingUser.departmentId)?.name || viewingUser.departmentId || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bio / Resumo</label>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {viewingUser.bio || 'Nenhuma bio informada.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={onClose}
                  className="px-8 py-4 text-sm font-black uppercase tracking-widest text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Usuário não encontrado.
              <div className="mt-4">
                <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg">Fechar</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
