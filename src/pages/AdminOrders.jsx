
import React, { useEffect, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';
import { Search, Filter, Calendar, User, Package, Hash, ChevronDown, ChevronUp } from 'lucide-react';
import { useAlert } from '../context/AlertContext';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showAlert } = useAlert();

    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                [Query.orderDesc('$createdAt'), Query.limit(100)]
            );
            setOrders(response.documents);
        } catch (error) {
            console.error("Error loading orders:", error);
            showAlert("Erro ao carregar pedidos", "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        const matchesSearch = !search ||
            (order.customer_name && order.customer_name.toLowerCase().includes(search.toLowerCase())) ||
            (order.order_number && order.order_number.toString().includes(search));
        return matchesStatus && matchesSearch;
    });

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="admin-content-inner">
            <div className="admin-section-header">
                <h2>Gerenciar Pedidos</h2>
            </div>

            <div className="filters-bar">
                <div className="search-input-wrapper" style={{ flex: 1 }}>
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente ou nº pedido..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="filter-input-main"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select-main"
                >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendente</option>
                    <option value="processing">Em Processamento</option>
                    <option value="completed">Concluído</option>
                    <option value="cancelled">Cancelado</option>
                    <option value="success">Sucesso</option>
                </select>
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '40px' }}>Carregando pedidos...</p>
            ) : filteredOrders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Nenhum pedido encontrado.</p>
            ) : (
                <div className="orders-list">
                    {filteredOrders.map(order => (
                        <div key={order.$id} className={`order-card ${expandedOrder === order.$id ? 'expanded' : ''}`}
                            style={{ background: '#1a1a1a', borderRadius: '8px', marginBottom: '15px', border: '1px solid #333', overflow: 'hidden' }}>
                            <div className="order-summary-row" onClick={() => setExpandedOrder(expandedOrder === order.$id ? null : order.$id)}
                                style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Pedido</div>
                                        <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>#{order.order_number || order.$id.slice(-6).toUpperCase()}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Cliente</div>
                                        <div style={{ fontWeight: 'bold' }}>{order.customer_name}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Data/Hora</div>
                                        <div style={{ fontSize: '0.9rem' }}>{formatDate(order.$createdAt)}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Total</div>
                                        <div style={{ fontWeight: 'bold', color: '#fff' }}>R$ {parseFloat(order.total || 0).toFixed(2)}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <span className={`badge status-${order.status || 'pending'}`}
                                        style={{ padding: '5px 10px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: '#333' }}>
                                        {String(order.status || 'pendente').toUpperCase()}
                                    </span>
                                    {expandedOrder === order.$id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                            </div>

                            {expandedOrder === order.$id && (
                                <div className="order-details-expanded" style={{ padding: '20px', borderTop: '1px solid #333', background: '#121212' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                                        <div>
                                            <h4 style={{ color: 'var(--primary-color)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <User size={16} /> Dados do Cliente
                                            </h4>
                                            <p><strong>Nome:</strong> {order.customer_name}</p>
                                            <p><strong>WhatsApp:</strong> {order.customer_phone}</p>
                                            <p><strong>Pagamento:</strong> {order.payment_method || 'A combinar'}</p>
                                        </div>
                                        <div>
                                            <h4 style={{ color: 'var(--primary-color)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Package size={16} /> Itens do Pedido
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {Array.isArray(order.items) ? order.items.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #222', paddingBottom: '5px' }}>
                                                        <span>{item.quantity}x {item.title}</span>
                                                        <span style={{ color: '#888' }}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                )) : (
                                                    <p style={{ color: '#666' }}>{typeof order.items === 'string' ? order.items : 'Lista de itens não disponível'}</p>
                                                )}
                                            </div>
                                            <div style={{ marginTop: '15px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                TOTAL: R$ {parseFloat(order.total || 0).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
