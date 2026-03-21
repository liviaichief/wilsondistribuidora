import React, { useState, useEffect } from 'react';
import { Lock, Unlock, CheckCircle, XCircle, FileText, Calendar, CreditCard, Activity, Power, ShieldAlert, FileBarChart, X, Download } from 'lucide-react';
import { databases, DATABASE_ID } from '../lib/appwrite';
import { ID } from 'appwrite';

const mockMonths = [
    { id: 1, month: 'Janeiro', status: 'pago', dueDate: '05/01/2026', method: 'PIX', val: 'R$ 150,00' },
    { id: 2, month: 'Fevereiro', status: 'pago', dueDate: '05/02/2026', method: 'PIX', val: 'R$ 150,00' },
    { id: 3, month: 'Março', status: 'pendente', dueDate: '05/03/2026', method: '-', val: 'R$ 150,00' },
    { id: 4, month: 'Abril', status: 'pendente', dueDate: '05/04/2026', method: '-', val: 'R$ 150,00' },
    { id: 5, month: 'Maio', status: 'pendente', dueDate: '05/05/2026', method: '-', val: 'R$ 150,00' },
    { id: 6, month: 'Junho', status: 'pendente', dueDate: '05/06/2026', method: '-', val: 'R$ 150,00' },
    { id: 7, month: 'Julho', status: 'pendente', dueDate: '05/07/2026', method: '-', val: 'R$ 150,00' },
    { id: 8, month: 'Agosto', status: 'pendente', dueDate: '05/08/2026', method: '-', val: 'R$ 150,00' },
    { id: 9, month: 'Setembro', status: 'pendente', dueDate: '05/09/2026', method: '-', val: 'R$ 150,00' },
    { id: 10, month: 'Outubro', status: 'pendente', dueDate: '05/10/2026', method: '-', val: 'R$ 150,00' },
    { id: 11, month: 'Novembro', status: 'pendente', dueDate: '05/11/2026', method: '-', val: 'R$ 150,00' },
    { id: 12, month: 'Dezembro', status: 'pendente', dueDate: '05/12/2026', method: '-', val: 'R$ 150,00' },
];

