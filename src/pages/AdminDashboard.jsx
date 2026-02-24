import React, { useEffect, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, account } from '../lib/appwrite';
import { Query } from 'appwrite';
import { backfillSKUs } from '../services/dataService';
import {
    Users,
    ShoppingBag,
    TrendingUp,
    Activity,
    DollarSign,
    Calendar,
    Globe,
    Cake,
    MessageCircle
} from 'lucide-react';
import { getSettings } from '../services/dataService';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import './Admin.css'; // Reusing admin styles
import './AdminDashboard.css';
import { useAlert } from '../context/AlertContext';

const AdminDashboard = () => {
    const { showAlert, showConfirm } = useAlert();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        recentOrdersCount: 0,
        totalRevenue: 0,
        recentRevenue: 0,
        activeUsers: 0,
        topProducts: [],
        birthdaysToday: []
    });
    const [birthdayMessage, setBirthdayMessage] = useState('');
    // Local month helper: YYYY-MM
    const getCurrentMonth = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}`;
    };

    const [filterMode, setFilterMode] = useState('month'); // 'month' | 'all'
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, [selectedMonth, filterMode]);

    const fetchStats = async () => {
        try {
            // 1. Fetch Client Users Count
            const usersRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                [
                    Query.equal('role', 'client'),
                    Query.limit(1)
                ]
            );

            // 2. Prepare Order Queries based on Filter
            const orderQueries = [Query.limit(5000)]; // Appwrite limit for calculation

            if (filterMode === 'month') {
                const [year, month] = selectedMonth.split('-').map(Number);
                const start = new Date(year, month - 1, 1);
                const end = new Date(year, month, 1); // Start of next month

                orderQueries.push(Query.greaterThanEqual('$createdAt', start.toISOString()));
                orderQueries.push(Query.lessThan('$createdAt', end.toISOString()));
            }

            // 3. Fetch Orders for calculations
            const ordersRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                orderQueries
            );

            // Fetch Total Orders (Lifetime - used for the last card)
            const totalOrdersRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                [Query.limit(1)]
            );

            const recentOrders = ordersRes.documents;
            const closedStatuses = ['completed', 'delivered', 'concluído', 'entregue', 'concluido', 'confirmed'];
            const productSales = {};

            const recentRevenue = recentOrders.reduce((acc, order) => {
                const status = (order.status || '').toLowerCase();

                // Process items for Top Products regardless of status (or maybe only paid?)
                // Usually "Best Sellers" implies sold items, so we should probably check status too.
                // But often dashboard shows "Popularity" which counts even pending orders.
                // Let's count consistent with Revenue: only closed? Or at least not cancelled.
                // For simplicity and volume, let's include all non-cancelled orders or just stick to closedStatuses for strictness.
                // Let's use closedStatuses to match revenue logic.
                if (closedStatuses.includes(status)) {
                    // 1. Revenue
                    const orderTotal = parseFloat(order.total_amount || order.total || 0);
                    acc += orderTotal;

                    // 2. Top Products Processing
                    try {
                        let items = order.items;
                        if (typeof items === 'string') {
                            items = JSON.parse(items);
                        }

                        if (Array.isArray(items)) {
                            items.forEach(item => {
                                const title = item.title || 'Produto Desconhecido';
                                const qty = item.quantity || 1;

                                if (productSales[title]) {
                                    productSales[title] += qty;
                                } else {
                                    productSales[title] = qty;
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing items for order', order.$id, e);
                    }
                }
                return acc;
            }, 0);

            // Convert productSales map to array and sort
            const topProducts = Object.entries(productSales)
                .map(([name, sales]) => ({ name, sales }))
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5);

            // 4. activeUsersCount - Users logged in "this month"
            const startOfMonth = new Date();
            startOfMonth.setDate(1); // Set to 1st of month
            startOfMonth.setHours(0, 0, 0, 0); // Start of day

            const activeUsersRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                [
                    // Query might fail if index is building, but attribute exists now
                    Query.greaterThanEqual('last_login', startOfMonth.toISOString()),
                    Query.limit(1)
                ]
            );

            const activeUsersCount = activeUsersRes.total;

            const currentUser = await account.get(); // Fetch current user to check labels

            setStats({
                totalUsers: usersRes.total,
                totalOrders: totalOrdersRes.total,
                recentOrdersCount: ordersRes.total,
                totalRevenue: 0,
                recentRevenue: recentRevenue,
                activeUsers: activeUsersCount,
                topProducts: topProducts,
                birthdaysToday: await fetchBirthdaysToday()
            });

            // Fetch settings for birthday message
            const settings = await getSettings();
            setBirthdayMessage(settings.birthday_message || '');

        } catch (error) {
            console.error("Error loading dashboard stats:", error);
            setStats(prev => ({
                ...prev,
                debug: {
                    ...prev.debug,
                    error: error.message
                }
            }));
        } finally {
            setLoading(false);
        }
    };

    const fetchBirthdaysToday = async () => {
        try {
            const today = new Date();
            const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            // Appwrite doesn't support partial string suffix matching in Query well for MM-DD
            // so we fetch users and filter client-side. Profiles shouldn't be massive for small boutique.
            const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [
                Query.limit(5000)
            ]);

            return res.documents.filter(doc => {
                if (!doc.birthday) return false;
                // birthday is YYYY-MM-DD
                const bParts = doc.birthday.split('-');
                if (bParts.length < 3) return false;
                const bStr = `${bParts[1]}-${bParts[2]}`;
                return bStr === todayStr;
            });
        } catch (e) {
            console.error("Error fetching birthdays:", e);
            return [];
        }
    };

    const handleSendBirthdayMessage = (user) => {
        if (!user.whatsapp) {
            showAlert("Este usuário não possui WhatsApp cadastrado.", "warning");
            return;
        }

        let msg = birthdayMessage || "Parabéns {nome}! A Boutique de Carne 3R te deseja um dia incrível!";
        msg = msg.replace('{nome}', user.full_name || 'Amigo');

        const cleanPhone = user.whatsapp.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encodeURIComponent(msg)}`;
        window.open(whatsappUrl, '_blank');
    };

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="stat-card">
            <div className="stat-card-header">
                <div className="stat-info">
                    <p className="stat-title">{title}</p>
                    <h3 className="stat-value">{value}</h3>
                </div>
                <div className="stat-icon-wrapper" style={{ backgroundColor: `${color}20`, color: color }}>
                    <Icon size={24} />
                </div>
            </div>
            {subtext && <p className="stat-subtext">{subtext}</p>}
        </div>
    );

    const handleBackfill = async () => {
        setLoading(true);
        const result = await backfillSKUs();
        setLoading(false);
        if (result.success) {
            showAlert(`Backfill concluído! ${result.updatedCount} produtos atualizados. ✅`, 'success');
        } else {
            showAlert(`Erro no backfill: ${result.error} ❌`, 'error');
        }
    };

    if (loading) {
        return <div className="admin-container"><p style={{ padding: '2rem' }}>Carregando dashboard...</p></div>;
    }

    // Chart Colors
    const COLORS = ['#D4AF37', '#C5A028', '#B69119', '#A7820A', '#987300'];

    return (
        <div className="admin-container">
            <div className="admin-content-inner">
                <div className="admin-section-header dashboard-header">
                    <div>
                        <h2>Dashboard</h2>
                        <p className="section-subtitle">Visão geral da performance da loja.</p>
                    </div>

                    <div className="admin-dashboard-filters">
                        <div className="filter-mode-toggle">
                            <button
                                onClick={() => setFilterMode('month')}
                                className={`filter-btn ${filterMode === 'month' ? 'active' : ''}`}
                            >
                                <Calendar size={18} /> Mensal
                            </button>
                            <button
                                onClick={() => setFilterMode('all')}
                                className={`filter-btn ${filterMode === 'all' ? 'active' : ''}`}
                            >
                                <Globe size={18} /> Ver Tudo
                            </button>
                        </div>

                        {filterMode === 'month' && (
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="month-picker"
                            />
                        )}

                        <button
                            onClick={handleBackfill}
                            className="backfill-btn"
                        >
                            Atualizar SKUs (Backfill)
                        </button>
                    </div>
                </div>

                <div className="stats-grid">
                    <StatCard
                        title={filterMode === 'month' ? `Vendas (${selectedMonth})` : 'Vendas (Todo o Tempo)'}
                        value={`R$ ${stats.recentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        icon={DollarSign}
                        color="#4caf50" // Green
                        subtext={`${stats.recentOrdersCount} pedidos no período`}
                    />
                    <StatCard
                        title="Usuários Totais"
                        value={stats.totalUsers}
                        icon={Users}
                        color="#2196f3" // Blue
                        subtext="Clientes cadastrados"
                    />
                    <StatCard
                        title="Usuários Ativos"
                        value={stats.activeUsers}
                        icon={Activity}
                        color="#ff9800" // Orange
                        subtext="Logados este mês"
                    />
                    <StatCard
                        title="Total de Pedidos"
                        value={stats.totalOrders}
                        icon={ShoppingBag}
                        color="#9c27b0" // Purple
                        subtext="Histórico completo"
                    />
                </div>

                <div className="charts-section">
                    {/* Top 5 Products Chart (Requested in 'Recent Activity' slot) */}
                    <div className="chart-container">
                        <h3 className="chart-title">Ranking: Top 5 Produtos Mais Vendidos</h3>
                        <div className="chart-wrapper">
                            {stats.topProducts.length > 0 ? (
                                <ResponsiveContainer>
                                    <BarChart
                                        layout="vertical"
                                        data={stats.topProducts}
                                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                        <XAxis type="number" stroke="#888" />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            stroke="#fff"
                                            width={100}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#333', borderColor: '#D4AF37', color: '#fff' }}
                                            itemStyle={{ color: '#D4AF37' }}
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                        />
                                        <Bar dataKey="sales" name="Vendas" radius={[0, 4, 4, 0]} barSize={30}>
                                            {stats.topProducts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="chart-empty-state">
                                    <p>Sem dados de vendas suficientes.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="chart-container">
                        <h3 className="chart-title">Visão Geral (Em breve)</h3>
                        <div className="chart-placeholder">
                            <p>Análise detalhada em desenvolvimento</p>
                        </div>
                    </div>
                </div>

                {/* Birthdays Section */}
                <div className="birthdays-section" style={{ marginTop: '20px' }}>
                    <div className="chart-container" style={{ minHeight: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <Cake className="stat-icon" style={{ color: '#D4AF37' }} />
                            <h3 className="chart-title" style={{ margin: 0 }}>Aniversariantes de Hoje ({stats.birthdaysToday.length})</h3>
                        </div>

                        {stats.birthdaysToday.length > 0 ? (
                            <div className="birthdays-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                                {stats.birthdaysToday.map(u => (
                                    <div key={u.$id} style={{
                                        background: 'rgba(212, 175, 55, 0.05)',
                                        border: '1px solid rgba(212, 175, 55, 0.2)',
                                        padding: '15px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#fff' }}>{u.full_name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#888' }}>{u.whatsapp || 'Sem WhatsApp'}</div>
                                        </div>
                                        <button
                                            onClick={() => handleSendBirthdayMessage(u)}
                                            style={{
                                                background: '#25D366',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                fontSize: '0.85rem',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            <MessageCircle size={16} /> Enviar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Nenhum aniversariante hoje.</p>
                        )}
                    </div>
                </div>


            </div>
        </div>
    );
};

export default AdminDashboard;
