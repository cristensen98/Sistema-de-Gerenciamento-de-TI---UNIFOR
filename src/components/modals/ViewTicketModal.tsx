import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';

export default function ViewTicketModal({ ticketId, onClose }: { ticketId: string, onClose: () => void }) {
  const { user } = useAuth();
  const [viewingTicket, setViewingTicket] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ticketRes, usersRes] = await Promise.all([
          apiFetch(`/api/tickets/${ticketId}`),
          apiFetch('/api/users')
        ]);
        
        if (ticketRes.ok) {
          const data = await ticketRes.json();
          let parsedTechIds = [];
          if (data.technicianIds) {
            try {
              parsedTechIds = typeof data.technicianIds === 'string' ? JSON.parse(data.technicianIds) : data.technicianIds;
            } catch (e) {
              console.error('Error parsing technicianIds for ticket', data.id, e);
              parsedTechIds = [];
            }
          }
          setViewingTicket({
            ...data,
            technicianIds: Array.isArray(parsedTechIds) ? parsedTechIds : []
          });
        }
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (error) {
        console.error('Error fetching ticket data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      fetchData();
    }
  }, [ticketId]);

  const handleAction = async (id: string, action: string, data?: any) => {
    try {
      const res = await apiFetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      });
      if (res.ok) {
        // Atualizar dados do chamado
        const updatedRes = await apiFetch(`/api/tickets/${id}`);
        if (updatedRes.ok) {
          setViewingTicket(await updatedRes.json());
        }
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  if (!ticketId) return null;

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
          ) : viewingTicket ? (
            <>
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Ver Chamado {viewingTicket.id}
                  </h2>
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest
                    ${viewingTicket.status === 'Aberto' ? 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' : 
                      viewingTicket.status === 'Em Andamento' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800' : 
                      viewingTicket.status === 'Resolvido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                      'bg-slate-100 text-slate-700 border border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}>
                    {viewingTicket.status}
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Solicitante</label>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-black text-slate-500">
                          {viewingTicket.requester?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{viewingTicket.requesterDisplayName || viewingTicket.requester}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{viewingTicket.requesterJobTitle || 'Solicitante'}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Setor</label>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{viewingTicket.departmentName || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Incidente/Problema</label>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{viewingTicket.incidentName || '-'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Prioridade</label>
                      <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest
                        ${viewingTicket.priority === 'Urgente' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                          viewingTicket.priority === 'Alta' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 
                          viewingTicket.priority === 'Média' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                        {viewingTicket.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Data de Abertura</label>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(viewingTicket.createdAt).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Técnico(s) Atribuído(s)</label>
                      <div className="flex flex-wrap gap-2">
                        {viewingTicket.technicianIds && viewingTicket.technicianIds.length > 0 ? (
                          viewingTicket.technicianIds.map((id: string, index: number) => {
                            const tech = users.find(u => u.id === id);
                            return (
                              <span key={`${id}-${index}`} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400">
                                {tech?.name || 'Técnico'}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-sm font-bold text-slate-400 italic">Nenhum técnico atribuído</span>
                        )}
                      </div>
                    </div>
                    {viewingTicket.equipmentName && (
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Equipamento</label>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{viewingTicket.equipmentName}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Título do Chamado</label>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{viewingTicket.title}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Descrição</label>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{viewingTicket.description}</p>
                    </div>
                  </div>
                </div>

                {viewingTicket.solution && (
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Solução Aplicada</label>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-sm text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap leading-relaxed font-medium">{viewingTicket.solution}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Observações Técnicas {(user?.role === 'Administrador' || user?.role === 'Técnico') ? '(Editável)' : '(Apenas Visualização)'}
                  </label>
                  <form id="observations-form" onSubmit={(e) => {
                    e.preventDefault();
                    if (!(user?.role === 'Administrador' || user?.role === 'Técnico')) return;
                    const formData = new FormData(e.currentTarget);
                    handleAction(viewingTicket.id, 'atualizar observações', {
                      technicalObservations: formData.get('technicalObservations')
                    });
                  }}>
                    <textarea 
                      name="technicalObservations"
                      defaultValue={viewingTicket.technicalObservations || ''}
                      readOnly={!(user?.role === 'Administrador' || user?.role === 'Técnico')}
                      rows={6}
                      className={`w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary block p-6 outline-none resize-none transition-all shadow-sm ${!(user?.role === 'Administrador' || user?.role === 'Técnico') ? 'cursor-not-allowed opacity-80' : ''}`} 
                      placeholder={(user?.role === 'Administrador' || user?.role === 'Técnico') ? "Adicione observações técnicas aqui..." : "Nenhuma observação técnica registrada."}
                    />
                  </form>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 shrink-0 bg-slate-50 dark:bg-slate-800/50">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-8 py-4 text-sm font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
                >
                  { (user?.role === 'Administrador' || user?.role === 'Técnico') ? 'Cancelar' : 'Fechar' }
                </button>
                {(user?.role === 'Administrador' || user?.role === 'Técnico') && (
                  <button 
                    type="submit"
                    form="observations-form"
                    className="inline-flex items-center gap-2 px-8 py-4 text-sm font-black uppercase tracking-widest text-white bg-primary rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Observações
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Chamado não encontrado.
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
