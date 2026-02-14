
import React, { useEffect, useState } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { useAuth } from '../context/AuthContext';
import { Query } from 'appwrite';
import { ArrowLeft, Package, Clock, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import './OrderHistory.css';

const OrderHistory = () => {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                loadOrders(user.$id); // Appwrite uses $id
            } else {
                setLoading(false);
            }
        }
    }, [user, authLoading]);

    const loadOrders = async (uid) => {
        try {
            const response = await databases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ORDERS,
                [
                    Query.equal('user_id', uid),
                    Query.orderDesc('$createdAt') // Appwrite standard field
                ]
            );

            // Map Appwrite docs to expected format
            const mappedOrders = response.documents.map(doc => ({
                ...doc,
                id: doc.$id,
                created_at: doc.$createdAt,
                // Items might be stored as a JSON string or related docs. 
                // Assuming JSON string based on Supabase schema usage pattern, or array if structured.
                // If it's a JSON string, we parse it.
                items: typeof doc.items === 'string' ? JSON.parse(doc.items) : (doc.items || [])
            }));

            setOrders(mappedOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to repeat order (re-add items to cart) - for now just a placeholder action
    const handleRepeatOrder = (order) => {
        // Logic to add items to cart would require context access
        // Ideally we redirect to home with items added, or just show a message "Added to cart"
        alert('Funcionalidade de repetir pedido em desenvolvimento!');
    };

    if (authLoading) return <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>Carregando autenticação...</div>;

    return (
        <div className="order-history-container">
            <Header activeCategory="none" onCategoryChange={() => { }} />

            <main className="history-content">
                <div className="history-header">
                    <h1>Meus Pedidos</h1>
                    <Link to="/" className="back-link"><ArrowLeft size={18} /> Voltar as compras</Link>
                </div>

                {loading ? (
                    <div className="loading" style={{ textAlign: 'center', padding: '2rem' }}>Carregando seus pedidos...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-history" style={{ textAlign: 'center', padding: '2rem' }}>
                        <ShoppingBag size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                        <p>Você ainda não fez nenhum pedido.</p>
                        <Link to="/" className="cta-btn" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1rem', background: '#333', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
                            Fazer meu primeiro pedido
                        </Link>
                    </div>
                ) : (
                    <div className="orders-list">
                        {orders.map((order) => (
                            <div key={order.id} className="order-card" style={{ border: '1px solid #ddd', padding: '1rem', marginBottom: '1rem', borderRadius: '8px' }}>
                                <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div className="order-info" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span className="order-id" style={{ fontWeight: 'bold' }}>
                                            Pedido {order.order_number ? `#${order.order_number.toString().padStart(5, '0')}` : `#${order.id.slice(0, 8).toUpperCase()}`}
                                        </span>
                                        <span className="order-date" style={{ fontSize: '0.9rem', color: '#666' }}>
                                            <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                            {formatDate(order.created_at)}
                                        </span>
                                    </div>
                                    <span className="order-status completed" style={{ background: '#d1fae5', color: '#065f46', padding: '0.25rem 0.75rem', borderRadius: '14px', fontSize: '0.8rem' }}>
                                        {order.status || 'Concluído'}
                                    </span>
                                </div>

                                <div className="order-items" style={{ marginBottom: '1rem' }}>
                                    {/* Handle items whether they are JSON array or object with items property */}
                                    {(() => {
                                        const items = Array.isArray(order.items) ? order.items : (order.items?.items || []);
                                        return items.map((item, idx) => (
                                            <div key={idx} className="order-item-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                                <span>{item.quantity}x {item.title || 'Produto'}</span>
                                                <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                <div className="order-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                    <div className="order-total">
                                        <span style={{ marginRight: '0.5rem' }}>Total:</span>
                                        <span className="total-value" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>R$ {parseFloat(order.total_amount || order.total).toFixed(2)}</span>
                                    </div>
                                    <button className="repeat-btn" onClick={() => handleRepeatOrder(order)} style={{ padding: '0.5rem 1rem', background: '#f3f4f6', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                        Repetir Pedido
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default OrderHistory;
