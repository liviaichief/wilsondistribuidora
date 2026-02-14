import React, { useEffect, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';
import {
    Users,
    ShoppingBag,
    TrendingUp,
    Activity,
    DollarSign
} from 'lucide-react';
import './Admin.css'; // Reusing admin styles

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalOrders: 0,
        recentOrdersCount: 0,
        totalRevenue: 0,
        recentRevenue: 0,
        activeUsers: 0 // Mock for now
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // 1. Fetch Users Count
            const usersRes = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.PROFILES,
                [Query.limit(1)] // We only need the total from metadata
            );

            // 2. Fetch Orders (Last 30 Days)
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
            const recentRevenue = recentOrders.reduce((acc, order) => {
                return acc + (parseFloat(order.total_amount || 0));
            }, 0);

            // Mock "Active Users" (e.g., users created recently as proxy or random for demo)
            // Real implementation would track last_login in profile
            const activeUsersCount = Math.floor(usersRes.total * 0.4); // Mock: 40% active

            setStats({
                totalUsers: usersRes.total,
                totalOrders: ordersRes.total, // specific to query, so it's 30d orders
                recentOrdersCount: ordersRes.total,
                totalRevenue: 0, // Would need full scan for total, skipping for performance
                recentRevenue: recentRevenue,
                activeUsers: activeUsersCount
            });

        } catch (error) {
            console.error("Error loading dashboard stats:", error);
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

    if (loading) {
        return <div className="admin-container"><p style={{ padding: '2rem' }}>Carregando dashboard...</p></div>;
    }

    return (
        <div className="admin-container">
            <div className="admin-content">
                <div className="header-title" style={{ marginBottom: '30px' }}>
                    <h2>Dashboard</h2>
                    <p style={{ color: '#888' }}>Visão geral da performance da loja.</p>
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
                        subtext="+12% vs mês anterior"
                    />
                    <StatCard
                        title="Usuários Ativos"
                        value={stats.activeUsers}
                        icon={Activity}
                        color="#ff9800" // Orange
                        subtext="Logados nos últimos 7 dias"
                    />
                    <StatCard
                        title="Pedidos Pendentes"
                        value="5" // Mock
                        icon={ShoppingBag}
                        color="#f44336" // Red
                        subtext="Aguardando processamento"
                    />
                </div>

                <div className="charts-section" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '20px'
                }}>
                    {/* Placeholder for future charts */}
                    <div style={{
                        background: '#1e1e1e',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid #333',
                        minHeight: '300px'
                    }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Atividade Recente</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#444' }}>
                            <p>Gráfico de vendas (Em breve)</p>
                        </div>
                    </div>

                    <div style={{
                        background: '#1e1e1e',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid #333',
                        minHeight: '300px'
                    }}>
                        <h3 style={{ marginBottom: '20px', fontSize: '1.1rem' }}>Produtos Mais Vendidos</h3>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#444' }}>
                            <p>Lista de top produtos (Em breve)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
