import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Save, Plus, Trash2, Moon, Sun, Palette, Check, Upload, Image as ImageIcon, Printer, FileText, Network as NetworkIcon, PieChart as PieChartIcon, BarChart as BarChartIcon, Users as UsersIcon, Edit2, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import { domToPng } from 'modern-screenshot';
import { Network, IPAddress, Ticket, DeviceType } from '../types';
import { apiFetch } from '../lib/api';

const deviceColors: Record<DeviceType, string> = {
  Desktop: 'bg-blue-500 dark:bg-blue-600',
  Notebook: 'bg-indigo-500 dark:bg-indigo-600',
  Servidor: 'bg-red-500 dark:bg-red-600',
  Switch: 'bg-emerald-500 dark:bg-emerald-600',
  Roteador: 'bg-orange-500 dark:bg-orange-600',
  PABX: 'bg-purple-500 dark:bg-purple-600',
  DVR: 'bg-slate-700 dark:bg-slate-600',
  'Endereço de rede': 'bg-slate-400 dark:bg-slate-500',
  Gateway: 'bg-indigo-500 dark:bg-indigo-600',
  Broadcast: 'bg-rose-500 dark:bg-rose-600',
  Impressora: 'bg-yellow-500 dark:bg-yellow-600',
  'Rede cabeada': 'bg-cyan-500 dark:bg-cyan-600',
  'Rede Wifi': 'bg-indigo-500 dark:bg-indigo-600',
};

const COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6'  // Blue
];

