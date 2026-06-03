import React, { useState, useEffect } from 'react';
import { Network as NetworkIcon, Plus, Search, Monitor, Laptop, Server, HardDrive, Router, Phone, Video, Edit2, X, Check, AlertCircle, Trash2, Edit, Globe, Radio, Printer, Wifi, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import { Network, IPAddress, DeviceType, Equipment, Subnet } from '../types';
import { cn } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

const deviceTypes: DeviceType[] = ['Desktop', 'Notebook', 'Servidor', 'Switch', 'Roteador', 'PABX', 'DVR', 'Endereço de rede', 'Gateway', 'Broadcast', 'Impressora', 'Rede cabeada', 'Rede Wifi'];

const deviceColors: Record<DeviceType, string> = {
  Desktop: 'bg-blue-500 dark:bg-blue-600',
  Notebook: 'bg-primary',
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

const deviceIcons: Record<DeviceType, any> = {
  Desktop: Monitor,
  Notebook: Laptop,
  Servidor: Server,
  Switch: Share2,
  Roteador: Router,
  PABX: Phone,
  DVR: Video,
  'Endereço de rede': NetworkIcon,
  Gateway: Globe,
  Broadcast: Radio,
  Impressora: Printer,
  'Rede cabeada': NetworkIcon,
  'Rede Wifi': Wifi,
};

const deviceHexColors: Record<DeviceType | 'Disponível', string> = {
  Desktop: '#3b82f6',
  Notebook: '#6366f1', // Idealmente, esta deve ser a cor primária em hexadecimal
  Servidor: '#ef4444',
  Switch: '#10b981',
  Roteador: '#f97316',
  PABX: '#a855f7',
  DVR: '#334155',
  'Endereço de rede': '#94a3b8',
  Gateway: '#6366f1',
  Broadcast: '#f43f5e',
  Impressora: '#eab308',
  'Rede cabeada': '#06b6d4',
  'Rede Wifi': '#6366f1',
  Disponível: '#f1f5f9',
};

export default function NetworkPage() {
  const { user } = useAuth();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null);
  const [ips, setIps] = useState<Record<number, IPAddress>>({});
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNetwork, setIsAddingNetwork] = useState(false);
  const [isEditingNetwork, setIsEditingNetwork] = useState<Network | null>(null);
  const [isDividingNetwork, setIsDividingNetwork] = useState(false);
  const [editingSubnet, setEditingSubnet] = useState<Subnet | null>(null);
  const [newSubnetName, setNewSubnetName] = useState('');
  const [divideCidr, setDivideCidr] = useState<number>(25);
  const [isSavingSubnets, setIsSavingSubnets] = useState(false);
  const [newNetwork, setNewNetwork] = useState({ name: '', baseIp: '', description: '' });
  const [addNetworkError, setAddNetworkError] = useState('');
  const [isSavingNetwork, setIsSavingNetwork] = useState(false);
  const [editingIp, setEditingIp] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<IPAddress>>({});
  const [ipSaveError, setIpSaveError] = useState('');
  const [networkToDelete, setNetworkToDelete] = useState<string | null>(null);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [eqSearch, setEqSearch] = useState('');

  useEffect(() => {
    fetchNetworks();
    fetchEquipments();
  }, []);

  useEffect(() => {
    if (selectedNetwork) {
      fetchIps(selectedNetwork.id);
      fetchSubnets(selectedNetwork.id);
    }
  }, [selectedNetwork]);

  const fetchSubnets = async (networkId: string) => {
    try {
      const res = await apiFetch(`/api/networks/${networkId}/subnets`);
      if (res.ok) {
        const data = await res.json();
        setSubnets(data);
      }
    } catch (err) {
      console.error('Failed to fetch subnets:', err);
    }
  };

  const fetchEquipments = async () => {
    try {
      const res = await apiFetch('/api/equipments');
      if (res.ok) {
        const data = await res.json();
        setEquipments(data);
      }
    } catch (err) {
      console.error('Failed to fetch equipments:', err);
    }
  };

  const fetchNetworks = async () => {
    try {
      const res = await apiFetch('/api/networks');
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch networks: ${res.status} ${res.statusText} - ${errorText}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setNetworks(data);
        if (data.length > 0 && !selectedNetwork) {
          setSelectedNetwork(data[0]);
        }
      } else {
        setNetworks([]);
      }
    } catch (err) {
      console.error('Failed to fetch networks:', err);
      setNetworks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIps = async (networkId: string) => {
    try {
      const res = await apiFetch(`/api/networks/${networkId}/ips`);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch IPs: ${res.status} ${res.statusText} - ${errorText}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const ipMap: Record<number, IPAddress> = {};
        data.forEach((ip: IPAddress) => {
          ipMap[ip.ipSuffix] = ip;
        });
        setIps(ipMap);
      } else {
        setIps({});
      }
    } catch (err) {
      console.error('Failed to fetch IPs:', err);
      setIps({});
    }
  };

  const handleAddNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddNetworkError('');
    
    // Validação simples da base do IP (ex., 192.168.1)
    const ipPattern = /^(\d{1,3}\.){2}\d{1,3}$/;
    if (!ipPattern.test(newNetwork.baseIp)) {
      setAddNetworkError('Formato de Base IP inválido. Use o formato: xxx.xxx.xxx');
      return;
    }

    setIsSavingNetwork(true);
    try {
      const res = await apiFetch('/api/networks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNetwork),
      });
      
      if (res.ok) {
        setIsAddingNetwork(false);
        setNewNetwork({ name: '', baseIp: '', description: '' });
        fetchNetworks();
      } else {
        const errorData = await res.json();
        setAddNetworkError(errorData.message || 'Erro ao salvar rede');
      }
    } catch (err) {
      setAddNetworkError('Erro de conexão ao salvar rede');
    } finally {
      setIsSavingNetwork(false);
    }
  };

  const handleUpdateNetwork = async () => {
    if (!isEditingNetwork) return;
    setIsSavingNetwork(true);
    try {
      const res = await apiFetch(`/api/networks/${isEditingNetwork.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: isEditingNetwork.name, description: isEditingNetwork.description }),
      });
      if (res.ok) {
        fetchNetworks();
        if (selectedNetwork?.id === isEditingNetwork.id) {
          setSelectedNetwork({ ...selectedNetwork, name: isEditingNetwork.name, description: isEditingNetwork.description });
        }
        setIsEditingNetwork(null);
      }
    } catch (err) {
      console.error('Failed to update network');
    } finally {
      setIsSavingNetwork(false);
    }
  };

  const handleDeleteNetwork = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
      const res = await apiFetch(`/api/networks/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchNetworks();
        if (selectedNetwork?.id === id) {
          setSelectedNetwork(null);
        }
        setNetworkToDelete(null);
      } else {
        const err = await res.json();
        alert(err.message || 'Erro ao excluir rede');
      }
    } catch (err) {
      console.error('Failed to delete network');
    }
  };

  const handleUpdateSubnet = async () => {
    if (!editingSubnet || !newSubnetName) return;
    try {
      const res = await apiFetch(`/api/subnets/${editingSubnet.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubnetName }),
      });
      if (res.ok) {
        if (selectedNetwork) fetchSubnets(selectedNetwork.id);
        setEditingSubnet(null);
        setNewSubnetName('');
      }
    } catch (err) {
      console.error('Failed to update subnet');
    }
  };

  const handleEditIp = (suffix: number) => {
    setEditingIp(suffix);
    setEditForm(ips[suffix] || { ipSuffix: suffix, networkId: selectedNetwork?.id });
    setIpSaveError('');
  };

  const handleSaveIp = async () => {
    if (!selectedNetwork) return;
    setIpSaveError('');

    // Validação: apenas se deviceType estiver definido (não "redefinindo" o IP)
    if (editForm.deviceType) {
      if (!editForm.hostName?.trim()) {
        setIpSaveError('O campo "Nome do Host" é obrigatório.');
        return;
      }
      if (!editForm.responsible?.trim()) {
        setIpSaveError('O campo "Responsável" é obrigatório.');
        return;
      }
    }

    try {
      // Se deviceType estiver vazio, "redefinimos" o IP enviando uma solicitação que o limpa
      // ou poderíamos excluí-lo. Vamos enviá-lo com valores vazios que o backend manipula.
      // Mas para realmente "redefinir" para o padrão, podemos querer excluí-lo se existir.
      
      const res = await apiFetch('/api/ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...editForm, 
          networkId: selectedNetwork.id, 
          ipSuffix: editingIp,
          // Se deviceType estiver vazio, limpar outros campos
          hostName: editForm.deviceType ? editForm.hostName : '',
          macAddress: editForm.deviceType ? editForm.macAddress : '',
          sector: editForm.deviceType ? editForm.sector : '',
          responsible: editForm.deviceType ? editForm.responsible : '',
          description: editForm.deviceType ? editForm.description : '',
          equipmentId: editForm.deviceType ? editForm.equipmentId : null,
        }),
      });
      if (res.ok) {
        fetchIps(selectedNetwork.id);
        setEditingIp(null);
      }
    } catch (err) {
      console.error('Failed to save IP');
    }
  };

  const handleDivideNetwork = async () => {
    if (!selectedNetwork) return;
    setIsSavingSubnets(true);
    try {
      const res = await apiFetch(`/api/networks/${selectedNetwork.id}/subnets/divide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidr: divideCidr }),
      });
      if (res.ok) {
        fetchSubnets(selectedNetwork.id);
        setIsDividingNetwork(false);
      }
    } catch (err) {
      console.error('Failed to divide network');
    } finally {
      setIsSavingSubnets(false);
    }
  };

  const handleDeleteSubnets = async () => {
    if (!selectedNetwork) return;
    if (!confirm('Tem certeza que deseja remover a divisão de sub-redes?')) return;
    
    try {
      const res = await apiFetch(`/api/networks/${selectedNetwork.id}/subnets`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSubnets(selectedNetwork.id);
      }
    } catch (err) {
      console.error('Failed to delete subnets');
    }
  };

  const getChartData = () => {
    const counts: Record<string, number> = {};
    deviceTypes.forEach(type => {
      counts[type] = 0;
    });
    
    let usedCount = 0;
    Object.values(ips).forEach((ip: IPAddress) => {
      if (ip.deviceType && counts[ip.deviceType] !== undefined) {
        counts[ip.deviceType]++;
        usedCount++;
      }
    });

    const data = Object.entries(counts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: deviceHexColors[name as DeviceType]
      }));

    data.push({
      name: 'Disponível',
      value: 256 - usedCount,
      color: deviceHexColors['Disponível']
    });

    return { data, usedCount, percentage: ((usedCount / 256) * 100).toFixed(1) };
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Gestão de Rede</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Gerencie redes, sub-redes e endereçamento IP.</p>
        </div>
        {user?.role !== 'Técnico' && (
          <button
            onClick={() => setIsAddingNetwork(true)}
            className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5" />
            Nova Rede
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Barra lateral: Lista de Redes */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <NetworkIcon className="w-4 h-4 text-primary" />
                Redes Cadastradas
              </h2>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {networks.map((net) => (
                <div
                  key={net.id}
                  onClick={() => setSelectedNetwork(net)}
                  className={cn(
                    "w-full text-left p-6 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group relative cursor-pointer",
                    selectedNetwork?.id === net.id ? "bg-primary/5 dark:bg-primary/10" : ""
                  )}
                >
                  {selectedNetwork?.id === net.id && (
                    <motion.div 
                      layoutId="activeNetwork"
                      className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-r-full"
                    />
                  )}
                  <div className="flex justify-between items-center group/item">
                    <div>
                      <p className={cn(
                        "font-black transition-colors",
                        selectedNetwork?.id === net.id ? "text-primary" : "text-slate-900 dark:text-slate-100"
                      )}>{net.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">{net.baseIp}.x</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.role !== 'Técnico' && (
                        <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setIsEditingNetwork(net); }}
                            className="p-2 hover:bg-primary/10 text-slate-400 hover:text-primary rounded-lg transition-colors"
                            title="Editar Rede"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setNetworkToDelete(net.id); }}
                            className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            title="Excluir Rede"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                          {Math.round(((net.usedIps || 0) / 256) * 100)}%
                        </p>
                        <div className="w-12 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden shadow-inner">
                          <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${((net.usedIps || 0) / 256) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {networks.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic text-sm font-medium">
                  Nenhuma rede cadastrada.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Principal: Grade de IPs */}
        <div className="lg:col-span-3">
          {selectedNetwork ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedNetwork.name}</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{selectedNetwork.baseIp}.0/24</p>
                </div>
                <div className="flex gap-2">
                  {user?.role !== 'Técnico' && (
                    <button
                      onClick={() => setIsDividingNetwork(true)}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                    >
                      {subnets.length > 0 ? 'Alterar Divisão' : 'Dividir em Sub-redes'}
                    </button>
                  )}
                </div>
              </div>

              {/* Dashboard de Estatísticas da Rede */}
              <div className="p-10 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="md:col-span-1 h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getChartData().data}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        minAngle={2}
                        cornerRadius={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {getChartData().data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <Label 
                          content={({ viewBox }) => {
                            const { cx, cy } = viewBox as any;
                            return (
                              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={cx} dy="-0.5em" className="text-2xl font-black fill-slate-900 dark:fill-white">
                                  {getChartData().percentage}%
                                </tspan>
                                <tspan x={cx} dy="1.5em" className="text-[10px] font-black uppercase tracking-widest fill-slate-400">
                                  EM USO
                                </tspan>
                              </text>
                            );
                          }}
                        />
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
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="md:col-span-2 flex flex-col justify-center space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-primary transition-all">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Capacidade Total</p>
                      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">256 <span className="text-sm font-black text-slate-400 uppercase tracking-widest">IPs</span></p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-primary transition-all">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Uso da Rede</p>
                      <div className="flex items-end gap-3">
                        <p className="text-4xl font-black text-primary tracking-tight">{getChartData().percentage}%</p>
                        <p className="text-[10px] text-slate-400 mb-2 font-black uppercase tracking-widest">({getChartData().usedCount} ocupados)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {getChartData().data.filter(d => d.name !== 'Disponível').map(d => (
                      <div key={d.name} className="flex items-center gap-3 bg-white dark:bg-slate-800 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm hover:scale-105 transition-all">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></div>
                        {d.name}: {d.value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-10">
                {subnets.length > 0 && (
                  <div className="mb-10 space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <NetworkIcon className="w-4 h-4 text-primary" />
                      Sub-redes Configuradas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {subnets.map((sub) => (
                        <div key={sub.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 group/sub relative">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-black text-slate-900 dark:text-white">{sub.name}</p>
                            {user?.role !== 'Técnico' && (
                              <button
                                onClick={() => { setEditingSubnet(sub); setNewSubnetName(sub.name); }}
                                className="p-1.5 opacity-0 group-hover/sub:opacity-100 hover:bg-primary/10 text-slate-400 hover:text-primary rounded-lg transition-all"
                                title="Renomear Sub-rede"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            .{sub.startSuffix} - .{sub.endSuffix}
                          </p>
                          <div className="mt-3 flex gap-2">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-lg">GW: .{sub.gatewaySuffix}</span>
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg">BC: .{sub.broadcastSuffix}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-16 gap-3">
                  {Array.from({ length: 256 }).map((_, i) => {
                    const ipData = ips[i];
                    const Icon = ipData?.deviceType ? deviceIcons[ipData.deviceType] : null;
                    
                    // Verificar se este IP é um endereço de rede, gateway ou broadcast em qualquer sub-rede
                    const subnet = subnets.find(s => i >= s.startSuffix && i <= s.endSuffix);
                    const isNetworkAddr = subnet?.startSuffix === i;
                    const isGateway = subnet?.gatewaySuffix === i;
                    const isBroadcast = subnet?.broadcastSuffix === i;

                    return (
                      <button
                        key={i}
                        onClick={() => handleEditIp(i)}
                        className={cn(
                          "aspect-square rounded-xl border flex flex-col items-center justify-center transition-all relative group overflow-hidden",
                          ipData 
                            ? `${deviceColors[ipData.deviceType!]} text-white border-transparent shadow-md hover:scale-110 active:scale-95 z-0 hover:z-10` 
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-primary hover:bg-white dark:hover:bg-slate-700 hover:scale-110 active:scale-95",
                          isNetworkAddr && "ring-2 ring-slate-400 ring-offset-2 dark:ring-offset-slate-900",
                          isGateway && !ipData && "border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-900/20",
                          isBroadcast && !ipData && "border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20"
                        )}
                        title={ipData ? `${ipData.hostName} (${ipData.deviceType})` : isNetworkAddr ? 'Endereço de Rede' : isGateway ? 'Gateway' : isBroadcast ? 'Broadcast' : `IP .${i} disponível`}
                      >
                        <span className="text-[9px] font-bold font-mono leading-none mb-1 opacity-80">.{i}</span>
                        {Icon ? <Icon className="w-4 h-4" /> : (
                          isNetworkAddr ? <NetworkIcon className="w-3 h-3" /> :
                          isGateway ? <Globe className="w-3 h-3" /> :
                          isBroadcast ? <Radio className="w-3 h-3" /> : null
                        )}
                        
                        {/* Tooltip ao passar o mouse */}
                        {(ipData || isNetworkAddr || isGateway || isBroadcast) && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 text-white text-[11px] p-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none z-20 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                            <p className="font-bold border-b border-white/10 pb-2 mb-2 text-primary">
                              {ipData?.hostName || (isNetworkAddr ? 'REDE' : isGateway ? 'GATEWAY' : isBroadcast ? 'BROADCAST' : 'IP')}
                            </p>
                            <div className="space-y-1 opacity-90">
                              {ipData ? (
                                <>
                                  <p className="flex justify-between"><span>Setor:</span> <span className="font-bold">{ipData.sector}</span></p>
                                  <p className="flex justify-between"><span>MAC:</span> <span className="font-mono">{ipData.macAddress}</span></p>
                                  <p className="flex justify-between"><span>Resp:</span> <span className="font-bold">{ipData.responsible}</span></p>
                                </>
                              ) : (
                                <p className="text-center italic opacity-70">Endereço Reservado</p>
                              )}
                              {subnet && (
                                <p className="flex justify-between border-t border-white/10 pt-1 mt-1">
                                  <span>Sub-rede:</span> <span className="font-bold">{subnet.name}</span>
                                </p>
                              )}
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <NetworkIcon className="w-10 h-10 opacity-20" />
              </div>
              <p className="font-bold text-lg">Selecione uma rede</p>
              <p className="text-sm mt-1">Escolha uma rede na lateral para gerenciar os IPs</p>
            </div>
          )}
        </div>
      </div>
 
      {/* Modal: Dividir Rede */}
      <AnimatePresence>
        {isDividingNetwork && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Dividir em Sub-redes</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Selecione a máscara de rede para a divisão automática</p>
                </div>
                <button onClick={() => setIsDividingNetwork(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { cidr: 25, mask: '255.255.255.128', subnets: 2, hosts: 126 },
                    { cidr: 26, mask: '255.255.255.192', subnets: 4, hosts: 62 },
                    { cidr: 27, mask: '255.255.255.224', subnets: 8, hosts: 30 },
                    { cidr: 28, mask: '255.255.255.240', subnets: 16, hosts: 14 },
                    { cidr: 29, mask: '255.255.255.248', subnets: 32, hosts: 6 },
                    { cidr: 30, mask: '255.255.255.252', subnets: 64, hosts: 2, note: 'Ideal para Ponto-a-Ponto' },
                  ].map((rule) => (
                    <button
                      key={rule.cidr}
                      onClick={() => setDivideCidr(rule.cidr)}
                      className={cn(
                        "p-6 rounded-2xl border-2 text-left transition-all group",
                        divideCidr === rule.cidr 
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                          : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={cn(
                          "text-lg font-black tracking-tight",
                          divideCidr === rule.cidr ? "text-primary" : "text-slate-900 dark:text-white"
                        )}>/{rule.cidr}</span>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          divideCidr === rule.cidr ? "border-primary bg-primary" : "border-slate-200 dark:border-slate-700"
                        )}>
                          {divideCidr === rule.cidr && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{rule.mask}</p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {rule.subnets} sub-redes, {rule.hosts} hosts cada
                      </p>
                      {rule.note && (
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2 italic">{rule.note}</p>
                      )}
                    </button>
                  ))}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border-l-4 border-blue-500 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
                  <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    <p className="font-black uppercase tracking-widest text-[10px] mb-1">Aviso de Divisão</p>
                    A divisão automática irá criar as sub-redes e definir os endereços de Gateway e Broadcast para cada uma. IPs já configurados não serão removidos, mas serão associados visualmente às novas sub-redes.
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
                <button
                  onClick={() => setIsDividingNetwork(false)}
                  className="flex-1 px-8 py-4 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white dark:hover:bg-slate-900 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDivideNetwork}
                  disabled={isSavingSubnets}
                  className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSavingSubnets ? 'Dividindo...' : 'Confirmar Divisão'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Adicionar Rede */}
      <AnimatePresence>
        {(isAddingNetwork || isEditingNetwork) && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isEditingNetwork ? 'Editar Rede' : 'Nova Rede'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                    {isEditingNetwork ? 'Atualize as informações da rede' : 'Cadastre uma nova rede no sistema'}
                  </p>
                </div>
                <button onClick={() => { setIsAddingNetwork(false); setIsEditingNetwork(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={(e) => { isEditingNetwork ? (e.preventDefault(), handleUpdateNetwork()) : handleAddNetwork(e); }} className="p-8 space-y-6">
                {addNetworkError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 text-red-700 dark:text-red-400 text-xs flex items-center gap-3 rounded-r-xl">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold uppercase tracking-widest">{addNetworkError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome da Rede</label>
                  <input
                    type="text"
                    required
                    value={isEditingNetwork ? (isEditingNetwork.name || '') : newNetwork.name}
                    onChange={e => isEditingNetwork ? setIsEditingNetwork({ ...isEditingNetwork, name: e.target.value }) : setNewNetwork({ ...newNetwork, name: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
                    placeholder="Ex: Rede Principal, VLAN Visitantes"
                  />
                </div>
                {!isEditingNetwork && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Base IP (Primeiros 3 octetos)</label>
                    <input
                      type="text"
                      required
                      value={newNetwork.baseIp || ''}
                      onChange={e => setNewNetwork({ ...newNetwork, baseIp: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all font-mono font-bold"
                      placeholder="Ex: 192.168.1"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descrição</label>
                  <textarea
                    value={isEditingNetwork ? (isEditingNetwork.description || '') : newNetwork.description}
                    onChange={e => isEditingNetwork ? setIsEditingNetwork({ ...isEditingNetwork, description: e.target.value }) : setNewNetwork({ ...newNetwork, description: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
                    rows={3}
                    placeholder="Opcional: Detalhes sobre o uso desta rede"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => { setIsAddingNetwork(false); setIsEditingNetwork(null); }}
                    className="flex-1 px-8 py-4 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNetwork}
                    className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {isSavingNetwork ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    ) : (
                      isEditingNetwork ? 'Salvar Alterações' : 'Criar Rede'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Editar Sub-rede */}
      <AnimatePresence>
        {editingSubnet && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Renomear Sub-rede</h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Altere o nome identificador da sub-rede</p>
                </div>
                <button onClick={() => setEditingSubnet(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nome da Sub-rede</label>
                  <input
                    type="text"
                    required
                    value={newSubnetName}
                    onChange={e => setNewSubnetName(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary transition-all font-bold"
                    placeholder="Ex: Sub-rede Financeiro"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingSubnet(null)}
                    className="flex-1 px-8 py-4 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateSubnet}
                    className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Salvar Nome
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Editar IP */}
      <AnimatePresence>
        {editingIp !== null && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Configurar IP</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{selectedNetwork?.baseIp}.{editingIp}</p>
                </div>
                <button onClick={() => setEditingIp(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {ipSaveError && (
                  <div className="md:col-span-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 text-red-700 dark:text-red-400 text-xs flex items-center gap-3 rounded-r-xl mb-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="font-bold uppercase tracking-widest">{ipSaveError}</span>
                  </div>
                )}
                <div className="md:col-span-2 space-y-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vincular Equipamento</label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar por nome ou patrimônio (S/N)..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        value={eqSearch}
                        onChange={(e) => setEqSearch(e.target.value)}
                      />
                    </div>
                    
                    {eqSearch && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                        {equipments
                          .filter(eq => 
                            eq.name.toLowerCase().includes(eqSearch.toLowerCase()) || 
                            eq.serialNumber?.toLowerCase().includes(eqSearch.toLowerCase()) ||
                            eq.model?.toLowerCase().includes(eqSearch.toLowerCase()) ||
                            eq.macAddress?.toLowerCase().includes(eqSearch.toLowerCase()) ||
                            eq.responsible?.toLowerCase().includes(eqSearch.toLowerCase())
                          )
                          .map(eq => (
                            <button
                              key={eq.id}
                              type="button"
                              onClick={() => {
                                setEditForm({ 
                                  ...editForm, 
                                  equipmentId: eq.id,
                                  hostName: eq.name,
                                  deviceType: eq.type as any,
                                  macAddress: eq.macAddress || editForm.macAddress,
                                  responsible: eq.responsible || editForm.responsible,
                                  sector: (eq as any).departmentName || editForm.sector,
                                  description: eq.description || editForm.description
                                });
                                setEqSearch('');
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <p className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{eq.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{eq.model} • S/N: {eq.serialNumber}</p>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400">{eq.type}</span>
                            </button>
                          ))
                        }
                        {equipments.filter(eq => 
                          eq.name.toLowerCase().includes(eqSearch.toLowerCase()) || 
                          eq.serialNumber?.toLowerCase().includes(eqSearch.toLowerCase()) ||
                          eq.macAddress?.toLowerCase().includes(eqSearch.toLowerCase()) ||
                          eq.responsible?.toLowerCase().includes(eqSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="p-4 text-center text-slate-400 text-sm italic">Nenhum equipamento encontrado</div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {editForm.equipmentId && (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Equipamento Vinculado</p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {equipments.find(e => e.id === editForm.equipmentId)?.name}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setEditForm({ ...editForm, equipmentId: undefined })}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Host</label>
                  <input
                    type="text"
                    value={editForm.hostName || ''}
                    onChange={e => setEditForm({ ...editForm, hostName: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: PC-FINANCEIRO-01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Dispositivo</label>
                  <select
                    value={editForm.deviceType || ''}
                    onChange={e => setEditForm({ ...editForm, deviceType: e.target.value as DeviceType })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione...</option>
                    {deviceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Endereço MAC</label>
                  <input
                    type="text"
                    value={editForm.macAddress || ''}
                    onChange={e => setEditForm({ ...editForm, macAddress: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="00:00:00:00:00:00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Setor</label>
                  <input
                    type="text"
                    value={editForm.sector || ''}
                    onChange={e => setEditForm({ ...editForm, sector: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
                  <input
                    type="text"
                    value={editForm.responsible || ''}
                    onChange={e => setEditForm({ ...editForm, responsible: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                <button
                  onClick={() => setEditingIp(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveIp}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors active:bg-indigo-800 flex items-center justify-center gap-2 font-bold"
                >
                  <Check className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal: Confirmar Exclusão de Rede */}
      <AnimatePresence>
        {networkToDelete && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trash2 className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Excluir Rede?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-8">
                  Tem certeza que deseja excluir esta rede? <br />
                  <span className="text-red-500 font-bold">Todos os IPs e sub-redes associados serão removidos permanentemente.</span>
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setNetworkToDelete(null)}
                    className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDeleteNetwork(networkToDelete)}
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
