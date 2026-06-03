import React, { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Shield, Wrench, User as UserIcon, Search, Filter, Mail, Building2, Briefcase, Edit2, Trash2, Power, X, Save, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

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

export default function Users() {
  const { user: currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchBranchesAndDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      
      const res = await apiFetch('/api/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

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

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = user.status === 'Ativo' ? 'Inativo' : 'Ativo';
      const res = await apiFetch(`/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao alterar status');
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/users/${id}`, { 
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao excluir usuário');
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

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
      bio: formData.get('bio'),
      avatarUrl: editingUser.avatarUrl, // Mantém a foto atual
      password: formData.get('password') || undefined // Enviar apenas se fornecido
    };

    try {
      const res = await apiFetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        const err = await res.json();
        setEditError(err.message || 'Erro ao atualizar usuário');
      }
    } catch (err) {
      console.error('Failed to update user:', err);
      setEditError('Erro de conexão ao atualizar usuário');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'Todos' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Desduplicar usuários por ID para evitar avisos de key do React
  const uniqueUsers = Array.from(new Map(filteredUsers.map(u => [u.id, u])).values()) as typeof filteredUsers;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Usuários</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Gerencie os acessos e permissões do sistema</p>
        </div>
        <Link 
          to="/users/new" 
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Usuário
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-slate-200 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <select 
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="Todos">Todos os Papéis</option>
            <option value="Administrador">Administrador</option>
            <option value="Técnico">Técnico</option>
            <option value="Usuário">Usuário</option>
          </select>

          <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-all shadow-sm active:scale-90">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Visualização em Tabela (Desktop) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-8 py-6 font-black">Usuário</th>
                <th scope="col" className="px-8 py-6 font-black">Hierarquia</th>
                <th scope="col" className="px-8 py-6 font-black">Empresa/Filial</th>
                <th scope="col" className="px-8 py-6 font-black">Setor</th>
                <th scope="col" className="px-8 py-6 text-right font-black">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {uniqueUsers.map((user) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={`table-${user.id}`} 
                    onClick={() => setSearchParams({ viewUser: user.id })}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group ${user.status === 'Inativo' ? 'opacity-60' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:rotate-6 transition-all duration-300 shadow-inner overflow-hidden border border-slate-200 dark:border-slate-800">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <UserIcon className="w-6 h-6 group-hover:text-primary" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{user.name}</p>
                            {user.status === 'Inativo' && (
                              <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg">Inativo</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <RoleIcon role={user.role} />
                        <span className={`font-bold ${
                          user.role === 'Administrador' ? 'text-purple-700 dark:text-purple-400' :
                          user.role === 'Técnico' ? 'text-primary' :
                          'text-slate-700 dark:text-slate-300'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-slate-700 dark:text-slate-300 font-bold">
                      {branches.find(b => b.id === user.branchId)?.name || user.branchId || '-'}
                    </td>
                    <td className="px-8 py-6 text-slate-700 dark:text-slate-300 font-bold">
                      {departments.find(d => d.id === user.departmentId)?.name || user.departmentId || '-'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!(currentUser?.role === 'Técnico' && user.role === 'Administrador') && (
                          <div className="flex items-center gap-2">
                            {deleteConfirmId === user.id ? (
                              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1 rounded-xl border border-red-100 dark:border-red-900/30">
                                <span className="text-[10px] font-black text-red-600 dark:text-red-400 px-2 uppercase tracking-widest">Excluir?</span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                  className="px-3 py-1.5 text-[10px] font-black bg-white dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-50 transition-all"
                                >
                                  NÃO
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }}
                                  className="px-3 py-1.5 text-[10px] font-black bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm"
                                >
                                  SIM
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setEditingUser(user); }}
                                  className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                  title="Editar"
                                >
                                  <Edit2 className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }}
                                  className={`p-2 rounded-xl transition-all ${user.status === 'Inativo' ? 'text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10' : 'text-green-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10'}`}
                                  title={user.status === 'Inativo' ? 'Ativar' : 'Desativar'}
                                >
                                  <Power className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(user.id); }}
                                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualização em Cards (Mobile) */}
      <div className="grid grid-cols-1 gap-6 md:hidden">
        <AnimatePresence mode="popLayout">
          {uniqueUsers.map((user) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={`card-${user.id}`} 
              onClick={() => setSearchParams({ viewUser: user.id })}
              className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 cursor-pointer ${user.status === 'Inativo' ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner overflow-hidden border border-slate-200 dark:border-slate-800">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <UserIcon className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{user.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-black uppercase tracking-widest">
                      <RoleIcon role={user.role} />
                      <span className={
                        user.role === 'Administrador' ? 'text-purple-600 dark:text-purple-400' :
                        user.role === 'Técnico' ? 'text-primary' :
                        'text-slate-500'
                      }>
                        {user.role}
                      </span>
                      {user.status === 'Inativo' && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg ml-2">Inativo</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!(currentUser?.role === 'Técnico' && user.role === 'Administrador') && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); setEditingUser(user); }} className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }} className={`p-2 rounded-xl transition-all ${user.status === 'Inativo' ? 'text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800' : 'text-green-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        <Power className="w-5 h-5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 pt-6 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4 text-primary" />
                  {user.email}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                  <Building2 className="w-4 h-4 text-primary" />
                  {branches.find(b => b.id === user.branchId)?.name || user.branchId || '-'}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                  <Briefcase className="w-4 h-4 text-primary" />
                  {departments.find(d => d.id === user.departmentId)?.name || user.departmentId || '-'}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredUsers.length === 0 && (
        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nenhum usuário encontrado</h3>
          <p className="text-slate-500 mt-2 font-medium italic">Tente ajustar seus filtros ou termo de busca.</p>
        </div>
      )}

      {/* Modal de Edição de Usuário */}
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Editar Usuário</h2>
                <button 
                  onClick={() => {
                    setEditingUser(null);
                    setEditError(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                {editError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {editError}
                  </motion.div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                    <input 
                      type="text" 
                      name="name"
                      value={editingUser.name || ''}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail</label>
                    <input 
                      type="email" 
                      name="email"
                      value={editingUser.email || ''}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cargo/Função</label>
                    <input 
                      type="text" 
                      name="jobTitle"
                      value={editingUser.jobTitle || ''}
                      onChange={(e) => setEditingUser({...editingUser, jobTitle: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número para Contato</label>
                    <input 
                      type="text" 
                      name="contactNumber"
                      value={editingUser.contactNumber || ''}
                      onChange={(e) => setEditingUser({...editingUser, contactNumber: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ramal</label>
                    <input 
                      type="text" 
                      name="extension"
                      value={editingUser.extension || ''}
                      onChange={(e) => setEditingUser({...editingUser, extension: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bio / Resumo</label>
                    <textarea 
                      name="bio"
                      value={editingUser.bio || ''}
                      onChange={(e) => setEditingUser({...editingUser, bio: e.target.value.slice(0, 500)})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all resize-none" 
                      rows={2}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Hierarquia</label>
                    <select 
                      name="role"
                      value={editingUser.role || 'Usuário'}
                      onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                      required
                    >
                      <option value="Usuário">Usuário</option>
                      <option value="Técnico">Técnico</option>
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Empresa / Filial</label>
                    <select 
                      name="branch"
                      value={editingUser.branchId || ''}
                      onChange={(e) => setEditingUser({...editingUser, branchId: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Setor</label>
                    <select 
                      name="department"
                      value={editingUser.departmentId || ''}
                      onChange={(e) => setEditingUser({...editingUser, departmentId: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nova Senha (opcional)</label>
                  <input 
                    type="password" 
                    name="password"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                    placeholder="Deixe em branco para manter a atual"
                  />
                </div>

                <div className="pt-6 flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      setEditError(null);
                    }}
                    className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
