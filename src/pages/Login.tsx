import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiFetch } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { systemName, systemNameFontSize, systemNameTextColor, logoUrl } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user);
        navigate('/');
      } else {
        setError(data.message || 'Credenciais inválidas');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      {/* Elementos Decorativos de Fundo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-10 border border-slate-100 dark:border-slate-800 relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20 overflow-hidden"
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <ShieldCheck className="text-white w-12 h-12" />
            )}
          </motion.div>
          <h1 
            className="font-black tracking-tight text-center text-black dark:text-white"
            style={{ fontSize: `${systemNameFontSize}px` }}
          >
            {systemName}
          </h1>
          <p className="text-black dark:text-white text-sm mt-2 font-medium text-center opacity-60">Sistema Integrado de Suporte de T.I</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 flex items-center gap-3 rounded-r-xl"
            >
              <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-black dark:text-white ml-1">
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none dark:text-white shadow-inner"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-black dark:text-white ml-1">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none dark:text-white shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Acessar Sistema
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[10px] uppercase tracking-widest font-bold text-black dark:text-white opacity-40">
            © 2026 HPSVP - Núcleo de Tecnologia da Informação
          </p>
        </div>
      </motion.div>
    </div>
  );
}
