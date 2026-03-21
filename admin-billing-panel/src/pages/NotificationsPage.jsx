import React, { useState } from 'react';
import { Save, Plus, Trash2, Bell, MessageCircle, Send } from 'lucide-react';

const NotificationsPage = ({ selectedProject }) => {
    const [sendViaWhatsapp, setSendViaWhatsapp] = useState(true);
    const [sendViaSystem, setSendViaSystem] = useState(false);
    
    const [messages, setMessages] = useState([
        { id: 1, text: 'Olá! Lembramos que sua fatura vence em breve.', daysBefore: 5 },
        { id: 2, text: 'Atenção: Sua fatura vence amanhã.', daysBefore: 1 },
        { id: 3, text: 'Sua fatura vence hoje. Evite interrupções no serviço!', daysBefore: 0 }
    ]);

    const addMessage = () => {
        setMessages([...messages, { id: Date.now(), text: '', daysBefore: 0 }]);
    };

    const updateMessage = (id, field, value) => {
        setMessages(messages.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const removeMessage = (id) => {
        if (messages.length <= 1) return alert('Você precisa ter pelo menos uma mensagem configurada.');
        setMessages(messages.filter(m => m.id !== id));
    };

    const handleSave = () => {
        alert('Configurações de notificação salvas com sucesso!');
    };

    const handleTestSend = (msg) => {
        if (!sendViaWhatsapp && !sendViaSystem) {
            return alert('Habilite pelo menos um canal de envio (WhatsApp ou Plataforma) para realizar o teste.');
        }
        
        let channels = [];
        if (sendViaWhatsapp) channels.push('WhatsApp');
        if (sendViaSystem) channels.push('Plataforma');
        
        alert(`Disparando envio de TESTE da mensagem via ${channels.join(' e ')}...\n\nMensagem:\n"${msg.text}"`);
    };

    return (
        <div className="max-w-5xl mx-auto backdrop-blur-3xl bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl">
            <h2 className="text-3xl font-black text-white mb-8 tracking-tighter">Parametrização de Notificações</h2>
            <p className="text-gray-400 mb-10">Configure as mensagens de cobrança e lembretes para os clientes referente ao projeto <span className="font-bold text-white">{selectedProject}</span>.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* WhatsApp Toggle */}
                <div className="bg-[#141414] border border-[#222222] rounded-3xl p-6 flex items-center justify-between hover:border-green-500/30 transition-all">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-all ${sendViaWhatsapp ? 'bg-green-500/20 text-green-400 shadow-lg shadow-green-500/10' : 'bg-gray-800 text-gray-500'}`}>
                            <MessageCircle size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold tracking-tight">WhatsApp</h3>
                            <p className="text-xs text-gray-500 font-medium">Auto-envio para clientes</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={sendViaWhatsapp} onChange={() => setSendViaWhatsapp(!sendViaWhatsapp)} />
                        <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                </div>

                {/* System Toggle */}
                <div className="bg-[#141414] border border-[#222222] rounded-3xl p-6 flex items-center justify-between hover:border-blue-500/30 transition-all">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-all ${sendViaSystem ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-gray-800 text-gray-500'}`}>
                            <Bell size={24} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold tracking-tight">Plataforma</h3>
                            <p className="text-xs text-gray-500 font-medium">Notificações in-app</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={sendViaSystem} onChange={() => setSendViaSystem(!sendViaSystem)} />
                        <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                </div>
            </div>

            <div className="space-y-6 mb-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Régua de Comunicação</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Ordem de envio das mensagens</p>
                    </div>
                    <button onClick={addMessage} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-gray-700">
                        <Plus size={16} /> Adicionar
                    </button>
                </div>

                {messages.map((msg, index) => (
                    <div key={msg.id} className="bg-[#141414] border border-[#222222] p-6 rounded-3xl flex flex-col md:flex-row gap-6 relative group transition-all hover:border-gray-700/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl flex items-center justify-center text-xl font-black text-gray-400 shrink-0 shadow-inner group-hover:text-white transition-colors">
                            {index + 1}
                        </div>
                        <div className="flex-grow space-y-4">
                            <div className="flex flex-col lg:flex-row gap-6">
                                <div className="flex-grow">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Texto da Mensagem</label>
                                    <textarea 
                                        className="w-full bg-[#0a0a0a] border border-[#222222] rounded-2xl p-4 text-gray-200 placeholder:text-gray-600 focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all resize-none h-24 font-medium custom-scrollbar"
                                        placeholder="Digite o texto da notificação..."
                                        value={msg.text}
                                        onChange={(e) => updateMessage(msg.id, 'text', e.target.value)}
                                    ></textarea>
                                </div>
                                <div className="w-full lg:w-48 shrink-0">
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Dias pro Vencimento</label>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            className="w-full bg-[#0a0a0a] border border-[#222222] rounded-2xl p-4 pr-12 text-white focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/50 transition-all font-black text-xl text-center"
                                            value={msg.daysBefore}
                                            onChange={(e) => updateMessage(msg.id, 'daysBefore', parseInt(e.target.value) || 0)}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-bold text-sm">dias</span>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-3 font-medium text-center uppercase tracking-widest">0 = No dia<br/>Negativo = Atraso</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-5 right-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => handleTestSend(msg)}
                                className="text-blue-500 hover:text-blue-400 hover:bg-black p-2 rounded-xl border border-blue-500/20 backdrop-blur transition-all"
                                title="Disparar Teste de Envio"
                            >
                                <Send size={16} />
                            </button>
                            <button 
                                onClick={() => removeMessage(msg.id)}
                                className="text-gray-600 hover:text-red-500 hover:bg-black p-2 rounded-xl border border-gray-800/50 backdrop-blur transition-all"
                                title="Remover Mensagem"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end pt-8 border-t border-gray-800">
                <button 
                    onClick={handleSave}
                    className="flex items-center gap-3 bg-gradient-to-tr from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95"
                >
                    <Save size={18} /> Salvar Parâmetros
                </button>
            </div>
        </div>
    );
};

export default NotificationsPage;
