import React, { useState, useEffect, useRef } from 'react';
import { Filter, MoreHorizontal, MoreVertical, Plus, Search, Calendar, User, UserCheck, Play, Edit2, CheckCircle, XCircle, Trash2, X, Save } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

export default function Tickets() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const calculateItemsPerPage = () => {
      const height = window.innerHeight;
      // Cálculo base: a 800px de altura queremos 10 itens.
      // A cada ~60px de altura extra permite mais um item.
      const calculated = Math.floor((height - 200) / 60);
      const clamped = Math.max(10, Math.min(15, calculated));
      setItemsPerPage(clamped);
    };

    calculateItemsPerPage();
    window.addEventListener('resize', calculateItemsPerPage);
    return () => window.removeEventListener('resize', calculateItemsPerPage);
  }, []);

  const [attendingTicket, setAttendingTicket] = useState<any | null>(null);
  const [finishingTicket, setFinishingTicket] = useState<any | null>(null);
  const [closingTicket, setClosingTicket] = useState<any | null>(null);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
    fetchUsers();
    fetchEquipments();
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await apiFetch('/api/incidents');
      if (res.ok) {
        setIncidents(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    }
  };

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

  const fetchEquipments = async () => {
    try {
      const res = await apiFetch('/api/equipments');
      if (res.ok) {
        setEquipments(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch equipments:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await apiFetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.map((t: any) => {
          let parsedTechIds = [];
          if (t.technicianIds) {
            try {
              parsedTechIds = typeof t.technicianIds === 'string' ? JSON.parse(t.technicianIds) : t.technicianIds;
            } catch (e) {
              console.error('Error parsing technicianIds for ticket', t.id, e);
              parsedTechIds = [];
            }
          }
          return {
            ...t,
            technicianIds: Array.isArray(parsedTechIds) ? parsedTechIds : []
          };
        }));
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Lidar com a mudança de filtro e redefinir a página
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Calcular paginação
  const filteredTickets = tickets.filter(t => {
    const isOwner = t.requesterId === user?.id;
    const canView = user?.role === 'Administrador' || user?.role === 'Técnico' || isOwner;
    if (!canView) return false;

    const matchesStatus = statusFilter === 'Todos' 
      ? ((user?.role === 'Administrador' || user?.role === 'Técnico') 
          ? !['Resolvido', 'Encerrado'].includes(t.status) 
          : true)
      : t.status === statusFilter;

    const matchesDate = (() => {
      if (!dateFilter.start && !dateFilter.end) return true;
      if (!t.createdAt) return false;
      const ticketDate = t.createdAt.split('T')[0];
      if (dateFilter.start && ticketDate < dateFilter.start) return false;
      if (dateFilter.end && ticketDate > dateFilter.end) return false;
      return true;
    })();

    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(searchTermLower) || 
                         t.id.toLowerCase().includes(searchTermLower) ||
                         (t.requester && t.requester.toLowerCase().includes(searchTermLower)) ||
                         (t.requesterDisplayName && t.requesterDisplayName.toLowerCase().includes(searchTermLower)) ||
                         (t.departmentName && t.departmentName.toLowerCase().includes(searchTermLower)) ||
                         (t.branchName && t.branchName.toLowerCase().includes(searchTermLower)) ||
                         (t.priority && t.priority.toLowerCase().includes(searchTermLower)) ||
                         (t.createdAt && t.createdAt.toLowerCase().includes(searchTermLower));

    return matchesStatus && matchesSearch && matchesDate;
  });

  // Desduplicar chamados por ID para evitar avisos de key do React
  const uniqueFilteredTickets = Array.from(new Map(filteredTickets.map(t => [t.id, t])).values()) as typeof filteredTickets;

  const totalPages = Math.ceil(uniqueFilteredTickets.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [itemsPerPage, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTickets = uniqueFilteredTickets.slice(startIndex, endIndex);

  const handleAction = async (ticketId: string, action: string, data: any = {}) => {
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        fetchTickets();
        setAttendingTicket(null);
        setFinishingTicket(null);
        setClosingTicket(null);
        setEditingTicket(null);
      } else {
        const err = await res.json();
        alert(err.message || `Erro ao ${action} chamado`);
      }
    } catch (err) {
      console.error(`Failed to ${action} ticket:`, err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/tickets/${id}`, { 
        method: 'DELETE'
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        fetchTickets();
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao excluir chamado');
      }
    } catch (err) {
      console.error('Failed to delete ticket:', err);
    }
  };

  const canEdit = (t: any) => user?.role === 'Administrador' || t.requesterId === user?.id;
  const canAttend = (t: any) => (user?.role === 'Administrador' || user?.role === 'Técnico') && t.status === 'Aberto';
  const canFinish = (t: any) => (user?.role === 'Administrador' || user?.role === 'Técnico') && t.status === 'Em Andamento';
  const canClose = (t: any) => (user?.role === 'Administrador' || user?.role === 'Técnico') && (t.status === 'Resolvido' || t.status === 'Em Andamento');
  const canDelete = () => user?.role === 'Administrador';

  const EquipmentSelector = ({ value, onChange, equipments }: { value: string, onChange: (id: string) => void, equipments: any[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedEquipment = equipments.find(e => e.id === value);

    const filteredEquipments = equipments.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.assetNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={dropdownRef}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl p-4 outline-none transition-all cursor-pointer flex justify-between items-center shadow-sm hover:border-primary/50"
        >
          <span className={!selectedEquipment ? 'text-slate-400' : ''}>
            {selectedEquipment ? `${selectedEquipment.name} (${selectedEquipment.assetNumber || 'S/N'})` : 'Selecionar Equipamento'}
          </span>
          <Search className="w-4 h-4 text-slate-400" />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-[110] top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Pesquisar equipamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full px-6 py-3 text-left text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800"
                >
                  Nenhum equipamento
                </button>
                {filteredEquipments.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => {
                      onChange(e.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="w-full px-6 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <span>{e.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                      {e.type} - {e.assetNumber || 'S/N'}
                    </span>
                  </button>
                ))}
                {filteredEquipments.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm italic">
                    Nenhum equipamento encontrado
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <input type="hidden" name="equipmentId" value={value} />
      </div>
    );
  };

  const IncidentSelector = ({ value, onChange, incidents }: { value: string, onChange: (id: string) => void, incidents: any[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedIncident = incidents.find(i => i.id === value);

    const filteredIncidents = incidents.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={dropdownRef}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl p-4 outline-none transition-all cursor-pointer flex justify-between items-center shadow-sm hover:border-primary/50"
        >
          <span className={!selectedIncident ? 'text-slate-400' : ''}>
            {selectedIncident ? selectedIncident.name : 'Selecionar Incidente / Problema'}
          </span>
          <Search className="w-4 h-4 text-slate-400" />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute z-[110] top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Pesquisar incidente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none text-sm font-bold rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-primary/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full px-6 py-3 text-left text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800"
                >
                  Nenhum incidente
                </button>
                {filteredIncidents.map(i => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => {
                      onChange(i.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className="w-full px-6 py-3 text-left text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col border-b border-slate-50 dark:border-slate-800 last:border-0"
                  >
                    <span>{i.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                      SLA: {i.sla}h - Prioridade: {i.priority}
                    </span>
                  </button>
                ))}
                {filteredIncidents.length === 0 && (
                  <div className="px-6 py-8 text-center text-slate-400 text-sm italic">
                    Nenhum incidente encontrado
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Chamados</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Gerencie e acompanhe os incidentes e requisições</p>
        </div>
        <Link 
          to="/tickets/new" 
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
          Novo Chamado
        </Link>
      </div>

      {/* Filtros e Busca */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por ID, título, solicitante, setor, local, prioridade ou data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all dark:text-slate-200 shadow-sm"
          />
        </div>
        
        <div className="flex gap-4">
          <select 
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all"
            value={statusFilter}
            onChange={handleFilterChange}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Aberto">Aberto</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Resolvido">Resolvido</option>
            <option value="Encerrado">Encerrado</option>
          </select>

          <div className="relative flex gap-2">
            {showDateFilter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                className="absolute right-full mr-2 top-0 bottom-0 flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl z-50"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2">De</span>
                  <input 
                    type="date" 
                    value={dateFilter.start}
                    onChange={(e) => {
                      setDateFilter(prev => ({ ...prev, start: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-2">Até</span>
                  <input 
                    type="date" 
                    value={dateFilter.end}
                    onChange={(e) => {
                      setDateFilter(prev => ({ ...prev, end: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                {(dateFilter.start || dateFilter.end) && (
                  <button 
                    onClick={() => {
                      setDateFilter({ start: '', end: '' });
                      setCurrentPage(1);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    title="Limpar período"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
            <button 
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all shadow-sm active:scale-90 ${showDateFilter || dateFilter.start || dateFilter.end ? 'text-primary border-primary/50' : 'text-slate-500 hover:text-primary'}`}
              title="Filtrar por período"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Visualização em Tabela (Desktop) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
            <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-4 py-4 font-black">ID</th>
                <th scope="col" className="px-4 py-4 font-black">Título</th>
                <th scope="col" className="px-4 py-4 font-black">Solicitante</th>
                <th scope="col" className="px-4 py-4 font-black">Setor</th>
                <th scope="col" className="px-4 py-4 font-black">Local</th>
                <th scope="col" className="px-4 py-4 font-black">Técnico</th>
                <th scope="col" className="px-4 py-4 font-black">Prioridade</th>
                <th scope="col" className="px-4 py-4 font-black">Status</th>
                <th scope="col" className="px-4 py-4 font-black">Data e Hora</th>
                <th scope="col" className="px-4 py-4 text-right font-black">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {currentTickets.map((ticket) => (
                  <motion.tr 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={`table-${ticket.id}`} 
                    onClick={() => setSearchParams({ viewTicket: ticket.id })}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
                  >
                    <td className="px-4 py-4 font-black text-primary whitespace-nowrap">
                      {ticket.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-black text-slate-900 dark:text-slate-100 mb-1 group-hover:text-primary transition-colors">{ticket.title}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                        {ticket.incidentName || 'Não informado'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 font-bold text-slate-700 dark:text-slate-300">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                          {ticket.requester?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span>{ticket.requesterDisplayName || ticket.requester}</span>
                          {ticket.requesterJobTitle && (
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{ticket.requesterJobTitle}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        {ticket.departmentName || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
                        {ticket.branchName || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-400">
                        <UserCheck className="w-4 h-4 text-slate-400" />
                        {ticket.technicianIds && ticket.technicianIds.length > 0 ? (
                          <div className="flex flex-col">
                            {ticket.technicianIds.map((id: string, index: number) => {
                              const tech = users.find(u => u.id === id);
                              return <span key={`${id}-${index}`} className="text-xs">{tech?.name || 'Técnico'}</span>;
                            })}
                          </div>
                        ) : (
                          <span>{ticket.technician || 'Não atribuído'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest
                        ${ticket.priority === 'Urgente' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          ticket.priority === 'Alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                          ticket.priority === 'Média' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest
                        ${ticket.status === 'Aberto' ? 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                          ticket.status === 'Em Andamento' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800' : 
                          ticket.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                          ticket.status === 'Encerrado' ? 'bg-slate-100 text-slate-700 border border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' :
                          'bg-slate-100 text-slate-700 border border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right relative">
                      <div className="flex items-center justify-end">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === ticket.id ? null : ticket.id);
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        <AnimatePresence>
                          {openMenuId === ticket.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-8 top-14 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 overflow-hidden"
                            >
                              {canAttend(ticket) && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setAttendingTicket(ticket); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex items-center gap-2"
                                >
                                  <Play className="w-4 h-4" /> Atender
                                </button>
                              )}
                              {canFinish(ticket) && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setFinishingTicket(ticket); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" /> Finalizar
                                </button>
                              )}
                              {canClose(ticket) && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setClosingTicket(ticket); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" /> Encerrar
                                </button>
                              )}
                              {canEdit(ticket) && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setEditingTicket(ticket); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-left text-sm font-bold text-primary hover:bg-primary/5 flex items-center gap-2"
                                >
                                  <Edit2 className="w-4 h-4" /> Editar
                                </button>
                              )}
                              {canDelete() && (
                                <div className="flex items-center">
                                  {deleteConfirmId === ticket.id ? (
                                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 p-1 rounded-xl border border-red-100 dark:border-red-900/30 mx-2">
                                      <span className="text-[10px] font-black text-red-600 dark:text-red-400 px-2 uppercase tracking-widest">Excluir?</span>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(null); }}
                                        className="px-3 py-1.5 text-[10px] font-black bg-white dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-50 transition-all"
                                      >
                                        NÃO
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id); }}
                                        className="px-3 py-1.5 text-[10px] font-black bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm"
                                      >
                                        SIM
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(ticket.id); setOpenMenuId(null); }}
                                      className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-4 h-4" /> Excluir
                                    </button>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
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
          {currentTickets.map((ticket) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={`card-${ticket.id}`} 
              onClick={() => setSearchParams({ viewTicket: ticket.id })}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-primary uppercase tracking-widest">{ticket.id}</span>
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest
                    ${ticket.priority === 'Urgente' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      ticket.priority === 'Alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                      ticket.priority === 'Média' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {ticket.priority}
                  </span>
                </div>
                <div className="flex items-center gap-1 relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === `mobile-${ticket.id}` ? null : `mobile-${ticket.id}`);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  <AnimatePresence>
                    {openMenuId === `mobile-${ticket.id}` && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 overflow-hidden"
                      >
                        {canAttend(ticket) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setAttendingTicket(ticket); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" /> Atender
                          </button>
                        )}
                        {canFinish(ticket) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setFinishingTicket(ticket); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Finalizar
                          </button>
                        )}
                        {canClose(ticket) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setClosingTicket(ticket); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" /> Encerrar
                          </button>
                        )}
                        {canEdit(ticket) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setEditingTicket(ticket); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-primary hover:bg-primary/5 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" /> Editar
                          </button>
                        )}
                        {canDelete() && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(ticket.id); setOpenMenuId(null); }}
                            className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{ticket.title}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    {ticket.requesterDisplayName || ticket.requester}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(ticket.createdAt).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    {ticket.incidentName || 'Não informado'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black">
                    {ticket.technicianIds && ticket.technicianIds.length > 0 
                      ? users.find(u => u.id === ticket.technicianIds[0])?.name?.charAt(0) || '?'
                      : ticket.technician?.charAt(0) || '?'}
                  </div>
                  {ticket.technicianIds && ticket.technicianIds.length > 0 
                    ? `${ticket.technicianIds.length} Técnico(s)`
                    : ticket.technician || 'Não atribuído'}
                </div>
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest
                  ${ticket.status === 'Aberto' ? 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                    ticket.status === 'Em Andamento' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800' : 
                    ticket.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                    ticket.status === 'Encerrado' ? 'bg-slate-100 text-slate-700 border border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' :
                    'bg-slate-100 text-slate-700 border border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                  {ticket.status}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Paginação */}
      {filteredTickets.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span className="order-2 sm:order-1">
            Mostrando <span className="text-slate-900 dark:text-white">{startIndex + 1}</span> a <span className="text-slate-900 dark:text-white">{Math.min(endIndex, filteredTickets.length)}</span> de <span className="text-slate-900 dark:text-white">{filteredTickets.length}</span> chamados
          </span>
          <div className="flex gap-3 order-1 sm:order-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              Anterior
            </button>
            
            <div className="hidden sm:flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button 
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-12 h-12 rounded-2xl border transition-all shadow-sm font-black ${
                    currentPage === page 
                      ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {filteredTickets.length === 0 && (
        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Nenhum chamado encontrado</h3>
          <p className="text-slate-500 mt-2 font-medium italic">Tente ajustar seus filtros ou termo de busca.</p>
        </div>
      )}

      {/* Modal de Ação do Chamado */}
      <AnimatePresence>
        {(attendingTicket || finishingTicket || closingTicket || editingTicket) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {attendingTicket ? 'Atender Chamado' : 
                   finishingTicket ? 'Finalizar Chamado' : 
                   closingTicket ? 'Encerrar Chamado' : 
                   'Editar Chamado'}
                </h2>
                <button 
                  onClick={() => {
                    setAttendingTicket(null);
                    setFinishingTicket(null);
                    setClosingTicket(null);
                    setEditingTicket(null);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                {/* O formulário será construído aqui */}
                <form id="ticket-action-form" onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const activeTicket = attendingTicket || finishingTicket || closingTicket || editingTicket;
                  
                  const data: any = {};
                  
                  const selectedTechs = Array.from(formData.getAll('technicianIds'));
                  if (selectedTechs.length > 0) {
                    data.technicianIds = JSON.stringify(selectedTechs);
                    data.technician = selectedTechs.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ');
                  }

                  if (editingTicket) {
                    data.title = formData.get('title');
                    data.description = formData.get('description');
                    data.priority = formData.get('priority');
                    data.incidentId = editingTicket.incidentId || null;
                    data.equipmentId = formData.get('equipmentId') || null;
                    data.technicalObservations = formData.get('technicalObservations');
                  }
                  
                  if (attendingTicket) {
                    data.status = 'Em Andamento';
                    data.startedAt = new Date().toISOString();
                    data.technicalObservations = formData.get('technicalObservations');
                  }
                  
                  if (finishingTicket) {
                    data.status = 'Resolvido';
                    data.solution = formData.get('solution');
                    data.finishedAt = new Date().toISOString();
                    data.equipmentId = formData.get('equipmentId') || null;
                    data.technicalObservations = formData.get('technicalObservations');
                  }
                  
                  if (closingTicket) {
                    data.status = 'Encerrado';
                    data.solution = formData.get('solution');
                    data.closedAt = new Date().toISOString();
                    data.equipmentId = formData.get('equipmentId') || null;
                    data.technicalObservations = formData.get('technicalObservations');
                  }

                  handleAction(activeTicket.id, attendingTicket ? 'atender' : finishingTicket ? 'finalizar' : closingTicket ? 'encerrar' : 'editar', data);
                }} className="space-y-6">
                  
                  {/* Detalhes apenas de leitura para Atender/Finalizar/Encerrar */}
                  {(attendingTicket || finishingTicket || closingTicket) && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Solicitante</label>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{(attendingTicket || finishingTicket || closingTicket).requesterDisplayName || (attendingTicket || finishingTicket || closingTicket).requester}</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Título</label>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{(attendingTicket || finishingTicket || closingTicket).title}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Descrição Original</label>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{(attendingTicket || finishingTicket || closingTicket).description}</p>
                      </div>
                    </div>
                  )}

                  {/* Campos de Edição */}
                  {editingTicket && (
                    <>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Solicitante</label>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{editingTicket.requesterDisplayName || editingTicket.requester}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título</label>
                        <input 
                          type="text" 
                          name="title"
                          defaultValue={editingTicket.title}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                          required 
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Incidente / Problema</label>
                          <IncidentSelector 
                            value={editingTicket.incidentId || ''}
                            onChange={(id) => {
                              const incident = incidents.find(i => i.id === id);
                              if (incident) {
                                setEditingTicket({
                                  ...editingTicket, 
                                  incidentId: id,
                                  priority: incident.priority
                                });
                              } else {
                                setEditingTicket({
                                  ...editingTicket, 
                                  incidentId: id
                                });
                              }
                            }}
                            incidents={incidents}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prioridade</label>
                          <select 
                            name="priority"
                            defaultValue={editingTicket.priority}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                            required
                          >
                            <option value="Baixa">Baixa</option>
                            <option value="Média">Média</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Atribuir a Técnicos</label>
                        <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 space-y-1">
                          {users.filter(u => u.role === 'Técnico' || u.role === 'Administrador').map(u => (
                            <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-all">
                              <input 
                                type="checkbox" 
                                name="technicianIds" 
                                value={u.id}
                                defaultChecked={editingTicket.technicianIds?.includes(u.id)}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{u.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Equipamento</label>
                        <EquipmentSelector 
                          value={editingTicket.equipmentId || ''}
                          onChange={(id) => setEditingTicket({...editingTicket, equipmentId: id})}
                          equipments={equipments}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição</label>
                        <textarea 
                          name="description"
                          value={editingTicket.description || ''}
                          onChange={(e) => setEditingTicket({...editingTicket, description: e.target.value})}
                          rows={4}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none resize-none transition-all" 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observações Técnicas</label>
                        <textarea 
                          name="technicalObservations"
                          defaultValue={editingTicket.technicalObservations || ''}
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none resize-none transition-all" 
                        />
                      </div>
                    </>
                  )}

                  {/* Campos de Atendimento */}
                  {attendingTicket && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Atribuir a (Selecione um ou mais)</label>
                          <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 space-y-1">
                            {users.filter(u => u.role === 'Técnico' || u.role === 'Administrador').map(u => (
                              <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-all">
                                <input 
                                  type="checkbox" 
                                  name="technicianIds" 
                                  value={u.id}
                                  defaultChecked={u.id === user?.id || attendingTicket.technicianIds?.includes(u.id)}
                                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{u.name} {u.id === user?.id && '(Você)'}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Início do Atendimento</label>
                          <input 
                            type="text" 
                            value={new Date().toLocaleString('pt-BR')}
                            disabled
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold rounded-2xl block p-4 outline-none cursor-not-allowed" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observações Técnicas</label>
                        <textarea 
                          name="technicalObservations"
                          defaultValue={attendingTicket.technicalObservations || ''}
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none resize-none transition-all" 
                        />
                      </div>
                    </>
                  )}

                  {/* Campos de Finalização / Encerramento */}
                  {(finishingTicket || closingTicket) && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Início do Atendimento</label>
                          <input 
                            type="text" 
                            value={(finishingTicket || closingTicket)?.startedAt ? new Date((finishingTicket || closingTicket).startedAt).toLocaleString('pt-BR') : '-'}
                            readOnly
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold rounded-2xl block p-4 outline-none cursor-not-allowed" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fim do Atendimento</label>
                          <input 
                            type="text" 
                            value={new Date().toLocaleString('pt-BR')}
                            readOnly
                            className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold rounded-2xl block p-4 outline-none cursor-not-allowed" 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Técnicos Responsáveis</label>
                        <div className="max-h-40 overflow-y-auto bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-2 space-y-1">
                          {users.filter(u => u.role === 'Técnico' || u.role === 'Administrador').map(u => (
                            <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-all">
                              <input 
                                type="checkbox" 
                                name="technicianIds" 
                                value={u.id}
                                defaultChecked={(finishingTicket || closingTicket)?.technicianIds?.includes(u.id)}
                                className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                              />
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{u.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Equipamento</label>
                        <EquipmentSelector 
                          value={(finishingTicket || closingTicket)?.equipmentId || ''}
                          onChange={(id) => {
                            if (finishingTicket) setFinishingTicket({...finishingTicket, equipmentId: id});
                            if (closingTicket) setClosingTicket({...closingTicket, equipmentId: id});
                          }}
                          equipments={equipments}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Solução Utilizada</label>
                        <textarea 
                          name="solution"
                          value={(finishingTicket || closingTicket)?.solution || ''}
                          onChange={(e) => {
                            if (finishingTicket) setFinishingTicket({...finishingTicket, solution: e.target.value});
                            if (closingTicket) setClosingTicket({...closingTicket, solution: e.target.value});
                          }}
                          rows={4}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none resize-none transition-all" 
                          placeholder="Descreva a solução aplicada..."
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observações Técnicas</label>
                        <textarea 
                          name="technicalObservations"
                          defaultValue={(finishingTicket || closingTicket)?.technicalObservations || ''}
                          rows={3}
                          className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none resize-none transition-all" 
                        />
                      </div>
                    </>
                  )}

                </form>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 shrink-0 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  type="button"
                  onClick={() => {
                    setAttendingTicket(null);
                    setFinishingTicket(null);
                    setClosingTicket(null);
                    setEditingTicket(null);
                  }}
                  className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  form="ticket-action-form"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
