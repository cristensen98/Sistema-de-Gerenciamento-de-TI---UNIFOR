import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp, ArrowUpRight, Network as NetworkIcon, X, Maximize2, HelpCircle, Info, Building2, Calendar, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Network } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

interface CustomNetworkBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: {
    placeholder?: boolean;
    type?: string;
    occupancy?: number;
    [key: string]: unknown;
  };
}

const CustomNetworkBar = (props: CustomNetworkBarProps) => {
  const { x = 0, y = 0, width = 0, height = 0, fill, payload = {} } = props;
  if (payload.placeholder) return null;
  
  // A rede primária é mais espessa (24px) que as sub-redes (14px)
  const barWidth = payload.type === 'Rede' ? 24 : 14;
  const radius = payload.type === 'Rede' ? 6 : 4;
  const offset = (width - barWidth) / 2;
  
  // Garantir que a altura seja pelo menos 2px se a ocupação > 0
  const barHeight = Math.max(height, payload.occupancy > 0 ? 2 : 0);
  const barY = y + (height - barHeight);

  return (
    <rect 
      x={x + offset} 
      y={barY} 
      width={barWidth} 
      height={barHeight} 
      fill={fill} 
      rx={radius} 
      ry={radius} 
    />
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [subnets, setSubnets] = useState<Record<string, unknown>[]>([]);
  const [tickets, setTickets] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatModal, setActiveStatModal] = useState<string | null>(null);
  const [activeChartModal, setActiveChartModal] = useState<string | null>(null);
  const [statsData, setStatsData] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    totalTrend: '0%',
    openTrend: '0%',
    inProgressTrend: '0%',
    resolvedTrend: '0%',
    efficiency: 0,
    slaOnTime: 0,
    slaAlert: 0,
    slaViolated: 0
  });

  const slaData = useMemo(() => [
    { name: 'No Prazo', value: statsData.slaOnTime, fill: '#10b981' },
    { name: 'Em Alerta', value: statsData.slaAlert, fill: '#f59e0b' },
    { name: 'Violado', value: statsData.slaViolated, fill: '#ef4444' }
  ].filter(d => d.value > 0), [statsData]);

  // Auxiliar para obter dados diários para o mês atual
  const dailyTrendData = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const data = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${i.toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      const dayStart = new Date(now.getFullYear(), now.getMonth(), i, 0, 0, 0);
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), i, 23, 59, 59);

      const dayTickets = tickets.filter(t => {
        const d = new Date(t.createdAt as string);
        return d >= dayStart && d <= dayEnd;
      });

      const dayResolved = tickets.filter(t => {
        if (!t.finishedAt) return false;
        const d = new Date(t.finishedAt as string);
        return d >= dayStart && d <= dayEnd;
      }).length;

      data.push({
        day: dateStr,
        total: dayTickets.length,
        open: dayTickets.filter(t => t.status === 'Aberto').length,
        inProgress: dayTickets.filter(t => t.status === 'Em Andamento').length,
        resolved: dayResolved,
        efficiency: dayTickets.length > 0 ? Math.round((dayResolved / dayTickets.length) * 100) : 0
      });
    }
    return data;
  }, [tickets]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar Redes
        const netRes = await apiFetch('/api/networks');
        if (netRes.ok) {
          const contentType = netRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await netRes.json();
            setNetworks(data);
          }
        }

        // Buscar Sub-redes
        const subRes = await apiFetch('/api/subnets');
        if (subRes.ok) {
          const contentType = subRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await subRes.json();
            setSubnets(data);
          }
        }

        // Buscar Chamados para estatísticas e lista recente
        const tktRes = await apiFetch('/api/tickets');
        if (tktRes.ok) {
          const contentType = tktRes.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await tktRes.json();
            // Desduplicar chamados por ID para evitar erros de chave duplicada no React
            const uniqueTickets = Array.from(new Map(data.map((t: any) => [t.id, t])).values()) as any[];
            setTickets(uniqueTickets);

            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

            const thisMonthTickets = uniqueTickets.filter((t: Record<string, unknown>) => new Date(t.createdAt as string) >= startOfThisMonth);
            const lastMonthTickets = uniqueTickets.filter((t: Record<string, unknown>) => {
              const date = new Date(t.createdAt as string);
              return date >= startOfLastMonth && date <= endOfLastMonth;
            });

            const calculateTrend = (current: number, previous: number) => {
              if (previous === 0) return current > 0 ? '+100%' : '0%';
              const diff = ((current - previous) / previous) * 100;
              return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`;
            };

            const thisMonthStats = {
              total: thisMonthTickets.length,
              open: thisMonthTickets.filter((t: Record<string, unknown>) => t.status === 'Aberto').length,
              inProgress: thisMonthTickets.filter((t: Record<string, unknown>) => t.status === 'Em Andamento').length,
              resolved: thisMonthTickets.filter((t: Record<string, unknown>) => t.status === 'Resolvido' || t.status === 'Encerrado').length
            };

            const lastMonthStats = {
              total: lastMonthTickets.length,
              open: lastMonthTickets.filter((t: Record<string, unknown>) => t.status === 'Aberto').length,
              inProgress: lastMonthTickets.filter((t: Record<string, unknown>) => t.status === 'Em Andamento').length,
              resolved: lastMonthTickets.filter((t: Record<string, unknown>) => t.status === 'Resolvido' || t.status === 'Encerrado').length
            };

            const resolvedThisMonthCount = uniqueTickets.filter((t: Record<string, unknown>) => {
              if (!t.finishedAt) return false;
              return new Date(t.finishedAt as string) >= startOfThisMonth;
            }).length;

            const efficiency = thisMonthStats.total > 0 
              ? Math.round((resolvedThisMonthCount / thisMonthStats.total) * 100)
              : 0;

            // Cálculo de SLA - Permitindo > 100% ao contar todas as resoluções deste mês
            let slaOnTimeCount = 0;
            let slaAlertCount = 0;
            let slaViolatedCount = 0;

            uniqueTickets.forEach((t: Record<string, unknown>) => {
              // Contar apenas chamados que foram finalizados neste mês OU estão abertos e foram criados neste mês
              const finishedDate = t.finishedAt ? new Date(t.finishedAt as string) : null;
              const createdDate = new Date(t.createdAt as string);
              
              const isFinishedThisMonth = finishedDate && finishedDate >= startOfThisMonth;
              const isCreatedThisMonth = createdDate >= startOfThisMonth;

              if (!isFinishedThisMonth && !isCreatedThisMonth) return;

              if (!t.sla) {
                if (isFinishedThisMonth) slaOnTimeCount++;
                return;
              }

              const createdAt = createdDate.getTime();
              const slaLimit = createdAt + ((t.sla as number) * 60 * 60 * 1000);
              const resolutionTime = finishedDate ? finishedDate.getTime() : Date.now();

              if (resolutionTime > slaLimit) {
                if (isFinishedThisMonth || (isCreatedThisMonth && !finishedDate)) slaViolatedCount++;
              } else if (resolutionTime > createdAt + ((t.sla as number) * 0.8 * 60 * 60 * 1000)) {
                if (isFinishedThisMonth || (isCreatedThisMonth && !finishedDate)) slaAlertCount++;
              } else {
                if (isFinishedThisMonth || (isCreatedThisMonth && !finishedDate)) slaOnTimeCount++;
              }
            });

            const totalSlaTickets = slaOnTimeCount + slaAlertCount + slaViolatedCount || 1;
            const slaStats = {
              onTime: Math.round((slaOnTimeCount / totalSlaTickets) * 100),
              alert: Math.round((slaAlertCount / totalSlaTickets) * 100),
              violated: Math.round((slaViolatedCount / totalSlaTickets) * 100)
            };

            setStatsData({
              total: thisMonthStats.total,
              open: thisMonthStats.open,
              inProgress: thisMonthStats.inProgress,
              resolved: thisMonthStats.resolved,
              totalTrend: calculateTrend(thisMonthStats.total, lastMonthStats.total),
              openTrend: calculateTrend(thisMonthStats.open, lastMonthStats.open),
              inProgressTrend: calculateTrend(thisMonthStats.inProgress, lastMonthStats.inProgress),
              resolvedTrend: calculateTrend(thisMonthStats.resolved, lastMonthStats.resolved),
              efficiency,
              slaOnTime: slaStats.onTime,
              slaAlert: slaStats.alert,
              slaViolated: slaStats.violated
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const [showInfoModal, setShowInfoModal] = useState(false);

  const stats = [
    { id: 'total', name: 'Total de Chamados', value: statsData.total.toString(), icon: Ticket, color: 'text-blue-600', bg: 'bg-blue-50', gradient: 'from-blue-500/10 to-blue-500/0', trend: statsData.totalTrend },
    { id: 'open', name: 'Abertos', value: statsData.open.toString(), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-500/10 to-amber-500/0', trend: statsData.openTrend },
    { id: 'inProgress', name: 'Em Andamento', value: statsData.inProgress.toString(), icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50', gradient: 'from-indigo-500/10 to-indigo-500/0', trend: statsData.inProgressTrend },
    { id: 'resolved', name: 'Resolvidos', value: statsData.resolved.toString(), icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-500/10 to-emerald-500/0', trend: statsData.resolvedTrend },
    { id: 'efficiency', name: 'Eficiência', value: statsData.efficiency.toString() + '%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-500/10 to-emerald-500/0', trend: '' },
  ];

  const recentTicketsList = tickets
    .filter(t => t.status === 'Aberto' || t.status === 'Em Andamento')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const networkChartData = useMemo(() => {
    const data: Record<string, unknown>[] = [];
    
    // Adicionar redes que não possuem sub-redes
    networks.forEach(net => {
      const netSubnets = subnets.filter(s => s.networkId === net.id);
      if (netSubnets.length === 0) {
        data.push({
          name: net.name,
          occupancy: Number(((net.usedIps || 0) / 256 * 100).toFixed(1)),
          used: net.usedIps || 0,
          total: 256,
          type: 'Rede'
        });
      }
    });

    // Adicionar todas as sub-redes
    subnets.forEach(sub => {
      const total = (sub.endSuffix - sub.startSuffix) + 1;
      data.push({
        name: sub.name,
        occupancy: Number(((sub.usedIps || 0) / total * 100).toFixed(1)),
        used: sub.usedIps || 0,
        total: total,
        type: 'Sub-rede'
      });
    });

    // Preencher com entradas vazias se houver menos de 8
    while (data.length < 8) {
      data.push({
        name: '',
        occupancy: 0,
        used: 0,
        total: 0,
        type: 'Placeholder',
        placeholder: true
      });
    }

    return data;
  }, [networks, subnets]);

  // Calcular dados dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTickets = tickets.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);

  // Top 10 Incidentes
  const incidentCounts = recentTickets.reduce((acc: Record<string, number>, ticket) => {
    const name = ticket.incidentName || 'Outros';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

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

  const topIncidentsData = Object.entries(incidentCounts)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Top 10 Setores
  const sectorCounts = recentTickets.reduce((acc: Record<string, number>, ticket) => {
    const name = ticket.departmentName || 'Não informado';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const topSectorsData = Object.entries(sectorCounts)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Top 10 Equipamentos
  const equipmentCounts = recentTickets.reduce((acc: Record<string, number>, ticket) => {
    if (ticket.equipmentName) {
      acc[ticket.equipmentName] = (acc[ticket.equipmentName] || 0) + 1;
    }
    return acc;
  }, {});

  const topEquipmentsData = Object.entries(equipmentCounts)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Top 10 Técnicos (contando cada técnico atribuído para chamados resolvidos)
  const technicianCounts = tickets
    .filter(t => t.status === 'Resolvido' || t.status === 'Encerrado')
    .reduce((acc: Record<string, number>, ticket) => {
      if (ticket.technician) {
        const names = ticket.technician.split(', ');
        names.forEach((name: string) => {
          const trimmedName = name.trim();
          if (trimmedName) {
            acc[trimmedName] = (acc[trimmedName] || 0) + 1;
          }
        });
      }
      return acc;
    }, {});

  const topTechniciansData = Object.entries(technicianCounts)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Bem-vindo de volta! Aqui está o resumo do suporte hoje.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowInfoModal(true)}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
          <div 
            onClick={() => setActiveStatModal('efficiency')}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all group"
          >
            <TrendingUp className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Eficiência: <span className="text-emerald-600">{statsData.efficiency}%</span></span>
          </div>
        </div>
      </div>

      {/* Grade de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.slice(0, 4).map((stat) => (
          <motion.div 
            key={stat.name} 
            variants={item}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveStatModal(stat.id)}
            className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 sm:p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 cursor-pointer"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            
            <div className="relative z-10 flex items-center justify-between mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} dark:bg-opacity-20 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className={cn(
                "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                (() => {
                  const trendValue = parseFloat(stat.trend.replace('%', '')) || 0;
                  if (stat.name === 'Total de Chamados') {
                    return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
                  }
                  if (stat.name === 'Em Andamento') {
                    if (trendValue < -10) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                    if (trendValue <= 69) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
                  }
                  if (stat.name === 'Abertos') {
                    return stat.trend.startsWith('+') 
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
                  }
                  return stat.trend.startsWith('+') 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
                })()
              )}>
                {stat.trend}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{stat.name}</p>
              <p className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {user?.role !== 'Usuário' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Status de SLA */}
          <motion.div 
            variants={item}
            whileHover={{ y: -8 }}
            onClick={() => setActiveChartModal('sla')}
            className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 sm:p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col cursor-pointer select-none outline-none"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Status de SLA</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Cumprimento de prazos</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shadow-inner">
                  <Clock className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </div>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    minAngle={5}
                    cornerRadius={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {slaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{payload[0].name}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-slate-900 dark:text-white">{statsData.slaOnTime}%</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">No Prazo</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/20">
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">No Prazo</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{statsData.slaOnTime}%</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/20">
                <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1">Alerta</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{statsData.slaAlert}%</p>
              </div>
              <div className="text-center p-3 rounded-2xl bg-red-50/50 dark:bg-red-900/10 border border-red-100/50 dark:border-red-800/20">
                <p className="text-[8px] font-black text-red-600 uppercase tracking-widest mb-1">Violado</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{statsData.slaViolated}%</p>
              </div>
            </div>
          </motion.div>

          {/* Gráfico de Pizza de Principais Incidentes */}
          <motion.div 
            variants={item}
            whileHover={{ y: -8 }}
            onClick={() => setActiveChartModal('incidents')}
            className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 p-5 sm:p-6 lg:p-8 flex flex-col cursor-pointer select-none outline-none"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Incidentes</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Top 10 (Últimos 30 dias)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shadow-inner">
                  <AlertTriangle className="w-6 h-6 text-indigo-500" />
                </div>
              </div>
            </div>
            
            <div className="h-72 w-full relative">
              {topIncidentsData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topIncidentsData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        minAngle={5}
                        cornerRadius={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {topIncidentsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">{data.name}</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{data.value} <span className="text-xs text-slate-400 font-medium uppercase">Chamados</span></p>
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
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <AlertTriangle className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">Sem dados</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Gráfico de Pizza de Principais Equipamentos */}
          <motion.div 
            variants={item}
            whileHover={{ y: -8 }}
            onClick={() => setActiveChartModal('equipments')}
            className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 p-5 sm:p-6 lg:p-8 flex flex-col cursor-pointer select-none outline-none"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">INCIDENTES POR EQUIPAMENTO</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Top 10 (Últimos 30 dias)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center shadow-inner">
                  <Monitor className="w-6 h-6 text-rose-500" />
                </div>
              </div>
            </div>
            
            <div className="h-72 w-full relative">
              {topEquipmentsData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topEquipmentsData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        minAngle={5}
                        cornerRadius={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {topEquipmentsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">{data.name}</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{data.value} <span className="text-xs text-slate-400 font-medium uppercase">Chamados</span></p>
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
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Maximize2 className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">Sem dados</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Gráfico de Pizza de Principais Setores */}
          <motion.div 
            variants={item}
            whileHover={{ y: -8 }}
            onClick={() => setActiveChartModal('sectors')}
            className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 p-5 sm:p-6 lg:p-8 flex flex-col cursor-pointer select-none outline-none h-auto lg:h-[494.667px]"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">INCIDENTES POR SETOR</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Volume por Setor</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shadow-inner">
                  <Building2 className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </div>
            
            <div className="h-72 w-full relative">
              {topSectorsData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topSectorsData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        minAngle={5}
                        cornerRadius={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {topSectorsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">{data.name}</p>
                                <p className="text-xl font-black text-slate-900 dark:text-white">{data.value} <span className="text-xs text-slate-400 font-medium uppercase">Chamados</span></p>
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
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <Building2 className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">Sem dados</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Top Sectors Pie Chart */}

          {/* Chamados Recentes */}
          <motion.div 
            variants={item}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 flex flex-col overflow-hidden"
          >
            <div className="p-5 sm:p-6 lg:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Chamados Recentes</h2>
                <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-widest">Abertos e em andamento</p>
              </div>
              <button 
                onClick={() => navigate('/tickets')}
                className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-primary font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                Ver todos
              </button>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto h-[300px] sm:h-[380px] scrollbar-hide">
              {recentTicketsList.length > 0 ? (
                recentTicketsList.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    onClick={() => setSearchParams({ viewTicket: ticket.id })}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group relative"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all duration-300">
                        <Ticket className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest">{ticket.id}</span>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-sm
                            ${ticket.priority === 'Urgente' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                              ticket.priority === 'Alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                              ticket.priority === 'Média' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-black text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">{ticket.title}</p>
                        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                          {ticket.incidentName || 'Não informado'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm
                        ${ticket.status === 'Aberto' ? 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                          ticket.status === 'Em Andamento' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800' : 
                          'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'}`}>
                        <div className={`w-1 h-1 rounded-full animate-pulse ${
                          ticket.status === 'Aberto' ? 'bg-amber-500' : 
                          ticket.status === 'Em Andamento' ? 'bg-indigo-500' : 'bg-emerald-500'
                        }`} />
                        {ticket.status}
                      </span>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest">
                  Nenhum chamado encontrado
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Grade Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Gráfico de Barras de Principais Técnicos */}
        {user?.role !== 'Usuário' && (
          <motion.div 
            variants={item}
            whileHover={{ y: -8, scale: 1.01 }}
            onClick={() => setActiveChartModal('technicians')}
            className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 p-5 sm:p-6 lg:p-8 flex flex-col cursor-pointer select-none outline-none w-full lg:w-[560px]"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Top Técnicos</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Chamados Finalizados</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shadow-inner">
                  <CheckCircle className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="h-64 w-full">
              {topTechniciansData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topTechniciansData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                      width={100}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 12 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">{data.name}</p>
                              <p className="text-xl font-black text-slate-900 dark:text-white">{data.value} <span className="text-xs text-slate-400 font-medium uppercase">finalizados</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={20}>
                      {topTechniciansData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <p className="text-sm font-bold uppercase tracking-widest">Sem dados</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Gráfico de Ocupação de Rede */}
        {user?.role !== 'Usuário' && (
          <motion.div 
            variants={item}
            whileHover={{ y: -8 }}
            onClick={() => setActiveChartModal('network')}
            className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2rem] lg:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 p-5 sm:p-6 lg:p-8 flex flex-col cursor-pointer select-none outline-none ml-0 lg:ml-[180px]"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Ocupação da Rede</h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Percentual de IPs em uso por rede (/24)</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shadow-inner">
                  <NetworkIcon className="w-6 h-6 text-indigo-500" />
                </div>
              </div>
            </div>
          
          <div className="h-80 w-full">
            {networks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={networkChartData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                    unit="%"
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 12 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        if (data.placeholder) return null;
                        return (
                          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">{data.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{data.type}</p>
                            <p className="text-xl font-black text-slate-900 dark:text-white">{data.occupancy}% <span className="text-xs text-slate-400 font-medium uppercase">Ocupado</span></p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{data.used} de {data.total} IPs</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="occupancy" 
                    shape={<CustomNetworkBar />}
                    stroke="none"
                    activeBar={false}
                  >
                    {networkChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === 'Sub-rede' ? '#818cf8' : '#6366f1'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <NetworkIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Nenhuma rede cadastrada</p>
              </div>
            )}
          </div>
        </motion.div>
        )}
      </div>

      {/* Modal de Estatística Detalhada */}
      <AnimatePresence>
        {activeStatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveStatModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-10 sm:p-12">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br ${stats.find(s => s.id === activeStatModal)?.gradient} shadow-lg shadow-primary/20`}>
                      {React.createElement(stats.find(s => s.id === activeStatModal)?.icon || Ticket, { 
                        className: `w-10 h-10 text-white` 
                      })}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {stats.find(s => s.id === activeStatModal)?.name}
                      </h2>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        Tendência Diária • {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveStatModal(null)}
                    className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all hover:rotate-90 duration-300"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>

                <div className="h-[300px] sm:h-[400px] w-full bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-6 lg:p-8 border border-slate-100 dark:border-slate-800/50 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorStat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={activeStatModal === 'efficiency' ? '#10b981' : '#6366f1'} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={activeStatModal === 'efficiency' ? '#10b981' : '#6366f1'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const isEfficiency = activeStatModal === 'efficiency';
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-xl text-white p-5 rounded-[2rem] shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-3">{payload[0].payload.day}</p>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-2xl font-black">
                                    {payload[0].value}{isEfficiency ? '%' : ''}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    {isEfficiency ? 'Eficiência' : 'Chamados'}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey={activeStatModal} 
                        stroke={activeStatModal === 'efficiency' ? '#10b981' : '#6366f1'} 
                        strokeWidth={5}
                        fillOpacity={1} 
                        fill="url(#colorStat)" 
                        animationDuration={2000}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                  <div className="p-5 sm:p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {activeStatModal === 'efficiency' ? 'Média do Mês' : 'Total no Mês'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-black text-slate-900 dark:text-white">
                        {activeStatModal === 'efficiency' 
                          ? (dailyTrendData.reduce((acc, curr) => acc + (curr.efficiency || 0), 0) / new Date().getDate()).toFixed(1) + '%'
                          : dailyTrendData.reduce((acc, curr) => acc + (curr[activeStatModal as keyof typeof curr] as number), 0)
                        }
                      </p>
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                  </div>
                  <div className="p-5 sm:p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {activeStatModal === 'efficiency' ? 'Menor Eficiência' : 'Média Diária'}
                    </p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {activeStatModal === 'efficiency'
                        ? Math.min(...dailyTrendData.slice(0, new Date().getDate()).map(d => d.efficiency || 0)) + '%'
                        : (dailyTrendData.reduce((acc, curr) => acc + (curr[activeStatModal as keyof typeof curr] as number), 0) / new Date().getDate()).toFixed(1)
                      }
                    </p>
                  </div>
                  <div className="p-5 sm:p-8 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      {activeStatModal === 'efficiency' ? 'Maior Eficiência' : 'Pico do Mês'}
                    </p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">
                      {activeStatModal === 'efficiency'
                        ? Math.max(...dailyTrendData.map(d => d.efficiency || 0)) + '%'
                        : Math.max(...dailyTrendData.map(d => d[activeStatModal as keyof typeof d] as number))
                      }
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Gráfico Detalhado */}
      <AnimatePresence>
        {activeChartModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveChartModal(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-10 sm:p-12">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-6">
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 shadow-lg shadow-indigo-500/10`}>
                      {activeChartModal === 'sla' && <Clock className="w-10 h-10 text-indigo-500" />}
                      {activeChartModal === 'incidents' && <AlertTriangle className="w-10 h-10 text-indigo-500" />}
                      {activeChartModal === 'equipments' && <Monitor className="w-10 h-10 text-indigo-500" />}
                      {activeChartModal === 'sectors' && <Building2 className="w-10 h-10 text-indigo-500" />}
                      {activeChartModal === 'technicians' && <CheckCircle className="w-10 h-10 text-indigo-500" />}
                      {activeChartModal === 'network' && <NetworkIcon className="w-10 h-10 text-indigo-500" />}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {activeChartModal === 'sla' && 'Status de SLA'}
                        {activeChartModal === 'incidents' && 'Top Incidentes'}
                        {activeChartModal === 'equipments' && 'Top Equipamentos'}
                        {activeChartModal === 'sectors' && 'Volume por Setor'}
                        {activeChartModal === 'technicians' && 'Performance de Técnicos'}
                        {activeChartModal === 'network' && 'Ocupação de Rede'}
                      </h2>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        Visão Detalhada • {new Date().toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveChartModal(null)}
                    className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all hover:rotate-90 duration-300"
                  >
                    <X className="w-7 h-7" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  <div className="lg:col-span-2 h-[300px] sm:h-[400px] lg:h-[500px] bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-6 lg:p-8 border border-slate-100 dark:border-slate-800/50 shadow-inner">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeChartModal === 'sla' ? (
                        <PieChart>
                          <Pie
                            data={slaData}
                            cx="50%"
                            cy="50%"
                            innerRadius={100}
                            outerRadius={150}
                            paddingAngle={5}
                            minAngle={5}
                            cornerRadius={6}
                            dataKey="value"
                            stroke="none"
                          >
                            {slaData.map((entry, index) => (
                              <Cell key={`modal-cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1">{payload[0].name}</p>
                                    <p className="text-xl font-black">{payload[0].value}%</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      ) : activeChartModal === 'incidents' || activeChartModal === 'equipments' || activeChartModal === 'sectors' ? (
                        <BarChart 
                          data={
                            activeChartModal === 'incidents' ? topIncidentsData :
                            activeChartModal === 'equipments' ? topEquipmentsData :
                            topSectorsData
                          } 
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                            width={150}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 12 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1">{data.name}</p>
                                    <p className="text-xl font-black">{data.value} <span className="text-xs text-slate-400 font-medium uppercase">Chamados</span></p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={30}>
                            {(activeChartModal === 'incidents' ? topIncidentsData :
                              activeChartModal === 'equipments' ? topEquipmentsData :
                              topSectorsData).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : activeChartModal === 'technicians' ? (
                        <BarChart data={topTechniciansData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                            width={150}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 12 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1">{data.name}</p>
                                    <p className="text-xl font-black">{data.value} <span className="text-xs text-slate-400 font-medium uppercase">Resolvidos</span></p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={30}>
                            {topTechniciansData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : activeChartModal === 'network' ? (
                        <BarChart 
                          data={networkChartData} 
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          barCategoryGap={10}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            unit="%"
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(99, 102, 241, 0.05)', radius: 12 }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                if (data.placeholder) return null;
                                return (
                                  <div className="bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-in fade-in zoom-in duration-200">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1">{data.name}</p>
                                    <p className="text-xl font-black">{data.occupancy}%</p>
                                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{data.used} de {data.total} IPs</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar 
                            dataKey="occupancy" 
                            shape={<CustomNetworkBar />}
                            stroke="none"
                            activeBar={false}
                          >
                            {networkChartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.type === 'Sub-rede' ? '#818cf8' : '#6366f1'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : null}
                    </ResponsiveContainer>
                  </div>

                  <div className="lg:col-span-1 flex flex-col gap-4 sm:gap-6 overflow-y-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] pr-2 scrollbar-hide">
                    {/* Métricas e Indicadores */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Métricas e Indicadores</h3>
                      
                      {activeChartModal === 'sla' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">No Prazo</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{statsData.slaOnTime}%</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Excelente desempenho</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Em Alerta</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{statsData.slaAlert}%</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Atenção necessária</p>
                          </div>
                          <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Violado</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">{statsData.slaViolated}%</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Crítico - Agir agora</p>
                          </div>
                        </div>
                      )}

                      {(activeChartModal === 'incidents' || activeChartModal === 'equipments' || activeChartModal === 'sectors') && (
                        <div className="space-y-3">
                          {(activeChartModal === 'incidents' ? topIncidentsData :
                            activeChartModal === 'equipments' ? topEquipmentsData :
                            topSectorsData).slice(0, 5).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight truncate max-w-[150px]">{item.name}</span>
                              </div>
                              <span className="text-sm font-black text-slate-900 dark:text-white">{item.value}</span>
                            </div>
                          ))}
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-4 italic">Exibindo os 5 principais registros</p>
                        </div>
                      )}

                      {activeChartModal === 'technicians' && (
                        <div className="space-y-3">
                          {topTechniciansData.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                  {item.name.charAt(0)}
                                </div>
                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-black text-slate-900 dark:text-white">{item.value}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Resolvidos</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeChartModal === 'network' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Total de IPs Monitorados</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                              {networkChartData.filter(n => !n.placeholder).reduce((acc, curr) => acc + curr.total, 0)}
                            </p>
                          </div>
                          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Redes mais Ocupadas</p>
                            <div className="space-y-2">
                              {networkChartData
                                .filter(n => !n.placeholder)
                                .sort((a, b) => b.occupancy - a.occupancy)
                                .slice(0, 3)
                                .map((n, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">{n.name}</span>
                                    <span className="text-[10px] font-black text-indigo-600">{n.occupancy}%</span>
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Legenda */}
                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Legenda</h4>
                      <div className="flex flex-wrap gap-4">
                        {activeChartModal === 'sla' ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">No Prazo</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500" />
                              <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Alerta</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500" />
                              <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Violado</span>
                            </div>
                          </>
                        ) : activeChartModal === 'network' ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
                              <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Rede Principal</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-[#818cf8]" />
                              <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Sub-rede</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase">Volume de Dados</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Modal de Informação */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfoModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-5 sm:p-8 lg:p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Info className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Lógica dos Indicadores</h2>
                  </div>
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-3">Volume e Status</h3>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <li className="flex gap-3">
                        <span className="text-slate-900 dark:text-white font-black shrink-0">Total:</span>
                        Quantidade de chamados criados desde o primeiro dia do mês atual até hoje.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-slate-900 dark:text-white font-black shrink-0">Status:</span>
                        Os indicadores "Abertos" e "Em Andamento" mostram o estado atual apenas dos chamados criados neste mês.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-slate-900 dark:text-white font-black shrink-0">Resolvidos:</span>
                        Total de chamados finalizados este mês, independente da data de criação.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-3">Eficiência e Tendência</h3>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <li className="flex gap-3">
                        <span className="text-slate-900 dark:text-white font-black shrink-0">Eficiência:</span>
                        Calculada como (Chamados Resolvidos no Mês / Chamados Criados no Mês) × 100.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-slate-900 dark:text-white font-black shrink-0">Tendência:</span>
                        Comparação percentual entre o volume do mês atual e o volume total do mês anterior.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-3">Status de SLA</h3>
                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      <li className="flex gap-3">
                        <span className="text-emerald-600 font-black shrink-0">No Prazo:</span>
                        Chamados resolvidos dentro do tempo estipulado ou abertos que ainda não atingiram 80% do tempo.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-amber-600 font-black shrink-0">Alerta:</span>
                        Chamados (resolvidos ou abertos) que consumiram entre 80% e 100% do tempo de SLA.
                      </li>
                      <li className="flex gap-3">
                        <span className="text-red-600 font-black shrink-0">Violado:</span>
                        Chamados que ultrapassaram 100% do tempo de SLA estipulado.
                      </li>
                    </ul>
                  </section>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setShowInfoModal(false)}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-opacity"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(' ');
}