// Dados mockados para relatórios
const mockResolvedTickets = [
  { id: '1', technician: 'Maria Souza', resolvedAt: '2026-03-01', branch: 'Matriz' },
  { id: '2', technician: 'Carlos Dias', resolvedAt: '2026-03-02', branch: 'Filial Sul' },
  { id: '3', technician: 'Maria Souza', resolvedAt: '2026-03-05', branch: 'Matriz' },
  { id: '4', technician: 'Carlos Dias', resolvedAt: '2026-03-08', branch: 'Filial Norte' },
  { id: '5', technician: 'Maria Souza', resolvedAt: '2026-03-10', branch: 'Filial Sul' },
  { id: '6', technician: 'Carlos Dias', resolvedAt: '2026-03-12', branch: 'Matriz' },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'Usuário' ? 'personalizacao' : 'relatorios');
  const { 
    theme, 
    setTheme, 
    primaryColor, 
    setPrimaryColor, 
    systemName, 
    setSystemName, 
    systemNameFontSize,
    setSystemNameFontSize,
    systemNameTextColor,
    setSystemNameTextColor,
    logoUrl, 
    setLogoUrl 
  } = useTheme();

  // Salvar preferências do usuário quando o tema ou a cor primária mudar
  useEffect(() => {
    if (user) {
      
      apiFetch(`/api/users/${user.id}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ theme, colorPalette: primaryColor })
      }).catch(err => console.error('Failed to save preferences', err));
    }
  }, [theme, primaryColor, user]);

  // ... (Estados do Relatório permanecem os mesmos)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branchFilter, setBranchFilter] = useState('Todas as Filiais');
  const [reportType, setReportType] = useState('Chamados Resolvidos por Técnico');
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Novos estados para relatórios solicitados
  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('');
  const [ips, setIps] = useState<Record<number, IPAddress>>({});
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // ... (Estados de Incidentes permanecem os mesmos)
  const [incidents, setIncidents] = useState<{ id: string, name: string, sla: number, priority: string }[]>([]);
  const [newIncidentName, setNewIncidentName] = useState('');
  const [newIncidentSla, setNewIncidentSla] = useState('');
  const [newIncidentPriority, setNewIncidentPriority] = useState('Média');

  // Estados de Filiais
  const [branches, setBranches] = useState<{ id: string, name: string, city: string }[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [editingBranch, setEditingBranch] = useState<{ id: string, name: string, city: string } | null>(null);

  // Estados de Setores
  const [departments, setDepartments] = useState<{ id: string, name: string, head: string, branchId?: string }[]>([]);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptHead, setNewDeptHead] = useState('');
  const [newDeptBranchId, setNewDeptBranchId] = useState('');
  const [editingDept, setEditingDept] = useState<{ id: string, name: string, head: string, branchId?: string } | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'incident' | 'branch' | 'dept' | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Estado de Edição de Incidente
  const [editingIncident, setEditingIncident] = useState<{ id: string, name: string, sla: number, priority: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      
      // Buscar Redes
      const netRes = await apiFetch('/api/networks');
      if (netRes.ok) {
        const data = await netRes.json();
        setNetworks(data);
        if (data.length > 0) setSelectedNetworkId(data[0].id);
      }

      // Buscar Chamados
      const tktRes = await apiFetch('/api/tickets');
      if (tktRes.ok) {
        const data = await tktRes.json();
        setTickets(data);
      }

      const incRes = await apiFetch('/api/incidents');
      if (incRes.ok) {
        const data = await incRes.json();
        setIncidents(data);
      }

      const branchRes = await apiFetch('/api/branches');
      if (branchRes.ok) {
        const data = await branchRes.json();
        setBranches(data);
      }

      const deptRes = await apiFetch('/api/departments');
      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments(data);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedNetworkId && reportType === 'Taxa de ocupação de rede') {
      const fetchIps = async () => {
        const res = await apiFetch(`/api/networks/${selectedNetworkId}/ips`);
        if (res.ok) {
          const data = await res.json();
          const ipMap: Record<number, IPAddress> = {};
          data.forEach((ip: IPAddress) => {
            ipMap[ip.ipSuffix] = ip;
          });
          setIps(ipMap);
        }
      };
      fetchIps();
    }
  }, [selectedNetworkId, reportType]);

  const handleAddIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentName.trim() || !newIncidentSla || !newIncidentPriority) return;

    const newIncident = {
      name: newIncidentName,
      sla: parseInt(newIncidentSla, 10),
      priority: newIncidentPriority
    };
    const res = await apiFetch('/api/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newIncident)
    });

    if (res.ok) {
      setNewIncidentName('');
      setNewIncidentSla('');
      setNewIncidentPriority('Média');
      // Atualizar incidentes
      const refreshRes = await apiFetch('/api/incidents');
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setIncidents(data);
      }
    }
  };

  const handleRemoveIncident = async (id: string) => {
    try {
      const res = await apiFetch(`/api/incidents/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setIncidents(incidents.filter(inc => inc.id !== id));
        setDeleteConfirmId(null);
        setDeleteConfirmType(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao excluir incidente');
      }
    } catch (err) {
      console.error('Failed to remove incident:', err);
    }
  };

  const handleEditIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIncident) return;
    const res = await apiFetch(`/api/incidents/${editingIncident.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: editingIncident.name,
        sla: editingIncident.sla,
        priority: editingIncident.priority
      })
    });

    if (res.ok) {
      setIncidents(incidents.map(inc => inc.id === editingIncident.id ? editingIncident : inc));
      setEditingIncident(null);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchCity.trim()) return;
    const res = await apiFetch('/api/branches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newBranchName, city: newBranchCity })
    });

    if (res.ok) {
      const data = await res.json();
      setBranches([...branches, { id: data.id, name: newBranchName, city: newBranchCity }]);
      setNewBranchName('');
      setNewBranchCity('');
    }
  };

  const handleEditBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    const res = await apiFetch(`/api/branches/${editingBranch.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: editingBranch.name, city: editingBranch.city })
    });

    if (res.ok) {
      setBranches(branches.map(b => b.id === editingBranch.id ? editingBranch : b));
      setEditingBranch(null);
    }
  };

  const handleRemoveBranch = async (id: string) => {
    try {
      const res = await apiFetch(`/api/branches/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setBranches(branches.filter(b => b.id !== id));
        setDeleteConfirmId(null);
        setDeleteConfirmType(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao excluir filial. Verifique se existem usuários ou equipamentos vinculados.');
      }
    } catch (err) {
      console.error('Failed to remove branch:', err);
    }
  };

  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim() || !newDeptHead.trim()) return;
    const res = await apiFetch('/api/departments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newDeptName, head: newDeptHead, branchId: newDeptBranchId || null })
    });

    if (res.ok) {
      const data = await res.json();
      setDepartments([...departments, { id: data.id, name: newDeptName, head: newDeptHead, branchId: newDeptBranchId }]);
      setNewDeptName('');
      setNewDeptHead('');
      setNewDeptBranchId('');
    }
  };

  const handleEditDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    const res = await apiFetch(`/api/departments/${editingDept.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name: editingDept.name, 
        head: editingDept.head, 
        branchId: editingDept.branchId || null 
      })
    });

    if (res.ok) {
      setDepartments(departments.map(d => d.id === editingDept.id ? editingDept : d));
      setEditingDept(null);
    }
  };

  const handleRemoveDept = async (id: string) => {
    try {
      const res = await apiFetch(`/api/departments/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setDepartments(departments.filter(d => d.id !== id));
        setDeleteConfirmId(null);
        setDeleteConfirmType(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao excluir setor. Verifique se existem usuários ou equipamentos vinculados.');
      }
    } catch (err) {
      console.error('Failed to remove department:', err);
    }
  };

  const tabs = [
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'incidentes', label: 'Incidentes & SLAs' },
    { id: 'filiais', label: 'Empresas/Filiais' },
    { id: 'setores', label: 'Setores' },
    { id: 'personalizacao', label: 'Personalização' },
  ].filter(tab => {
    if (user?.role === 'Usuário') return tab.id === 'personalizacao';
    return true;
  });

  const colorPresets = [
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Rose', value: '#f43f5e' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Slate', value: '#475569' },
  ];

  const handlePrint = async () => {
    const element = document.getElementById('printable-report');
    if (!element) return;

    try {
      setIsGenerating(true);
      
      // modern-screenshot lida muito melhor com CSS moderno como oklch
      // Mostrar temporariamente o cabeçalho de impressão
      const printHeader = element.querySelector('.hidden.print\\:block') as HTMLElement;
      if (printHeader) printHeader.style.display = 'block';
      
      const imgData = await domToPng(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      // Restaurar o estado do cabeçalho de impressão
      if (printHeader) printHeader.style.display = '';

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Criar uma imagem temporária para obter as dimensões
      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => (img.onload = resolve));
      
      const imgWidth = img.width;
      const imgHeight = img.height;
      const margin = 10;
      let ratio;
      
      if (reportType === 'Relatório Geral') {
        ratio = (pdfWidth - margin * 2) / imgWidth;
      } else {
        ratio = Math.min((pdfWidth - margin * 2) / imgWidth, (pdfHeight - margin * 2) / imgHeight);
      }
      
      const imgScaledWidth = imgWidth * ratio;
      const imgScaledHeight = imgHeight * ratio;
      
      let heightLeft = imgScaledHeight;
      const usableHeight = pdfHeight - (margin * 2);
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, imgScaledWidth, imgScaledHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        position -= usableHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, imgScaledWidth, imgScaledHeight);
        heightLeft -= usableHeight;
      }

      pdf.save(`relatorio_${reportType.toLowerCase().replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    let filteredTickets = tickets;

    if (startDate) {
      filteredTickets = filteredTickets.filter(t => t.createdAt.substring(0, 10) >= startDate);
    }
    if (endDate) {
      filteredTickets = filteredTickets.filter(t => t.createdAt.substring(0, 10) <= endDate);
    }
    if (branchFilter !== 'Todas as Filiais') {
      filteredTickets = filteredTickets.filter(t => t.branchName === branchFilter);
    }

    if (reportType === 'Chamados Resolvidos por Técnico') {
      const resolved = filteredTickets.filter(t => t.status === 'Resolvido' || t.status === 'Fechado' || (t.status as string) === 'Encerrado');
      const aggregated = resolved.reduce((acc: any[], ticket) => {
        if (ticket.technician) {
          // Separar por vírgula ou por " e "
          const names = ticket.technician.split(/, | e /);
          names.forEach(name => {
            const trimmedName = name.trim();
            if (trimmedName) {
              const existing = acc.find(item => item.name === trimmedName);
              if (existing) {
                existing.resolvidos += 1;
              } else {
                acc.push({ name: trimmedName, resolvidos: 1 });
              }
            }
          });
        }
        return acc;
      }, []);
      aggregated.sort((a, b) => b.resolvidos - a.resolvidos);
      setChartData(aggregated);
    } else if (reportType === 'Incidentes por setor') {
      const sectorCounts = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
        const name = ticket.departmentName || 'Não informado';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      const data = Object.entries(sectorCounts)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      setChartData(data);
    } else if (reportType === 'Incidentes por equipamento') {
      const equipmentCounts = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
        if (ticket.equipmentName) {
          acc[ticket.equipmentName] = (acc[ticket.equipmentName] || 0) + 1;
        }
        return acc;
      }, {});
      const data = Object.entries(equipmentCounts)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      setChartData(data);
    } else if (reportType === 'Incidentes') {
      const incidentCounts = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
        const name = ticket.incidentName || 'Outros';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      const data = Object.entries(incidentCounts)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
      setChartData(data);
    } else if (reportType === 'Chamados abertos por solicitante') {
      const requesterCounts = filteredTickets.reduce((acc: Record<string, number>, ticket) => {
        const name = ticket.requester || 'Anônimo';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      const data = Object.entries(requesterCounts)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 20);
      setChartData(data);
    } else if (reportType === 'Relatório Geral') {
      // Relatório geral combinará vários conjuntos de dados
      const incidentData = Object.entries(filteredTickets.reduce((acc: Record<string, number>, t) => {
        const name = t.incidentName || 'Outros';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value).slice(0, 10);

      const sectorData = Object.entries(filteredTickets.reduce((acc: Record<string, number>, t) => {
        const name = t.departmentName || 'Não informado';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value).slice(0, 10);

      const equipmentData = Object.entries(filteredTickets.reduce((acc: Record<string, number>, t) => {
        if (t.equipmentName) acc[t.equipmentName] = (acc[t.equipmentName] || 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value).slice(0, 10);

      const requesterData = Object.entries(filteredTickets.reduce((acc: Record<string, number>, t) => {
        const name = t.requester || 'Anônimo';
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {})).map(([name, value]) => ({ name, value: value as number })).sort((a, b) => b.value - a.value).slice(0, 20);

      setChartData([
        { title: 'Incidentes', data: incidentData },
        { title: 'Incidentes por Setor', data: sectorData },
        { title: 'Incidentes por Equipamento', data: equipmentData },
        { title: 'Chamados por Solicitante', data: requesterData }
      ]);
    } else if (reportType === 'Taxa de ocupação de rede') {
      // Tratado pelo useEffect e estado de ips
      setChartData([]);
    }

    setIsGenerating(false);
  };

  // Gerar relatório inicial na montagem ou quando chamados/filtros carregarem
  useEffect(() => {
    if (tickets.length > 0) {
      handleGenerateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, reportType, startDate, endDate, branchFilter, selectedNetworkId]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Configurações e Relatórios</h1>
        <p className="text-slate-500 mt-1 font-medium italic">Gerencie os parâmetros do sistema e visualize métricas</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar">
        <nav className="-mb-px flex space-x-10 min-w-max px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-5 px-1 border-b-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300
                ${activeTab === tab.id 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-10 transition-all duration-300">
        
        {/* RELATÓRIOS TAB */}
        {activeTab === 'relatorios' && (
          <div className="space-y-10">
            <div className="flex flex-wrap gap-6 items-end bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner print:hidden">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tipo de Relatório</label>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all"
                >
                  <option value="Chamados Resolvidos por Técnico">Chamados Resolvidos por Técnico</option>
                  <option value="Taxa de ocupação de rede">Taxa de ocupação de rede</option>
                  <option value="Incidentes por setor">Incidentes por setor</option>
                  <option value="Incidentes por equipamento">Incidentes por equipamento</option>
                  <option value="Incidentes">Incidentes</option>
                  <option value="Chamados abertos por solicitante">Chamados abertos por solicitante</option>
                  <option value="Relatório Geral">Relatório Geral</option>
                </select>
              </div>

              {reportType === 'Taxa de ocupação de rede' && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rede</label>
                  <select 
                    value={selectedNetworkId}
                    onChange={(e) => setSelectedNetworkId(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all"
                  >
                    {networks.map(net => (
                      <option key={net.id} value={net.id}>{net.name} ({net.baseIp}.x)</option>
                    ))}
                  </select>
                </div>
              )}

              {reportType !== 'Taxa de ocupação de rede' && (
                <>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data Inicial</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Data Final</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filial</label>
                    <select 
                      value={branchFilter}
                      onChange={(e) => setBranchFilter(e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all"
                    >
                      <option value="Todas as Filiais">Todas as Filiais</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              <div className="flex gap-4">
                <button 
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="bg-primary text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
                </button>
                <button 
                  onClick={handlePrint}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  Imprimir
                </button>
              </div>
            </div>

            <div className="mt-10 print:mt-0" id="printable-report">
              <div className="hidden print:block mb-8 text-center">
                <h1 className="text-2xl font-black uppercase tracking-tight">{systemName} - Relatório</h1>
                <p className="text-sm font-bold text-slate-500">{reportType}</p>
                <p className="text-xs text-slate-400 mt-2">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
                {(startDate || endDate) && (
                  <p className="text-xs text-slate-400">Período: {startDate || 'Início'} até {endDate || 'Hoje'}</p>
                )}
              </div>

              {reportType === 'Taxa de ocupação de rede' ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Taxa de Ocupação de Rede - {networks.find(n => n.id === selectedNetworkId)?.name}</h3>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-[repeat(16,minmax(0,1fr))] gap-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    {Array.from({ length: 256 }).map((_, i) => {
                      const ipData = ips[i];
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-[8px] font-bold ${
                            ipData 
                              ? `${deviceColors[ipData.deviceType!] || 'bg-primary'} text-white border-transparent` 
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                          }`}
                        >
                          .{i}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-4 print:grid print:grid-cols-3">
                    {(() => {
                      const counts: Record<string, number> = {};
                      (Object.values(ips) as IPAddress[]).forEach(ip => {
                        if (ip.deviceType) {
                          counts[ip.deviceType] = (counts[ip.deviceType] || 0) + 1;
                        }
                      });
                      return Object.entries(counts).map(([name, count]) => (
                        <div key={name} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest">
                          {name}: {count}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              ) : reportType === 'Relatório Geral' ? (
                <div className="space-y-16">
                  {Array.isArray(chartData) && chartData.map((section, idx) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="space-y-8 print:break-inside-avoid"
                    >
                      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase border-l-4 border-primary pl-4">{section.title}</h3>
                      <div className="h-[350px] w-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all duration-500">
                        <ResponsiveContainer width="100%" height="100%">
                          {section.title === 'Incidentes' || section.title === 'Incidentes por Equipamento' ? (
                            <PieChart>
                              <Pie 
                                data={section.data || []} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={85} 
                                paddingAngle={5}
                                minAngle={5}
                                cornerRadius={6}
                                dataKey="value"
                                stroke="none"
                              >
                                {(section.data || []).map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].name}</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{payload[0].value}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend 
                                verticalAlign="bottom" 
                                align="center"
                                iconType="circle"
                                iconSize={6}
                                wrapperStyle={{ 
                                  paddingTop: '20px', 
                                  fontSize: '9px', 
                                  fontWeight: '800', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.05em',
                                  opacity: 0.8
                                }}
                              />
                            </PieChart>
                          ) : (
                            <BarChart data={section.data || []} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 900, textTransform: 'uppercase' }} 
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                              />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} allowDecimals={false} />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].name}</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{payload[0].value}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar dataKey="value" fill={primaryColor} radius={[8, 8, 0, 0]} />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-6 py-4 font-black tracking-widest">Nome</th>
                              <th className="px-6 py-4 font-black tracking-widest text-right">Quantidade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {(section.data || []).map((item: any) => (
                              <tr key={`report-item-${item.name}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-right">{item.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{reportType}</h3>
                  {chartData.length > 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8"
                    >
                      <div className="h-[500px] w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 shadow-sm hover:shadow-2xl transition-all duration-500">
                        <ResponsiveContainer width="100%" height="100%">
                          {reportType === 'Incidentes' || reportType === 'Incidentes por equipamento' ? (
                            <PieChart>
                              <Pie 
                                data={chartData} 
                                cx="50%" 
                                cy="45%" 
                                innerRadius={100} 
                                outerRadius={140} 
                                paddingAngle={5}
                                minAngle={5}
                                cornerRadius={6}
                                dataKey="value" 
                                stroke="none"
                              >
                                {chartData.map((_: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].name}</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{payload[0].value}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend 
                                verticalAlign="bottom" 
                                align="center"
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ 
                                  paddingTop: '30px', 
                                  fontSize: '10px', 
                                  fontWeight: '800', 
                                  textTransform: 'uppercase', 
                                  letterSpacing: '0.05em',
                                  opacity: 0.8
                                }}
                              />
                            </PieChart>
                          ) : (
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }} 
                                angle={-45}
                                textAnchor="end"
                                interval={0}
                              />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} allowDecimals={false} />
                              <Tooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].name}</p>
                                        <p className="text-xl font-black text-slate-900 dark:text-white">{payload[0].value}</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Bar 
                                dataKey={reportType === 'Chamados Resolvidos por Técnico' ? 'resolvidos' : 'value'} 
                                fill={primaryColor} 
                                radius={[10, 10, 0, 0]} 
                              />
                            </BarChart>
                          )}
                        </ResponsiveContainer>
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                          <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-6 py-4 font-black tracking-widest">Nome</th>
                              <th className="px-6 py-4 font-black tracking-widest text-right">Quantidade</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {chartData.map((item: any) => (
                              <tr key={`report-row-${item.name}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-right">{reportType === 'Chamados Resolvidos por Técnico' ? item.resolvidos : item.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-96 w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                      <FileText className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium italic">Nenhum dado encontrado para os filtros selecionados.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA DE INCIDENTES E SLAS */}
        {activeTab === 'incidentes' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Catálogo de Incidentes e SLAs</h3>
            </div>
            
            <form onSubmit={handleAddIncident} className="flex flex-col md:flex-row gap-6 items-end bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Incidente/Problema</label>
                <input 
                  type="text" 
                  value={newIncidentName}
                  onChange={(e) => setNewIncidentName(e.target.value)}
                  placeholder="Ex: Computador não liga" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all" 
                  required
                />
              </div>
              <div className="w-full md:w-48 space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">SLA (Horas)</label>
                <input 
                  type="number" 
                  value={newIncidentSla}
                  onChange={(e) => setNewIncidentSla(e.target.value)}
                  placeholder="Ex: 4" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all" 
                  required
                  min="1"
                />
              </div>
              <div className="w-full md:w-48 space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prioridade</label>
                <select 
                  value={newIncidentPriority}
                  onChange={(e) => setNewIncidentPriority(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
              <button type="submit" className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                <Plus className="w-5 h-5" /> Adicionar
              </button>
            </form>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-8 py-6 font-black">Incidente / Problema</th>
                    <th className="px-8 py-6 font-black">Tempo de SLA</th>
                    <th className="px-8 py-6 font-black">Prioridade</th>
                    <th className="px-8 py-6 text-right font-black">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {incidents.length > 0 ? (
                    incidents.map((incident) => (
                      <tr key={incident.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                        <td className="px-8 py-6 font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{incident.name}</td>
                        <td className="px-8 py-6 font-bold">{incident.sla} horas</td>
                        <td className="px-8 py-6 font-bold">{incident.priority}</td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingIncident(incident)}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90"
                              title="Editar"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => { setDeleteConfirmId(incident.id); setDeleteConfirmType('incident'); }}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                              title="Remover"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-8 py-16 text-center text-slate-500 font-medium italic">
                        Nenhum incidente cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA DE FILIAIS */}
        {activeTab === 'filiais' && (
          <div className="space-y-10">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Empresas e Filiais</h3>
            <form onSubmit={handleAddBranch} className="flex flex-col md:flex-row gap-6 items-end bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Empresa/Filial</label>
                <input 
                  type="text" 
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="Ex: Filial Belo Horizonte" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all" 
                  required
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cidade</label>
                <input 
                  type="text" 
                  value={newBranchCity}
                  onChange={(e) => setNewBranchCity(e.target.value)}
                  placeholder="Ex: Belo Horizonte" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all" 
                  required
                />
              </div>
              <button type="submit" className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                <Plus className="w-5 h-5" /> Adicionar
              </button>
            </form>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-primary transition-all group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{branch.city}</p>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors">{branch.name}</h4>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingBranch(branch)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => { setDeleteConfirmId(branch.id); setDeleteConfirmType('branch'); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA DE SETORES */}
        {activeTab === 'setores' && (
          <div className="space-y-10">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Setores por Filial</h3>
            <form onSubmit={handleAddDept} className="flex flex-col md:flex-row gap-6 items-end bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner">
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Setor</label>
                <input 
                  type="text" 
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Ex: Contabilidade" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all" 
                  required
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Responsável</label>
                <input 
                  type="text" 
                  value={newDeptHead}
                  onChange={(e) => setNewDeptHead(e.target.value)}
                  placeholder="Ex: João Silva" 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all" 
                  required
                />
              </div>
              <div className="flex-1 w-full space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filial</label>
                <select 
                  value={newDeptBranchId}
                  onChange={(e) => setNewDeptBranchId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none shadow-sm transition-all"
                >
                  <option value="">Selecione...</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                <Plus className="w-5 h-5" /> Adicionar
              </button>
            </form>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-8 py-6 font-black">Setor</th>
                    <th className="px-8 py-6 font-black">Responsável</th>
                    <th className="px-8 py-6 font-black">Filial</th>
                    <th className="px-8 py-6 text-right font-black">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
                      <td className="px-8 py-6 font-black text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">{dept.name}</td>
                      <td className="px-8 py-6 font-bold">{dept.head}</td>
                      <td className="px-8 py-6 font-bold">{branches.find(b => b.id === dept.branchId)?.name || '-'}</td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setEditingDept(dept)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all active:scale-90"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => { setDeleteConfirmId(dept.id); setDeleteConfirmType('dept'); }}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA DE PERSONALIZAÇÃO */}
        {activeTab === 'personalizacao' && (
          <div className="space-y-8">
            {/* LOGO E NOME DO SISTEMA (PRIORIDADE MÁXIMA) - Apenas para Administrador */}
            {user?.role === 'Administrador' && (
              <>
                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner relative">
                <div className="absolute top-8 right-8">
                  <button 
                    onClick={() => {
                      apiFetch('/api/settings', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ companyName: systemName, logoUrl })
                      });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Identidade
                  </button>
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  Identidade do Sistema
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Logo do Sistema */}
                  <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                      Logo do Sistema (PNG/JPEG)
                    </label>
                    <div className="flex items-center gap-6 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800 transition-colors group-hover:border-primary/50">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain p-2" />
                          ) : (
                            <ImageIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                          )}
                        </div>
                        {logoUrl && (
                          <button 
                            onClick={() => setLogoUrl(null)}
                            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-xl hover:bg-red-600 transition-all active:scale-90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 cursor-pointer transition-all shadow-lg shadow-primary/20 active:scale-95">
                          <Upload className="w-4 h-4" />
                          Enviar Nova Imagem
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/png, image/jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setLogoUrl(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Formatos aceitos: PNG, JPG. <br/>Tamanho máximo: 500KB.
                        </p>
                      </div>
                    </div>
                  </div>

                {/* Nome do Sistema */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                      Nome do Sistema
                    </label>
                    <input
                      type="text"
                      value={systemName}
                      onChange={(e) => setSystemName(e.target.value)}
                      placeholder="Ex: Sistema Integrado de Suporte de TI"
                      className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all shadow-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                        Tamanho da Fonte: <span className="text-primary">{systemNameFontSize}px</span>
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="48"
                        value={systemNameFontSize}
                        onChange={(e) => setSystemNameFontSize(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                        Cor do Texto
                      </label>
                      <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <input
                          type="color"
                          value={systemNameTextColor}
                          onChange={(e) => setSystemNameTextColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border-none cursor-pointer bg-transparent p-0"
                        />
                        <span className="text-sm font-mono font-bold text-slate-500 uppercase">{systemNameTextColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção de Pré-visualização */}
              <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Pré-visualização da Marca</p>
                <div className="flex items-center gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit min-w-[240px]">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <span 
                    className="font-black truncate"
                    style={{ fontSize: `${systemNameFontSize}px`, color: systemNameTextColor }}
                  >
                    {systemName}
                  </span>
                </div>
              </div>
                </div>
              </>
            )}

            {/* TEMA DO SISTEMA */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                Tema do Sistema
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                  onClick={() => setTheme('light')}
                  className={`
                    flex items-center justify-between p-6 rounded-3xl border-2 transition-all duration-300
                    ${theme === 'light' 
                      ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5 scale-[1.02]' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${theme === 'light' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <Sun className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 dark:text-white">Modo Claro</p>
                      <p className="text-xs text-slate-500 font-medium">Visual limpo e brilhante</p>
                    </div>
                  </div>
                  {theme === 'light' && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`
                    flex items-center justify-between p-6 rounded-3xl border-2 transition-all duration-300
                    ${theme === 'dark' 
                      ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5 scale-[1.02]' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <Moon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 dark:text-white">Modo Escuro</p>
                      <p className="text-xs text-slate-500 font-medium">Conforto visual em baixa luz</p>
                    </div>
                  </div>
                  {theme === 'dark' && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* COR DE DESTAQUE */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                Paleta de Cores
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
                {colorPresets.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setPrimaryColor(color.value)}
                    className={`
                      group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300
                      ${primaryColor === color.value 
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5 scale-105' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}
                    `}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-12" 
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{color.name}</span>
                    {primaryColor === color.value && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1 shadow-lg">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}

                {/* Seletor de Cor Personalizada */}
                <div className="relative">
                  <input
                    type="color"
                    id="customColor"
                    className="sr-only"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <label
                    htmlFor="customColor"
                    className={`
                      group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer h-full
                      ${!colorPresets.some(c => c.value === primaryColor)
                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5 scale-105' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}
                    `}
                  >
                    <div 
                      className="w-10 h-10 rounded-xl shadow-inner transition-transform group-hover:scale-110 group-hover:rotate-12 flex items-center justify-center bg-gradient-to-tr from-red-500 via-green-500 to-blue-500"
                    >
                      <Plus className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Custom</span>
                    {!colorPresets.some(c => c.value === primaryColor) && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1 shadow-lg">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Elementos de Interface para Pré-visualização */}
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Visualização de Componentes</h4>
              <div className="flex flex-wrap gap-4">
                <button className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Botão Primário</button>
                <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-8 py-3 rounded-2xl text-sm font-black shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Botão Secundário</button>
                <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 text-primary rounded-2xl text-sm font-black">
                  <Check className="w-4 h-4" /> Status Ativo
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edição de Incidente */}
      <AnimatePresence>
        {editingIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Editar Incidente</h2>
                <button 
                  onClick={() => setEditingIncident(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditIncident} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Incidente</label>
                  <input 
                    type="text" 
                    value={editingIncident.name || ''}
                    onChange={(e) => setEditingIncident({...editingIncident, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">SLA (Horas)</label>
                    <input 
                      type="number" 
                      value={editingIncident.sla || 0}
                      onChange={(e) => setEditingIncident({...editingIncident, sla: parseInt(e.target.value, 10) || 0})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                      required 
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Prioridade</label>
                    <select 
                      value={editingIncident.priority || 'Média'}
                      onChange={(e) => setEditingIncident({...editingIncident, priority: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingIncident(null)} className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-700">Cancelar</button>
                  <button type="submit" className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Edição de Filial */}
      <AnimatePresence>
        {editingBranch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Editar Filial</h2>
                <button 
                  onClick={() => setEditingBranch(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditBranch} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Filial</label>
                  <input 
                    type="text" 
                    value={editingBranch.name || ''}
                    onChange={(e) => setEditingBranch({...editingBranch, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cidade</label>
                  <input 
                    type="text" 
                    value={editingBranch.city || ''}
                    onChange={(e) => setEditingBranch({...editingBranch, city: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                    required 
                  />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingBranch(null)} className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-700">Cancelar</button>
                  <button type="submit" className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Edição de Setor */}
      <AnimatePresence>
        {editingDept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Editar Setor</h2>
                <button 
                  onClick={() => setEditingDept(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditDept} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Setor</label>
                  <input 
                    type="text" 
                    value={editingDept.name || ''}
                    onChange={(e) => setEditingDept({...editingDept, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Responsável</label>
                  <input 
                    type="text" 
                    value={editingDept.head || ''}
                    onChange={(e) => setEditingDept({...editingDept, head: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Filial</label>
                  <select 
                    value={editingDept.branchId || ''}
                    onChange={(e) => setEditingDept({...editingDept, branchId: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-4 outline-none transition-all"
                  >
                    <option value="">Selecione...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingDept(null)} className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-700">Cancelar</button>
                  <button type="submit" className="bg-primary text-white px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                  Excluir {deleteConfirmType === 'incident' ? 'Incidente' : deleteConfirmType === 'branch' ? 'Filial' : 'Setor'}?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                  Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
                  {deleteConfirmType !== 'incident' && (
                    <span className="block mt-2 text-xs text-red-500 font-bold">
                      A exclusão falhará se houverem usuários ou equipamentos vinculados.
                    </span>
                  )}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => { setDeleteConfirmId(null); setDeleteConfirmType(null); }}
                    className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      if (deleteConfirmType === 'incident') handleRemoveIncident(deleteConfirmId);
                      else if (deleteConfirmType === 'branch') handleRemoveBranch(deleteConfirmId);
                      else if (deleteConfirmType === 'dept') handleRemoveDept(deleteConfirmId);
                    }}
                    className="flex-1 px-6 py-4 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
