import React, { useEffect, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, account } from '../lib/appwrite';
import { Query } from 'appwrite';
import { backfillSKUs, getSettings, sendWhatsAppMessage } from '../services/dataService';
import { Users, ShoppingBag, TrendingUp, Activity, DollarSign, Calendar, Globe, Cake, MessageCircle, ArrowUpRight, ArrowDownRight, RefreshCw, Star, Trophy, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlert } from '../context/AlertContext';
import './Admin.css';

const AdminDashboard = () => {
    const { showAlert } = useAlert();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        recentOrdersCount: 0,
        totalRevenue: 0,
        recentRevenue: 0,
        totalProfit: 0,
        activeUsers: 0,
        topProducts: [],
        birthdaysToday: []
    });
    const [birthdayMessage, setBirthdayMessage] = useState('');
    const [filterMode, setFilterMode] = useState('month'); 
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [selectedMonth, filterMode]);

    const fetchStats = async () => {
        try {
            const usersRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [Query.equal('role', 'client'), Query.limit(1)]);
            const orderQueries = [Query.limit(5000)];

            if (filterMode === 'month') {
                const [year, month] = selectedMonth.split('-').map(Number);
                const start = new Date(year, month - 1, 1);
                const end = new Date(year, month, 1);
                orderQueries.push(Query.greaterThanEqual('$createdAt', start.toISOString()));
                orderQueries.push(Query.lessThan('$createdAt', end.toISOString()));
            }

            const ordersRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, orderQueries);
            const totalOrdersRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [Query.limit(1)]);

            const recentOrders = ordersRes.documents;
            const closedStatuses = ['completed', 'delivered', 'concluído', 'entregue', 'concluido', 'confirmed'];
            const productSales = {};

            let recentProfit = 0;
            const recentRevenue = recentOrders.reduce((acc, order) => {
                const status = (order.status || '').toLowerCase();
                if (closedStatuses.includes(status)) {
                    const orderTotal = parseFloat(order.total_amount || order.total || 0);
                    acc += orderTotal;
                    
                    try {
                        let items = order.items;
                        if (typeof items === 'string') items = JSON.parse(items);
                        if (Array.isArray(items)) {
                            let orderCost = 0;
                            items.forEach(item => {
                                if (!item) return;
                                const title = item.title || 'Produto Desconhecido';
                                productSales[title] = (productSales[title] || 0) + (item.quantity || 1);
                                // CALCULO DE CUSTO: Usa cost_price do item ou 70% do preço como fallback
                                const itemPrice = parseFloat(item.price || 0);
                                const cost = parseFloat(item.cost_price || itemPrice * 0.7 || 0);
                                orderCost += cost * (item.quantity || 1);
                            });
                            recentProfit += (orderTotal - orderCost);
                        }
                    } catch (e) {}
                }
                return acc;
            }, 0);

            const topProducts = Object.entries(productSales)
                .map(([name, sales]) => ({ name, sales }))
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5);

            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const activeUsersRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
                Query.greaterThanEqual('last_login', startOfMonth.toISOString()),
                Query.limit(1)
            ]);

            setStats({
                totalUsers: usersRes.total,
                totalOrders: totalOrdersRes.total,
                recentOrdersCount: ordersRes.total,
                recentRevenue: recentRevenue,
                totalProfit: recentProfit,
                activeUsers: activeUsersRes.total,
                topProducts: topProducts,
                birthdaysToday: await fetchBirthdaysToday()
            });

            const settings = await getSettings();
            setBirthdayMessage(settings.birthday_message || '');
        } catch (error) {
            console.error("Error loading stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBirthdaysToday = async () => {
        try {
            const today = new Date();
            const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [Query.limit(5000)]);
            return res.documents.filter(doc => {
                if (!doc.birthday) return false;
                const bParts = doc.birthday.split('-');
                return `${bParts[1]}-${bParts[2]}` === todayStr;
            });
        } catch (e) { return []; }
    };

    const handleSendBirthdayMessage = async (user) => {
        if (!user.whatsapp) {
            showAlert("Este usuário não possui WhatsApp cadastrado.", "warning");
            return;
        }
        let msg = birthdayMessage || "Parabéns {nome}! A Wilson Distribuidora te deseja um dia incrível!";
        msg = msg.replace('{nome}', user.full_name || 'Amigo');
        const didSend = await sendWhatsAppMessage(user.whatsapp, msg);
        if (!didSend) {
            const cleanPhone = user.whatsapp.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            showAlert(`Parabéns enviado para ${user.full_name}! 🎉`, 'success');
        }
    };

    const handleBackfill = async () => {
        setLoading(true);
        const result = await backfillSKUs();
        setLoading(false);
        showAlert(result.success ? `Sincronização concluída! ✅` : `Erro: ${result.error}`, result.success ? 'success' : 'error');
        if (result.success) fetchStats();
    };

    const StatCard = ({ title, value, icon: Icon, color, trend, subtext }) => (
        <motion.div 
            whileHover={{ y: -5 }}
            style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '24px', 
                padding: '25px', 
                position: 'relative', 
                overflow: 'hidden',
                backdropFilter: 'blur(10px)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div style={{ background: `${color}15`, color: color, padding: '12px', borderRadius: '14px' }}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: trend > 0 ? '#22c55e' : '#ef4444', fontSize: '0.75rem', fontWeight: 900, background: trend > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div style={{ color: '#555', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>{title}</div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, marginBottom: '5px' }}>{value}</div>
            <div style={{ color: '#444', fontSize: '0.75rem', fontWeight: 700 }}>{subtext}</div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '4px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
        </motion.div>
    );

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#555' }}>
                <RefreshCw size={48} className="animate-spin" style={{ opacity: 0.1, marginBottom: '20px' }} />
                <p style={{ fontWeight: 800 }}>ORQUESTRANDO DADOS...</p>
            </div>
        );
    }

    const COLORS = ['#D4AF37', '#B69119', '#987300', '#7A5E00', '#5C4600'];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '20px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                <StatCard 
                    title="Receita Gerada" 
                    value={`R$ ${stats.recentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                    icon={DollarSign} 
                    color="#22c55e" 
                    trend={12}
                    subtext={`${stats.recentOrdersCount} transações concluídas`}
                />
                <StatCard 
                    title="Lucro Estimado" 
                    value={`R$ ${stats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                    icon={TrendingUp} 
                    color="#D4AF37" 
                    trend={5}
                    subtext="Faturamento - Custo (Real)"
                />
                <StatCard 
                    title="Novos Clientes" 
                    value={stats.totalUsers} 
                    icon={Users} 
                    color="#D4AF37" 
                    trend={8}
                    subtext="Base de usuários fidelizados"
                />
                <StatCard 
                    title="Engajamento" 
                    value={stats.activeUsers} 
                    icon={Activity} 
                    color="#3b82f6" 
                    subtext="Logados nos últimos 30 dias"
                />
                <StatCard 
                    title="Volume Total" 
                    value={stats.totalOrders} 
                    icon={ShoppingBag} 
                    color="#a855f7" 
                    subtext="Pedidos registrados na história"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '25px' }}>
                {/* Main Ranking Chart */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '30px', padding: '35px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>Best Sellers</h3>
                            <p style={{ color: '#444', fontSize: '0.85rem', fontWeight: 700, margin: '5px 0 0' }}>Ranking dos 5 produtos mais desejados.</p>
                        </div>
                        <div style={{ background: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '10px', borderRadius: '12px' }}>
                            <Trophy size={20} />
                        </div>
                    </div>
                    
                    <div style={{ height: '350px', width: '100%' }}>
                        {stats.topProducts.length > 0 ? (
                            <ResponsiveContainer>
                                <BarChart layout="vertical" data={stats.topProducts} margin={{ left: 40, right: 30 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" stroke="#555" tick={{ fontSize: 12, fontWeight: 700 }} width={120} />
                                    <Tooltip 
                                        contentStyle={{ background: '#111', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#D4AF37', fontWeight: 800 }}
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    />
                                    <Bar dataKey="sales" radius={[0, 10, 10, 0]} barSize={40}>
                                        {stats.topProducts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontWeight: 800 }}>DADOS INSUFICIENTES</div>
                        )}
                    </div>
                </div>

                {/* Birthdays Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05), transparent)', border: '1px solid rgba(212, 175, 55, 0.1)', borderRadius: '30px', padding: '30px', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                            <div style={{ background: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37', padding: '10px', borderRadius: '12px' }}>
                                <Cake size={24} />
                            </div>
                            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>Aniversariantes</h3>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {stats.birthdaysToday.length > 0 ? (
                                stats.birthdaysToday.map(u => (
                                    <div key={u.$id} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>{u.full_name.charAt(0)}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>{u.full_name}</div>
                                            <div style={{ color: '#555', fontSize: '0.75rem', fontWeight: 700 }}>{u.whatsapp}</div>
                                        </div>
                                        <button 
                                            onClick={() => handleSendBirthdayMessage(u)}
                                            style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' }}
                                        >
                                            <MessageCircle size={18} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: '#333' }}>
                                    <Star size={40} style={{ opacity: 0.1, marginBottom: '15px' }} />
                                    <p style={{ fontSize: '0.8rem', fontWeight: 800 }}>NENHUM EVENTO HOJE</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '30px', padding: '25px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '15px', borderRadius: '16px' }}>
                            <Target size={28} />
                        </div>
                        <div>
                            <div style={{ color: '#555', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>Objetivo do Mês</div>
                            <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>85% Concluído</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
