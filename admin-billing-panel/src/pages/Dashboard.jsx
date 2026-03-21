import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    AlertCircle, 
    CheckCircle2, 
    TrendingUp, 
    Search, 
    Plus, 
    ChevronDown, 
    CreditCard, 
    Calendar, 
    Clock, 
    ExternalLink,
    MoreHorizontal,
    Monitor,
    Zap,
    Layout as LayoutIcon,
    User,
    Settings,
    Layers,
    X,
    MessageSquare,
    Calculator,
    ArrowUp,
    Briefcase
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';
import SettingsPage from './SettingsPage';
import MonitorPage from './MonitorPage';
import NotificationsPage from './NotificationsPage';

const PROJECTS = [
    { id: 'boutique', name: 'Boutique de Carne' },
    { id: 'legal_defense', name: 'Defesa Jurídica' },
    { id: 'all', name: 'Todos os Projetos' }
];

const mrrHistoryData = [
    { name: 'Jan', value: 710, label: 'Transunion' },
    { name: 'Fev', value: 720, label: 'Transunion' },
    { name: 'Mar', value: 715, label: 'Transunion' },
    { name: 'Abr', value: 725, label: 'Transunion' },
    { name: 'Mai', value: 730, label: 'Transunion' },
    { name: 'Jun', value: 740, label: 'Transunion' },
];

