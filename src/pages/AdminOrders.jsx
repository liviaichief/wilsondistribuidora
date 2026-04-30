import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../services/dataService';
import { ShoppingBag, Search, Clock, CheckCircle2, XCircle, ChevronDown, Package, User, Phone, MapPin, Calendar, Loader2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const { showAlert } = useAlert();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getOrders();
            setOrders(data.documents || []);
        } catch (err) { showAlert('Erro ao carregar pedidos', 'error'); } finally { setLoading(false); }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(orders.map(o => o.$id === orderId ? { ...o, status: newStatus } : o));
            showAlert('Status atualizado!', 'success', null, 3000);
        } catch (err) { showAlert('Erro ao atualizar status', 'error'); }
    };

    const filteredOrders = orders.filter(o => {
        const matchesStatus = filter === 'all' || o.status === filter;
        const matchesSearch = (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) || (o.$id || '').includes(search);
        return matchesStatus && matchesSearch;
    });

    if (loading) return null;

    return (
        <div style={{ padding: '0 20px 40px' }}>

            <div className="glass-card" style={{ padding: '30px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 15px' }}>
                        <Search size={20} color="#555" />
                        <input placeholder="Buscar por cliente ou ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', padding: '15px 12px', width: '100%', outline: 'none' }} />
                    </div>
                    <select value={filter} onChange={e => setFilter(e.target.value)} style={{ background: 'rgba(0,0,0,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '0 20px', cursor: 'pointer', fontWeight: 700 }}>
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="processing">Em Processamento</option>
                        <option value="completed">Concluídos</option>
                        <option value="cancelled">Cancelados</option>
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredOrders.map(order => (
                    <motion.div key={order.$id} layout className="glass-card" style={{ overflow: 'hidden', border: expandedOrder === order.$id ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.08)' }}>
                        <div onClick={() => setExpandedOrder(expandedOrder === order.$id ? null : order.$id)} style={{ padding: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '14px' }}><Package size={24} color="#D4AF37" /></div>
                                <div>
                                    <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>{order.customer_name || 'Cliente Final'}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: 600 }}>
                                        {new Date(order.$createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: 800 }}>TOTAL</div>
                                    <div style={{ fontWeight: 900, color: '#fff', fontSize: '1.2rem' }}>R$ {parseFloat(order.total || 0).toFixed(2)}</div>
                                </div>
                                <div style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900, background: order.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)', color: order.status === 'completed' ? '#22c55e' : '#fbbf24' }}>
                                    #{order.$id?.toUpperCase()}
                                </div>
                                <ChevronDown size={20} style={{ transform: expandedOrder === order.$id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                            </div>
                        </div>
                        <AnimatePresence>
                            {expandedOrder === order.$id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', padding: '30px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '30px' }}>
                                        {/* COLUNA ESQUERDA: ITENS */}
                                        <div style={{ minWidth: 0 }}>
                                            <h4 style={{ margin: '0 0 15px', fontSize: '0.75rem', color: '#555', fontWeight: 900 }}>ITENS DO PEDIDO</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '40px 120px 1fr 80px', gap: '15px', padding: '0 5px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '5px' }}>
                                                    <div style={{ fontSize: '0.6rem', color: '#aaa', fontWeight: 900 }}>QTD</div>
                                                    <div style={{ fontSize: '0.6rem', color: '#aaa', fontWeight: 900 }}>CÓD. EXTERNO</div>
                                                    <div style={{ fontSize: '0.6rem', color: '#aaa', fontWeight: 900 }}>NOME ITEM</div>
                                                    <div style={{ fontSize: '0.6rem', color: '#aaa', fontWeight: 900, textAlign: 'right' }}>PREÇO</div>
                                                </div>
                                                {(() => {
                                                    try {
                                                        const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                                                        return items.map((item, idx) => (
                                                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '40px 120px 1fr 80px', gap: '15px', alignItems: 'center', padding: '0 5px' }}>
                                                                <div style={{ fontWeight: 900, color: '#D4AF37', fontSize: '0.85rem' }}>{item.quantity}x</div>
                                                                <div style={{ color: '#fff', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>{item.external_code || '---'}</div>
                                                                <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500 }}>{item.title}</div>
                                                                <div style={{ fontWeight: 800, textAlign: 'right', color: '#fff', fontSize: '0.85rem' }}>R$ {(item.price * item.quantity).toFixed(2)}</div>
                                                            </div>
                                                        ));
                                                    } catch (e) {
                                                        return <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>Erro ao carregar itens</div>;
                                                    }
                                                })()}
                                            </div>
                                        </div>

                                        {/* COLUNA DIREITA: ENTREGA */}
                                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', paddingLeft: '20px' }}>
                                            <h4 style={{ margin: '0 0 15px', fontSize: '0.75rem', color: '#555', fontWeight: 900 }}>DADOS DE ENTREGA</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Cliente</span>
                                                    <div style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 700 }}>{order.customer_name}</div>
                                                    <div style={{ color: '#888', fontSize: '0.8rem' }}>{order.customer_phone}</div>
                                                </div>

                                                <div>
                                                    <span style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Forma de Entrega</span>
                                                    <div style={{ color: '#D4AF37', fontSize: '0.8rem', fontWeight: 800 }}>
                                                        {order.delivery_mode === 'pickup' ? 'RETIRADA NA LOJA' : 'ENTREGA NO ENDEREÇO'}
                                                    </div>
                                                </div>

                                                {order.delivery_mode === 'delivery' && order.delivery_address && (() => {
                                                    try {
                                                        const addr = typeof order.delivery_address === 'string' ? JSON.parse(order.delivery_address) : order.delivery_address;
                                                        return (
                                                            <div>
                                                                <span style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Endereço</span>
                                                                <div style={{ color: '#fff', fontSize: '0.8rem', lineHeight: '1.4' }}>
                                                                    {addr.street}, {addr.number}<br />
                                                                    {addr.neighborhood}<br />
                                                                    {addr.city} - {addr.cep}
                                                                    {addr.complement && <><br /><span style={{ color: '#666' }}>({addr.complement})</span></>}
                                                                </div>
                                                            </div>
                                                        );
                                                    } catch (e) { return null; }
                                                })()}

                                                <div>
                                                    <span style={{ fontSize: '0.6rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Pagamento</span>
                                                    <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>{order.payment_method || 'A combinar'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default AdminOrders;
