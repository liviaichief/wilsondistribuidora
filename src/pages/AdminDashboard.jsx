import React, { useEffect, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS, account } from '../lib/appwrite';
import { Query } from 'appwrite';
import { backfillSKUs } from '../services/dataService';
import {
    Users,
    ShoppingBag,
    TrendingUp,
    Activity,
    DollarSign
} from 'lucide-react';
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
        topProducts: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

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

            // 2. Fetch Total Orders (All Time)
            const totalOrdersRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                [Query.limit(1)]
            );

            // 3. Fetch Recent Orders (Revenue Calculation - Last 30 Days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // We need to fetch all recent orders to calculate revenue
            // Appwrite limit is 5000, usually enough for "recent" unless huge volume
            const ordersRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                [
                    Query.greaterThanEqual('$createdAt', thirtyDaysAgo.toISOString()),
                    Query.limit(100)
                ]
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
                    Query.greaterThanEqual('last_login', startOfMonth.toISOString()), // Filter by Login Date
                    Query.limit(1) // We only care about total
                ]
            );

            // If query fails (field missing), fallback to mock or 0
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
                debug: {
                    userId: currentUser.$id,
                    labels: currentUser.labels || [],
                    rawOrdersCount: ordersRes.total,
                    filters: { thirtyDaysAgo: thirtyDaysAgo.toISOString() },
                    error: null
                }
            });

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

    const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
        <div className="stat-card" style={{
            background: '#1e1e1e',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid #333'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '4px' }}>{title}</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                        {value}
                    </h3>
                </div>
                <div style={{
                    backgroundColor: `${color}20`,
                    padding: '10px',
                    borderRadius: '8px',
                    color: color
                }}>
                    <Icon size={24} />
                </div>
            </div>
            {subtext && (
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                    {subtext}
                </p>
            )}
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
            <div className="admin-content">
                <div className="header-title" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2>Dashboard</h2>
                        <p style={{ color: '#888' }}>Visão geral da performance da loja.</p>
                    </div>
                    <button
                        onClick={handleBackfill}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#333',
                            color: '#fff',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Atualizar SKUs (Backfill)
                    </button>
                </div>

                <div className="stats-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px'
                }}>
                    <StatCard
                        title="Vendas (30 dias)"
                        value={`R$ ${stats.recentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        icon={DollarSign}
                        color="#4caf50" // Green
                        subtext={`${stats.recentOrdersCount} pedidos recentes`}
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

                <div className="charts-section" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '20px'
                }}>
                    {/* Top 5 Products Chart (Requested in 'Recent Activity' slot) */}
                    <div style={{
                        background: '#1e1e1e',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid #333',
                        minHeight: '300px'
                    }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Ranking: Top 5 Produtos Mais Vendidos</h3>
                        <div style={{ width: '100%', height: 300 }}>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                                    <p>Sem dados de vendas suficientes.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{
                        background: '#1e1e1e',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid #333',
                        minHeight: '300px'
                    }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Visão Geral (Em breve)</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#444' }}>
                            <p>Análise detalhada em desenvolvimento</p>
                        </div>
                    </div>
                </div>

                {/* Debug Section for Production Troubleshooting */}
                <div style={{ marginTop: '40px', padding: '20px', background: '#000', border: '1px solid #333', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px', color: '#0f0' }}>
                    <h4>🔧 Debug Info (Admin Only)</h4>
                    <p>App Version: {import.meta.env.VITE_APP_VERSION || 'Unknown'}</p>
                    <p>User ID: {stats.debug?.userId || 'Not loaded'}</p>
                    <p>User Labels: {stats.debug?.labels?.join(', ') || 'None'}</p>
                    <p>Raw Orders Found: {stats.debug?.rawOrdersCount ?? '?'}</p>
                    <p>Filters Used: {JSON.stringify(stats.debug?.filters || {})}</p>
                    {stats.debug?.error && (
                        <p style={{ color: 'red' }}>Last Error: {stats.debug.error}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