const Dashboard = () => {
    const [selectedProject, setSelectedProject] = useState('boutique');
    const [activeView, setActiveView] = useState('monitor'); // 'dashboard' | 'settings' | 'monitor'
    const [stats, setStats] = useState({
        totalMRR: 0,
        activeSubscriptions: 0,
        churnRate: 0,
        balance: 0,
        nextBilling: '---',
        history: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [selectedProject]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const queries = [];
            if (selectedProject !== 'all') {
                queries.push(Query.equal('system_id', [selectedProject]));
            }

            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.SUBSCRIPTIONS || 'subscriptions',
                queries
            );

            const total = response.total;
            
            if (selectedProject === 'boutique') {
                setStats({
                    totalMRR: 12340,
                    activeSubscriptions: total || 42,
                    churnRate: 2.4,
                    balance: 12340,
                    nextBilling: '03.05.2024',
                    history: mrrHistoryData
                });
            } else if (selectedProject === 'legal_defense') {
                setStats({
                    totalMRR: 8500,
                    activeSubscriptions: total || 15,
                    churnRate: 1.8,
                    balance: 8500,
                    nextBilling: '12.05.2024',
                    history: mrrHistoryData.map(d => ({ ...d, value: d.value * 0.7 }))
                });
            } else {
                setStats({
                    totalMRR: 20840,
                    activeSubscriptions: total || 57,
                    churnRate: 2.1,
                    balance: 20840,
                    nextBilling: 'Vários',
                    history: mrrHistoryData.map(d => ({ ...d, value: d.value * 1.5 }))
                });
            }
        } catch (error) {
            console.error("Error fetching billing stats:", error);
            // Fallback default stats to avoid empty dashboard
            setStats({
                totalMRR: 0,
                activeSubscriptions: 0,
                churnRate: 0,
                balance: 0,
                nextBilling: '---',
                history: mrrHistoryData
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#0a0a0a] text-gray-200 font-sans h-screen w-full flex overflow-hidden selection:bg-blue-500/30">
            {/* LEFT SIDEBAR - FIXED ASIDE */}
            <aside className="w-24 border-r border-[#222222] flex flex-col items-center py-8 gap-10 bg-[#0a0a0a] h-full flex-shrink-0" data-purpose="main-sidebar">
                <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center font-bold text-white italic shadow-2xl shadow-purple-500/30 hover:scale-110 transition-transform cursor-pointer">
                    C
                </div>
                
                <nav className="flex flex-col gap-8 flex-grow">
                    <button 
                        onClick={() => setActiveView('monitor')}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeView === 'monitor' ? 'bg-gray-800 text-blue-400 border border-gray-700 shadow-lg shadow-blue-500/10' : 'text-gray-500 hover:bg-gray-800/50'}`}
                    >
                        <Monitor size={22} />
                    </button>
                    <button 
                        onClick={() => setActiveView('dashboard')}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeView === 'dashboard' ? 'bg-gray-800 text-yellow-400 border border-gray-700 shadow-lg shadow-yellow-500/10' : 'text-gray-500 hover:bg-gray-800/50'}`}
                    >
                        <Layers size={22} />
                    </button>
                    <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-green-500 hover:bg-gray-800/50 transition-all">
                        <Zap size={22} />
                    </button>
                    <button 
                        onClick={() => setActiveView('notifications')}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeView === 'notifications' ? 'bg-gray-800 text-purple-400 border border-gray-700 shadow-lg shadow-purple-500/10' : 'text-gray-500 hover:bg-gray-800/50'}`}
                    >
                        <MessageSquare size={22} />
                    </button>
                    <button 
                        onClick={() => setActiveView('settings')}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeView === 'settings' ? 'bg-gray-800 text-red-400 border border-gray-700 shadow-lg shadow-red-500/10' : 'text-gray-500 hover:bg-gray-800/50'}`}
                    >
                        <Settings size={22} />
                    </button>
                </nav>

                <div className="pb-8">
                    <div className="w-12 h-12 rounded-2xl border border-gray-700 bg-gray-800/50 p-1 hover:border-blue-500/50 transition-all cursor-pointer">
                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-gray-500">
                           <User size={24} />
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT CONTAINER */}
            <div className="flex-grow flex flex-col h-full overflow-hidden relative bg-[#0a0a0a]" data-purpose="main-layout-container">
                <div className="glow-overlay"></div>
                
                {/* TOP NAVIGATION - FIXED HEIGHT */}
                <header className="h-20 border-b border-[#222222] flex items-center px-10 gap-10 text-sm font-semibold text-gray-500 bg-[#0a0a0a]/80 backdrop-blur-xl z-20 flex-shrink-0" data-purpose="top-header">
                    <div className="relative group">
                        <select 
                            className="bg-[#141414] text-white pl-12 pr-10 py-2.5 rounded-xl border border-gray-800 shadow-inner outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all font-black text-xs uppercase tracking-widest"
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                        >
                            {PROJECTS.map(p => (
                                <option key={p.id} value={p.id} className="bg-[#0a0a0a] text-white">{p.name}</option>
                            ))}
                        </select>
                        <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    <a className="hover:text-white transition-colors" href="#">Histórico de Crédito</a>
                    <a className="hover:text-white transition-colors" href="#">Atualizações</a>
                    <div className="ml-auto flex items-center gap-6">
                        <div className="relative group">
                            <input className="bg-[#141414] border border-transparent rounded-xl pl-12 pr-6 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/40 focus:bg-black focus:border-blue-500/50 w-64 text-gray-200 placeholder:text-gray-600 transition-all group-hover:border-gray-800" placeholder="Buscar..." type="text"/>
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                    </div>
                </header>

                {/* DASHBOARD SCROLLABLE AREA */}
                <main className="flex-grow overflow-y-auto overflow-x-hidden p-10 bg-transparent custom-scrollbar z-10" data-purpose="dashboard-grid">
                    {activeView === 'settings' ? (
                        <SettingsPage selectedProject={selectedProject} />
                    ) : activeView === 'monitor' ? (
                        <MonitorPage />
                    ) : activeView === 'notifications' ? (
                        <NotificationsPage selectedProject={selectedProject} />
                    ) : (
                        <div className="grid grid-cols-12 gap-10 max-w-[1600px] mx-auto">
                            {/* Left Column */}
                            <div className="col-span-12 lg:col-span-8 space-y-12">


                                {/* Score & Hero Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8" data-purpose="hero-stats">
                                    <div className="bg-[#141414] border border-[#222222] rounded-[2.5rem] p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:border-gray-700/50 transition-all duration-500">
                                        <div className="flex gap-4 mb-10">
                                            <span className="text-[10px] uppercase tracking-widest bg-gray-800 text-white px-4 py-1.5 rounded-full border border-gray-700 font-bold">Transunion</span>
                                            <span className="text-[10px] uppercase tracking-widest text-gray-500 py-1.5 font-bold">Experian</span>
                                            <span className="text-[10px] uppercase tracking-widest text-gray-500 py-1.5 font-bold">Equifax</span>
                                        </div>
                                        <div className="flex items-baseline gap-6 mb-4">
                                            <span className="text-8xl font-black text-white leading-none tracking-tighter">{stats.totalMRR > 1000 ? (stats.totalMRR / 1000).toFixed(1) + 'k' : stats.totalMRR}</span>
                                            <span className="text-green-400 text-lg flex items-center gap-1 font-black bg-green-500/10 px-3 py-1 rounded-xl">
                                                +6 <ArrowUp size={18} strokeWidth={4} />
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-2xl mb-12 font-medium">Saúde: Excelente</p>
                                        <div className="rainbow-bar w-full h-3 mb-3"></div>
                                        <div className="flex justify-between text-[11px] text-gray-600 uppercase tracking-widest font-black">
                                            <span>Churn: {stats.churnRate}%</span>
                                            <span className="text-blue-500">MRR Ativo</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-rows-2 gap-8">
                                        <div className="bg-[#141414] border border-[#222222] rounded-[2.5rem] p-8 flex items-center gap-6 hover:bg-white/[0.02] transition-all">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-gray-800 flex items-center justify-center text-white shadow-xl">
                                                <Clock size={32} />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Pagamentos em Dia</p>
                                                <div className="flex items-baseline gap-3">
                                                    <span className="text-4xl font-black text-white">24</span>
                                                    <span className="text-gray-700 text-xl font-bold">/ 38</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[#141414] border border-[#222222] rounded-[2.5rem] p-8 flex items-center gap-6 hover:bg-white/[0.02] transition-all">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-gray-800 flex items-center justify-center text-white shadow-xl">
                                                <CreditCard size={32} />
                                            </div>
                                            <div className="flex-grow">
                                                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Utilização</p>
                                                <span className="text-4xl font-black text-white">23%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                            </div>

                            {/* Right Column */}
                            <div className="col-span-12 lg:col-span-4 h-full">
                                <div className="sticky top-0 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 flex flex-col shadow-3xl relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-12">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[1rem] bg-blue-500/30 flex items-center justify-center text-blue-400">
                                                <CreditCard size={24} strokeWidth={2.5} />
                                            </div>
                                            <span className="text-sm text-gray-300 font-black tracking-tight">Resumo</span>
                                        </div>
                                        <button className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center border border-gray-700">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex flex-col items-center mb-16 text-center">
                                        <h4 className="text-gray-500 text-[10px] uppercase tracking-widest font-black mb-3">Saldo Disponível</h4>
                                        <p className="text-6xl font-black text-white tracking-tighter mb-4">R$ {stats.balance.toLocaleString('pt-BR')}</p>
                                        <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 font-bold">
                                            Venc: {stats.nextBilling}
                                        </div>
                                    </div>

                                    <div className="mb-16">
                                        <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full rainbow-bar" style={{ width: '75%' }}></div>
                                        </div>
                                        <div className="flex justify-between mt-4 text-[11px] text-gray-500 font-black uppercase tracking-widest">
                                            <span>$0.00</span>
                                            <span className="text-blue-400">$15,000.00</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-8 border-b border-gray-800/50 mb-10 pb-4 text-[11px] font-black uppercase tracking-widest">
                                        <span className="text-white border-b-2 border-white pb-4 cursor-pointer">Histórico</span>
                                        <span className="text-gray-600 cursor-pointer">Logs</span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mb-12 flex-grow overflow-y-auto custom-scrollbar">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                            <div key={i} className="flex flex-col items-center gap-2 group">
                                                <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center group-hover:border-blue-500 transition-all">
                                                    <CheckCircle2 size={18} className="text-green-500/50" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <button className="bg-white text-black font-black py-5 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 hover:scale-105 transition-all">
                                            <CreditCard size={20} />
                                            <span className="text-[9px]">Pagar</span>
                                        </button>
                                        <button className="bg-gray-800/50 text-white font-black py-5 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border border-gray-700 hover:scale-105 transition-all">
                                            <MessageSquare size={20} />
                                            <span className="text-[9px]">WhatsApp</span>
                                        </button>
                                        <button className="bg-gray-800/50 text-white font-black py-5 rounded-[1.5rem] flex flex-col items-center justify-center gap-2 border border-gray-700 hover:scale-105 transition-all">
                                            <Calculator size={20} />
                                            <span className="text-[9px]">Cálc</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
