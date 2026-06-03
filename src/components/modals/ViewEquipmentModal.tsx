import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Monitor, Laptop, Printer, Server, Router, HardDrive, Smartphone, Headphones, Camera, MousePointer2, Keyboard, Speaker, Tv, Watch, PenTool as Tool, HelpCircle, MapPin, Network as NetworkIcon, Wifi, Share2 } from 'lucide-react';
import { Equipment } from '../../types';
import { apiFetch } from '../../lib/api';

const getEquipmentIcon = (type: string) => {
  switch (type) {
    case 'Desktop': return <Monitor className="w-6 h-6" />;
    case 'Notebook': return <Laptop className="w-6 h-6" />;
    case 'Impressora': return <Printer className="w-6 h-6" />;
    case 'Servidor': return <Server className="w-6 h-6" />;
    case 'Roteador': return <Router className="w-6 h-6" />;
    case 'Switch': return <Share2 className="w-6 h-6" />;
    case 'Rede cabeada': return <NetworkIcon className="w-6 h-6" />;
    case 'Rede Wifi': return <Wifi className="w-6 h-6" />;
    case 'Nobreak': return <HardDrive className="w-6 h-6" />;
    case 'Smartphone':
    case 'Tablet': return <Smartphone className="w-6 h-6" />;
    case 'Headset': return <Headphones className="w-6 h-6" />;
    case 'Câmera': return <Camera className="w-6 h-6" />;
    case 'Mouse': return <MousePointer2 className="w-6 h-6" />;
    case 'Teclado': return <Keyboard className="w-6 h-6" />;
    case 'Caixa de Som': return <Speaker className="w-6 h-6" />;
    case 'Monitor': return <Tv className="w-6 h-6" />;
    case 'Smartwatch': return <Watch className="w-6 h-6" />;
    case 'Ferramenta': return <Tool className="w-6 h-6" />;
    default: return <HelpCircle className="w-6 h-6" />;
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Ativo':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
    case 'Em Manutenção':
      return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
    case 'Inativo':
      return 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }
};

export default function ViewEquipmentModal({ equipmentId, onClose }: { equipmentId: string, onClose: () => void }) {
  const [viewingEquipment, setViewingEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/equipments/${equipmentId}`);
        if (res.ok) {
          setViewingEquipment(await res.json());
        }
      } catch (error) {
        console.error('Error fetching equipment data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (equipmentId) {
      fetchData();
    }
  }, [equipmentId]);

  if (!equipmentId) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col"
        >
          {loading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : viewingEquipment ? (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Ver Equipamento
                  </h2>
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(viewingEquipment.status)}`}>
                    {viewingEquipment.status}
                  </span>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Informações Básicas</label>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 shadow-inner">
                          {getEquipmentIcon(viewingEquipment.type)}
                        </div>
                        <div>
                          <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{viewingEquipment.name}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{viewingEquipment.type}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Responsável</label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500">
                          {viewingEquipment.responsible?.charAt(0) || '?'}
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{viewingEquipment.responsible || '-'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Identificação</label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nº de Série</span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{viewingEquipment.serialNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Patrimônio</span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{viewingEquipment.assetNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modelo</span>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{viewingEquipment.model || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rede & Localização</label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endereço IP</span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{viewingEquipment.ipAddress || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Endereço MAC</span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{viewingEquipment.macAddress || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Localização</span>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-700 dark:text-slate-300">{(viewingEquipment as any).branchName || 'N/A'}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{(viewingEquipment as any).departmentName || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {viewingEquipment.description && (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Descrição / Observações</label>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{viewingEquipment.description}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 shrink-0 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  onClick={onClose}
                  className="px-8 py-4 text-sm font-black uppercase tracking-widest text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Equipamento não encontrado.
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
