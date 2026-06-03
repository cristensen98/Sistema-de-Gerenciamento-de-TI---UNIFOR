import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';

export default function NewUser() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetchBranchesAndDepartments();
  }, []);

  const fetchBranchesAndDepartments = async () => {
    try {

      const [branchesRes, deptsRes] = await Promise.all([
        apiFetch('/api/branches'),
        apiFetch('/api/departments')
      ]);
      if (branchesRes.ok) setBranches(await branchesRes.json());
      if (deptsRes.ok) setDepartments(await deptsRes.json());
    } catch (err) {
      console.error('Failed to fetch branches/departments:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      branchId: formData.get('branch'),
      departmentId: formData.get('department'),
      jobTitle: formData.get('jobTitle'),
      contactNumber: formData.get('contactNumber'),
      extension: formData.get('extension'),
      password: formData.get('password')
    };

    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        navigate('/users');
      } else {
        const err = await res.json();
        setError(err.message || 'Erro ao criar usuário');
      }
    } catch (err) {
      console.error('Failed to create user:', err);
      setError('Erro de conexão ao criar usuário. Verifique sua internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Novo Usuário</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Cadastre um novo colaborador, técnico ou administrador</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-10 space-y-8">
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {error}
            </motion.div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
              <input 
                type="text" 
                id="name" 
                name="name"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                placeholder="Ex: João da Silva"
                required 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
              <input 
                type="email" 
                id="email" 
                name="email"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                placeholder="joao@empresa.com"
                required 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="jobTitle" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cargo/Função</label>
              <input 
                type="text" 
                id="jobTitle" 
                name="jobTitle"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                placeholder="Ex: Analista de TI"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="contactNumber" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número para Contato</label>
              <input 
                type="text" 
                id="contactNumber" 
                name="contactNumber"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="extension" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ramal</label>
              <input 
                type="text" 
                id="extension" 
                name="extension"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                placeholder="Ex: 1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label htmlFor="role" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hierarquia (Perfil)</label>
              <select id="role" name="role" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" required>
                <option value="Usuário">Usuário (Apenas abre chamados)</option>
                <option value="Técnico">Técnico (Atende chamados)</option>
                <option value="Administrador">Administrador (Acesso total)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="branch" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Empresa / Filial</label>
              <select id="branch" name="branch" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" required>
                <option value="">Selecione...</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="department" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Setor</label>
              <select id="department" name="department" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" required>
                <option value="">Selecione...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha Inicial</label>
            <input 
              type="password" 
              id="password" 
              name="password"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
              placeholder="••••••••"
              required 
            />
            <p className="text-xs text-slate-500 font-medium italic">O usuário poderá alterar a senha no primeiro acesso.</p>
          </div>

        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4">
          <button 
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-black uppercase tracking-widest text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
}
