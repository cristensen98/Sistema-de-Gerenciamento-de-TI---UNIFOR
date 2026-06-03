import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X, AlertCircle } from 'lucide-react';
import { Branch, Department } from '../types';
import { apiFetch } from '../lib/api';

export default function NewEquipment() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'Desktop',
    serialNumber: '',
    model: '',
    manufacturer: '',
    purchaseDate: '',
    warrantyUntil: '',
    status: 'Ativo',
    branchId: '',
    departmentId: '',
    macAddress: '',
    responsible: '',
    description: '',
    assetNumber: '',
    responsibilityTerm: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (formData.branchId) {
      fetchDepartments(formData.branchId);
      setFormData(prev => ({ ...prev, departmentId: '' }));
    } else {
      setDepartments([]);
      setFormData(prev => ({ ...prev, departmentId: '' }));
    }
  }, [formData.branchId]);

  const fetchBranches = async () => {
    try {

      const res = await apiFetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data);
      }
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const fetchDepartments = async (branchId: string) => {
    try {
      

      const res = await apiFetch(`/api/departments?branchId=${branchId}`);
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    let responsibilityTerm = formData.responsibilityTerm;

    if (selectedFile) {
      const reader = new FileReader();
      responsibilityTerm = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }

    try {
      const res = await apiFetch('/api/equipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, responsibilityTerm }),
      });

      if (res.ok) {
        navigate('/equipments');
      } else {
        const data = await res.json();
        setError(data.message || 'Erro ao cadastrar equipamento');
      }
    } catch (err) {
      setError('Erro de conexão ao cadastrar equipamento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Novo Equipamento</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Cadastre um novo item no inventário de hardware</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <div className="p-10 space-y-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 text-red-700 dark:text-red-400 text-sm font-bold rounded-2xl flex items-center gap-4">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Equipamento</label>
              <input 
                type="text" 
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                placeholder="Ex: PC-FINANCEIRO-01"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Desktop">Desktop</option>
                <option value="Notebook">Notebook</option>
                <option value="Servidor">Servidor</option>
                <option value="Switch">Switch</option>
                <option value="Roteador">Roteador</option>
                <option value="Impressora">Impressora</option>
                <option value="Rede cabeada">Rede cabeada</option>
                <option value="Rede Wifi">Rede Wifi</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Número de Série</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all font-mono" 
                placeholder="S/N"
                value={formData.serialNumber}
                onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Modelo</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                placeholder="Ex: Optiplex 3080"
                value={formData.model}
                onChange={e => setFormData({ ...formData, model: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Fabricante</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                placeholder="Ex: Dell, HP, Lenovo"
                value={formData.manufacturer}
                onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Empresa / Filial</label>
              <select 
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all"
                value={formData.branchId}
                onChange={e => setFormData({ ...formData, branchId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Setor</label>
              <select 
                required
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all"
                value={formData.departmentId}
                onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data de Compra</label>
              <input 
                type="date" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                value={formData.purchaseDate}
                onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Garantia Até</label>
              <input 
                type="date" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                value={formData.warrantyUntil}
                onChange={e => setFormData({ ...formData, warrantyUntil: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
              <select 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Descartado">Descartado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Endereço MAC</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all font-mono" 
                placeholder="00:00:00:00:00:00"
                value={formData.macAddress}
                onChange={e => setFormData({ ...formData, macAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Responsável</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                placeholder="Nome do responsável pelo equipamento"
                value={formData.responsible}
                onChange={e => setFormData({ ...formData, responsible: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Patrimônio</label>
              <input 
                type="text" 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all font-mono" 
                placeholder="Número do Patrimônio"
                value={formData.assetNumber}
                onChange={e => setFormData({ ...formData, assetNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Termo de Responsabilidade (PDF)</label>
              <input 
                type="file" 
                accept="application/pdf"
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-3 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Observações</label>
            <textarea 
              rows={3} 
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none resize-none transition-all" 
              placeholder="Informações adicionais sobre o equipamento..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
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
            {isSubmitting ? 'Salvando...' : 'Salvar Equipamento'}
          </button>
        </div>
      </form>
    </div>
  );
}
