import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Monitor, Laptop, Server, Filter, MoreVertical, Calendar, User, MapPin, Hash, Cpu, Printer, X, HardDrive, Router, Network as NetworkIcon, Wifi, Phone, Video, Globe, Radio, Share2 } from 'lucide-react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Equipment } from '../types';
import { apiFetch } from '../lib/api';

export default function Equipments() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEquipments();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchEquipments = async () => {
    try {
      const res = await apiFetch('/api/equipments');
      if (res.ok) {
        const data = await res.json();
        setEquipments(data);
      }
    } catch (err) {
      console.error('Failed to fetch equipments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/equipments/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setEquipments(prev => prev.filter(eq => eq.id !== id));
        setDeleteConfirmId(null);
        setOpenMenuId(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao excluir equipamento');
      }
    } catch (err) {
      console.error('Failed to delete equipment:', err);
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Adicionar título
    doc.setFontSize(18);
    doc.text('Relatório de Equipamentos', 14, 22);
    
    // Adicionar data
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
    
    // Definir colunas da tabela
    const tableColumn = ["Equipamento", "Tipo", "Série", "Modelo", "IP", "Responsável", "Localização", "Status"];
    
    // Definir linhas da tabela
    const tableRows = filteredEquipments.map(eq => [
      eq.name,
      eq.type,
      eq.serialNumber || '-',
      eq.model || '-',
      eq.ipAddress || '-',
      eq.responsible || '-',
      `${(eq as any).branchName || 'N/A'} - ${(eq as any).departmentName || 'N/A'}`,
      eq.status
    ]);

    // Gerar tabela
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }, // cor primária aproximada
    });

    // Salvar o PDF
    doc.save(`equipamentos_${new Date().getTime()}.pdf`);
  };

  const filteredEquipments = equipments.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         eq.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.macAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.responsible?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Desduplicar equipamentos por ID para evitar avisos de key do React
  const uniqueEquipments = Array.from(new Map(filteredEquipments.map(e => [e.id, e])).values()) as typeof filteredEquipments;

  const getStatusStyles = (status: Equipment['status']) => {
    switch (status) {
      case 'Ativo': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'Inativo': return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'Manutenção': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
      case 'Descartado': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'Desktop': return <Monitor className="w-5 h-5" />;
      case 'Servidor': return <Server className="w-5 h-5" />;
      case 'Notebook': return <Laptop className="w-5 h-5" />;
      case 'Switch': return <Share2 className="w-5 h-5" />;
      case 'Roteador': return <Router className="w-5 h-5" />;
      case 'Impressora': return <Printer className="w-5 h-5" />;
      case 'Rede cabeada': return <NetworkIcon className="w-5 h-5" />;
      case 'Rede Wifi': return <Wifi className="w-5 h-5" />;
      case 'PABX': return <Phone className="w-5 h-5" />;
      case 'DVR': return <Video className="w-5 h-5" />;
      case 'Gateway': return <Globe className="w-5 h-5" />;
      case 'Broadcast': return <Radio className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Equipamentos</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Gerencie o inventário de hardware da instituição</p>
        </div>
        <Link 
          to="/equipments/new" 
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Equipamento
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por nome, série, modelo ou responsável..." 
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-slate-200 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-4">
          <select 
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Manutenção">Manutenção</option>
            <option value="Descartado">Descartado</option>
          </select>

          <button 
            onClick={handlePrint}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-all shadow-sm active:scale-90 flex items-center gap-2"
            title="Imprimir Relatório"
          >
            <Printer className="w-5 h-5" />
            <span className="hidden sm:inline font-bold text-sm">Imprimir</span>
          </button>

          <button className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-primary transition-all shadow-sm active:scale-90">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Visualização em Tabela (Desktop) */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-8 py-6 font-black">Equipamento</th>
                <th scope="col" className="px-8 py-6 font-black">Série / Modelo</th>
                <th scope="col" className="px-8 py-6 font-black">IP</th>
                <th scope="col" className="px-8 py-6 font-black">Responsável</th>
                <th scope="col" className="px-8 py-6 font-black">Localização</th>
                <th scope="col" className="px-8 py-6 font-black">Status</th>
                <th scope="col" className="px-8 py-6 text-right font-black">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {uniqueEquipments.map((eq) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={`table-${eq.id}`} 
                    onClick={() => setSearchParams({ viewEquipment: eq.id })}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 group-hover:scale-110 group-hover:bg-primary/10 transition-all shadow-inner">
                          {getEquipmentIcon(eq.type)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{eq.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{eq.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-600 dark:text-slate-400">
                          <Hash className="w-3 h-3" />
                          {eq.serialNumber || 'N/A'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                          <Cpu className="w-3 h-3" />
                          {eq.model || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-slate-600 dark:text-slate-400">
                        {eq.ipAddress || '-'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3 font-bold">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {eq.responsible?.charAt(0) || '?'}
                        </div>
                        <span className="text-slate-700 dark:text-slate-300">{eq.responsible || '-'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-slate-700 dark:text-slate-300 font-black">{(eq as any).branchName || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{(eq as any).departmentName || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(eq.status)}`}>
                        {eq.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === eq.id ? null : eq.id); }}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-90"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      <AnimatePresence>
                        {openMenuId === eq.id && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-6 top-12 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
                          >
                            {deleteConfirmId === eq.id ? (
                              <div className="p-4 space-y-3 bg-red-50 dark:bg-red-900/10">
                                <p className="text-xs font-bold text-red-700 dark:text-red-400 text-center uppercase tracking-wider">Confirmar Exclusão?</p>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                    className="flex-1 px-2 py-2 text-[10px] font-bold bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    NÃO
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(eq.id); }}
                                    className="flex-1 px-2 py-2 text-[10px] font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                  >
                                    SIM
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="py-1">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); navigate(`/equipments/edit/${eq.id}`); setOpenMenuId(null); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-slate-400" />
                                  Editar
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(eq.id); }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-t border-slate-100 dark:border-slate-800"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                  Excluir
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visualização em Cards (Mobile) */}
      <div className="grid grid-cols-1 gap-6 lg:hidden">
        <AnimatePresence mode="popLayout">
          {uniqueEquipments.map((eq) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={`card-${eq.id}`} 
              onClick={() => setSearchParams({ viewEquipment: eq.id })}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
                    {getEquipmentIcon(eq.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{eq.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{eq.type}</p>
                  </div>
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === eq.id ? null : eq.id); }}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all active:scale-90"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  <AnimatePresence>
                    {openMenuId === eq.id && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        ref={menuRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                      >
                        {deleteConfirmId === eq.id ? (
                          <div className="p-4 space-y-3 bg-red-50 dark:bg-red-900/10">
                            <p className="text-xs font-black text-red-700 dark:text-red-400 text-center uppercase tracking-widest">Excluir?</p>
                            <div className="flex gap-2">
                              <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }} className="flex-1 px-2 py-2 text-[10px] font-black bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl">NÃO</button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(eq.id); }} className="flex-1 px-2 py-2 text-[10px] font-black bg-red-600 text-white rounded-xl">SIM</button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-1">
                            <button onClick={(e) => { e.stopPropagation(); navigate(`/equipments/edit/${eq.id}`); setOpenMenuId(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                              <Edit2 className="w-4 h-4 text-slate-400" /> Editar
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(eq.id); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-t border-slate-100 dark:border-slate-800">
                              <Trash2 className="w-4 h-4 text-red-400" /> Excluir
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-50 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Série / Modelo</p>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{eq.serialNumber || 'N/A'}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{eq.model || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                      {eq.responsible?.charAt(0) || '?'}
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{eq.responsible || '-'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização</p>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300">{(eq as any).branchName || 'N/A'}</span>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{(eq as any).departmentName || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(eq.status)}`}>
                    {eq.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  MAC: {eq.macAddress || '-'}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredEquipments.length === 0 && (
        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nenhum equipamento encontrado</h3>
          <p className="text-slate-500 mt-2 font-medium italic">Tente ajustar seus filtros ou termo de busca.</p>
        </div>
      )}
    </div>
  );
}