const MonitorPage = () => {
    const [isOperating, setIsOperating] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);

    useEffect(() => {
        // Fetch initial state
        databases.getDocument(DATABASE_ID, 'settings', 'system_blocked')
            .then(doc => setIsOperating(doc.value !== 'true'))
            .catch(() => setIsOperating(true));
    }, []);

    const toggleStatus = async () => {
        const newState = !isOperating;
        setIsOperating(newState);

        try {
            await databases.updateDocument(DATABASE_ID, 'settings', 'system_blocked', {
                value: newState ? 'false' : 'true'
            });
        } catch (e) {
            if (e.code === 404) {
                await databases.createDocument(DATABASE_ID, 'settings', 'system_blocked', {
                    key: 'system_blocked',
                    value: newState ? 'false' : 'true'
                });
            }
        }
    };

    return (
        <div className="w-full min-h-full flex flex-col gap-10 max-w-[1600px] mx-auto pb-10">
            {/* Top Config Section */}
            <div className="flex-shrink-0">
                <div className="bg-[#141414] border border-[#222222] rounded-[2rem] p-8 flex items-center justify-between shadow-lg relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-colors duration-500 ${isOperating ? 'bg-green-500/5' : 'bg-red-500/5'}`}></div>
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 ${isOperating ? 'bg-green-500/20 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' : 'bg-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}`}>
                            {isOperating ? <Activity size={32} /> : <Lock size={32} />}
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                <ShieldAlert size={14} /> Status do Sistema
                            </p>
                            <h2 className={`text-3xl font-black tracking-tighter transition-colors ${isOperating ? 'text-green-500' : 'text-red-500'}`}>
                                {isOperating ? 'Operando' : 'Bloqueado'}
                            </h2>
                        </div>
                    </div>
                
                    <button 
                        onClick={isOperating ? () => setShowBlockConfirm(true) : toggleStatus}
                        className={`px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] transition-all duration-300 relative z-10 flex items-center gap-3 shadow-xl ${
                            isOperating 
                                ? 'bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white hover:border-red-500 hover:shadow-red-500/20' 
                                : 'bg-green-600/10 text-green-500 border border-green-500/20 hover:bg-green-600 hover:text-white hover:border-green-500 hover:shadow-green-500/20 scale-105'
                        }`}
                    >
                        {isOperating ? (
                            <>
                                <Lock size={16} /> Bloquear Sistema
                            </>
                        ) : (
                            <>
                                <Unlock size={16} /> Habilitar Operação
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Monthly Calendar Grid */}
            <div className="bg-[#141414] border border-[#222222] rounded-[2.5rem] p-10 flex flex-col shadow-2xl relative">
                <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-800/50 flex-shrink-0">
                    <div>
                        <h3 className="text-4xl font-black text-white tracking-tighter">Histórico de Mensalidades</h3>
                        <p className="text-gray-500 font-bold mt-2 text-sm uppercase tracking-widest">Ano Base: <span className="text-gray-300">2026</span></p>
                    </div>
                    <div className="flex items-center gap-4 bg-[#0a0a0a] p-2 rounded-xl border border-gray-800 shadow-inner">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-500 text-xs font-black uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 2 Pagos
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/10 text-yellow-500 text-xs font-black uppercase tracking-widest">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> 10 Pendentes
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {mockMonths.map((m) => (
                        <div key={m.id} className="bg-[#0a0a0a] border border-gray-800 hover:border-blue-500/30 transition-all rounded-[1.5rem] p-5 relative group flex flex-col shadow-xl">
                            <div className="flex justify-between items-start mb-5 border-b border-gray-800/50 pb-4">
                                <h4 className="text-xl font-black text-white">{m.month}</h4>
                                {m.status === 'pago' ? (
                                    <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                                        <CheckCircle size={18} strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500">
                                        <XCircle size={18} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="space-y-3 mb-6 flex-grow">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar size={16} className="text-gray-600" />
                                        <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Vencimento</span>
                                    </div>
                                    <span className="text-gray-200 font-black text-xs">{m.dueDate}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-sm">
                                        <CreditCard size={16} className="text-gray-600" />
                                        <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Pagamento</span>
                                    </div>
                                    {m.status === 'pago' ? (
                                        <span className="text-green-400 font-black text-xs uppercase">{m.method}</span>
                                    ) : (
                                        <span className="text-gray-600 font-black text-xs uppercase">N/A</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-gray-500 font-black uppercase tracking-wider text-[9px]">Valor</span>
                                    <span className="text-white font-black text-lg tracking-tighter">{m.val}</span>
                                </div>
                            </div>

                            <div className="mt-auto">
                                {m.status === 'pago' ? (
                                    <button 
                                        onClick={() => setSelectedReceipt(m)}
                                        className="w-full py-3 rounded-xl bg-blue-500/10 text-blue-400 font-black text-[10px] uppercase tracking-widest hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 border border-blue-500/20 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                                    >
                                        <FileText size={14} /> Ver Recibo
                                    </button>
                                ) : (
                                    <button disabled className="w-full py-3 rounded-xl bg-gray-800 text-gray-500 font-black text-[10px] uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2 border border-gray-700">
                                        Aguardando
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Confirmation Modal for Block */}
            {showBlockConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-red-500/30 rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-red-500/20 flex items-center justify-center text-red-500 mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-white tracking-tighter mb-4">Confirmar Bloqueio</h3>
                        <p className="text-gray-400 mb-8 leading-relaxed font-medium">
                            Tem certeza que deseja bloquear o acesso do cliente ao sistema? Essa ação interromperá as operações imediatamente.
                        </p>
                        <div className="flex gap-4 w-full">
                            <button 
                                onClick={() => setShowBlockConfirm(false)}
                                className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={() => {
                                    setShowBlockConfirm(false);
                                    toggleStatus();
                                }}
                                className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20"
                            >
                                Sim, Bloquear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#141414] border border-[#222222] rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <h3 className="text-xl font-black text-white flex items-center gap-2">
                                <FileText size={20} className="text-blue-500" />
                                Recibo - {selectedReceipt.month}
                            </h3>
                            <button 
                                onClick={() => setSelectedReceipt(null)}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 flex flex-col items-center bg-white m-6 rounded-xl text-black shadow-inner">
                            <div className="w-full text-center border-b border-gray-200 pb-4 mb-4">
                                <h4 className="text-2xl font-black text-gray-800">Boutique de Carne</h4>
                                <p className="text-sm text-gray-500">Recibo de Pagamento</p>
                            </div>
                            <div className="w-full space-y-3 font-semibold text-gray-700">
                                <div className="flex justify-between">
                                    <span>Referência:</span>
                                    <span>{selectedReceipt.month} / 2026</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Data:</span>
                                    <span>{selectedReceipt.dueDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Método:</span>
                                    <span>{selectedReceipt.method}</span>
                                </div>
                                <div className="flex justify-between pt-4 border-t border-gray-200 text-black font-black text-xl">
                                    <span>Total:</span>
                                    <span>{selectedReceipt.val}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-800 bg-[#0a0a0a] flex gap-4">
                            <button 
                                onClick={() => setSelectedReceipt(null)}
                                className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 transition-colors"
                            >
                                Fechar
                            </button>
                            <button 
                                onClick={() => {
                                    alert('Download iniciado...');
                                }}
                                className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Download size={16} /> Baixar PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonitorPage;
