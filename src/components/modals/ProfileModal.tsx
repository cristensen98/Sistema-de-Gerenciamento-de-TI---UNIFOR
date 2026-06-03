import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Wrench, User as UserIcon, Mail, Building2, Briefcase, X, LogOut, Camera, Trash2, Save, Phone, Hash, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

export default function ProfileModal({ userId, onClose }: { userId: string, onClose: () => void }) {
  const { user: currentUser, logout, checkAuth, updateUser } = useAuth();
  const navigate = useNavigate();
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editable fields state
  const [contactNumber, setContactNumber] = useState('');
  const [extension, setExtension] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [userRes, branchesRes, deptsRes] = await Promise.all([
          apiFetch(`/api/users/${userId}`),
          apiFetch('/api/branches'),
          apiFetch('/api/departments')
        ]);
        
        if (userRes.ok) {
          const userData = await userRes.json();
          setViewingUser(userData);
          setContactNumber(userData.contactNumber || '');
          setExtension(userData.extension || '');
          setBio(userData.bio || '');
          setAvatarUrl(userData.avatarUrl || null);
        }
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

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate('/login');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg'].includes(file.type)) {
        alert('Por favor, envie um arquivo .PNG ou .JPEG');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!viewingUser) return;
    
    setSaving(true);
    try {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...viewingUser,
          contactNumber,
          extension,
          bio,
          avatarUrl
        })
      });
      
      if (res.ok) {
        // Update global state immediately
        updateUser({
          contactNumber,
          extension,
          bio,
          avatarUrl
        });
        await checkAuth(); // Sync with server
        onClose();
      } else {
        const data = await res.json();
        alert(data.message || 'Erro ao salvar perfil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  if (!userId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
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
                    Meu Perfil
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
              
              <div className="p-8 space-y-8 overflow-y-auto">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center shadow-inner overflow-hidden border-2 border-slate-100 dark:border-slate-800">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={viewingUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon className="w-12 h-12" />
                      )}
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex gap-1">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                        title="Alterar foto"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      {avatarUrl && (
                        <button 
                          onClick={handleRemovePhoto}
                          className="p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                          title="Remover foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".png,.jpg,.jpeg" 
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{viewingUser.name}</h3>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
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
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 opacity-70">
                        <Mail className="w-4 h-4 text-primary" />
                        {viewingUser.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cargo / Função</label>
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 opacity-70">
                        <Briefcase className="w-4 h-4 text-primary" />
                        {viewingUser.jobTitle || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Número para Contato</label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input 
                          type="text"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ramal</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input 
                          type="text"
                          value={extension}
                          onChange={(e) => setExtension(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                          placeholder="0000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Empresa / Filial</label>
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 opacity-70">
                        <Building2 className="w-4 h-4 text-primary" />
                        {branches.find(b => b.id === viewingUser.branchId)?.name || viewingUser.branchId || '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Setor</label>
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 opacity-70">
                        <Building2 className="w-4 h-4 text-primary" />
                        {departments.find(d => d.id === viewingUser.departmentId)?.name || viewingUser.departmentId || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex justify-between">
                    <span>Bio / Resumo</span>
                    <span className={bio.length > 500 ? 'text-red-500' : ''}>{bio.length}/500</span>
                  </label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 500))}
                    rows={4}
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none resize-none transition-all shadow-sm"
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between shrink-0 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
                <div className="flex gap-4">
                  <button 
                    onClick={onClose}
                    className="px-6 py-4 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving || bio.length > 500}
                    className="inline-flex items-center gap-2 px-8 py-4 text-sm font-black uppercase tracking-widest text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Salvar Alterações
                  </button>
                </div>
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
