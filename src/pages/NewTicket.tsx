import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Incident, Department, Branch } from '../types';
import { apiFetch } from '../lib/api';

export default function NewTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    incidentId: '',
    priority: 'Média' as any,
    sla: '',
    departmentId: '',
    branchId: '',
    description: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incRes, deptRes, branchRes] = await Promise.all([
          apiFetch('/api/incidents'),
          apiFetch('/api/departments'),
          apiFetch('/api/branches')
        ]);

        if (incRes.ok) setIncidents(await incRes.json());
        if (deptRes.ok) setDepartments(await deptRes.json());
        if (branchRes.ok) setBranches(await branchRes.json());
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ 
        ...prev, 
        departmentId: user.departmentId || '',
        branchId: user.branchId || ''
      }));
    }
  }, [user]);

  const handleIncidentChange = (incidentId: string) => {
    const incident = incidents.find(i => i.id === incidentId);
    if (incident) {
      setFormData(prev => ({
        ...prev,
        incidentId,
        priority: incident.priority,
        sla: incident.sla.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        incidentId: '',
        priority: 'Média',
        sla: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const data = {
      ...formData,
      requester: user?.name,
      requesterId: user?.id,
      status: 'Aberto'
    };

    try {
      const res = await apiFetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        navigate('/tickets');
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao criar chamado');
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
      alert('Erro de conexão ao criar chamado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const IncidentSelector = ({ value, onChange, incidents }: { value: string, onChange: (id: string) => void, incidents: Incident[] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

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

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Novo Chamado</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Preencha os detalhes do incidente ou requisição</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-10 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Solicitante</label>
              <input 
                type="text" 
                value={user?.name || ''}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold rounded-2xl block p-4 outline-none cursor-not-allowed" 
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="branchId" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Local / Filial</label>
              <select 
                id="branchId" 
                value={formData.branchId}
                onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                required
              >
                <option value="">Selecione o local</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="departmentId" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Setor / Departamento</label>
              <select 
                id="departmentId" 
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                required
              >
                <option value="">Selecione o setor</option>
                {departments.filter(d => !formData.branchId || d.branchId === formData.branchId).map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="incidentId" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Incidente / Problema</label>
            <IncidentSelector 
              value={formData.incidentId}
              onChange={handleIncidentChange}
              incidents={incidents}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título do Chamado</label>
            <input 
              type="text" 
              id="title" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
              placeholder="Ex: Computador não liga"
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prioridade</label>
              <input 
                type="text"
                value={formData.priority}
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold rounded-2xl block p-4 outline-none cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">SLA Estimado</label>
              <input 
                type="text"
                value={formData.sla ? `${formData.sla} horas` : ''}
                readOnly
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold rounded-2xl block p-4 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Descrição Detalhada</label>
            <textarea 
              id="description" 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5} 
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none resize-none transition-all" 
              placeholder="Descreva o problema ou requisição com o máximo de detalhes possível..."
              required
            ></textarea>
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
            {isSubmitting ? 'Salvando...' : 'Salvar Chamado'}
          </button>
        </div>
      </form>
    </div>
  );
}
