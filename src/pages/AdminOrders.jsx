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
                                    <div style={{ fontSize: '0.85rem', color: '#D4AF37', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {order.$id.startsWith('WD') ? `#${order.$id}` : `ID: ${order.$id.substring(0, 8).toUpperCase()}`} • <span style={{ color: '#555', fontSize: '0.75rem' }}>{new Date(order.$createdAt).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: 800 }}>TOTAL</div>
                                    <div style={{ fontWeight: 900, color: '#fff', fontSize: '1.2rem' }}>R$ {parseFloat(order.total || 0).toFixed(2)}</div>
                                </div>
                                <div style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 900, background: order.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)', color: order.status === 'completed' ? '#22c55e' : '#fbbf24' }}>
                                    {order.status?.toUpperCase() || 'PENDENTE'}
                                </div>
                                <ChevronDown size={20} style={{ transform: expandedOrder === order.$id ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                            </div>
                        </div>
                        <AnimatePresence>
                            {expandedOrder === order.$id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)', padding: '30px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 15px', fontSize: '0.75rem', color: '#555', fontWeight: 900 }}>ITENS DO PEDIDO</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                {(() => {
                                                    try {
                                                        const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                                                        return items.map((item, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                                <span>{item.quantity}x {item.title}</span>
                                                                <span style={{ fontWeight: 800 }}>R$ {(item.price * item.quantity).toFixed(2)}</span>
                                                            </div>
                                                        ));
                                                    } catch (e) {
                                                        return <div style={{ color: '#ef4444', fontSize: '0.8rem' }}>Erro ao ler itens do pedido.</div>;
                                                    }
                                                })()}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 15px', fontSize: '0.75rem', color: '#555', fontWeight: 900 }}>DADOS DE ENTREGA</h4>
                                            <div style={{ fontSize: '0.85rem', color: '#888', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                    <Phone size={16} color="#D4AF37" style={{ marginTop: '2px' }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 900, textTransform: 'uppercase' }}>WhatsApp</div>
                                                        <div style={{ fontWeight: 700, color: '#fff' }}>{order.customer_phone || 'N/A'}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                    <MapPin size={16} color="#D4AF37" style={{ marginTop: '2px' }} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>Endereço de Entrega</div>
                                                        {(() => {
                                                            try {
                                                                if (!order.delivery_address) return <div style={{ fontWeight: 700, color: '#fff' }}>Retirada na Loja</div>;
                                                                const addr = typeof order.delivery_address === 'string' ? JSON.parse(order.delivery_address) : order.delivery_address;
                                                                if (!addr || typeof addr !== 'object') throw new Error();
                                                                
                                                                return (
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                                        <div style={{ gridColumn: 'span 2' }}>
                                                                            <span style={{ fontSize: '0.6rem', color: '#555', display: 'block' }}>RUA</span>
                                                                            <span style={{ fontWeight: 700, color: '#fff' }}>{addr.address_street || addr.street || '---'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span style={{ fontSize: '0.6rem', color: '#555', display: 'block' }}>NÚMERO</span>
                                                                            <span style={{ fontWeight: 700, color: '#fff' }}>{addr.address_number || addr.number || 'S/N'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span style={{ fontSize: '0.6rem', color: '#555', display: 'block' }}>BAIRRO</span>
                                                                            <span style={{ fontWeight: 700, color: '#fff' }}>{addr.address_neighborhood || addr.neighborhood || '---'}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span style={{ fontSize: '0.6rem', color: '#555', display: 'block' }}>CIDADE</span>
                                                                            <span style={{ fontWeight: 700, color: '#fff' }}>{addr.address_city || addr.city || '---'} - {addr.address_state || addr.state || ''}</span>
                                                                        </div>
                                                                        <div>
                                                                            <span style={{ fontSize: '0.6rem', color: '#555', display: 'block' }}>CEP</span>
                                                                            <span style={{ fontWeight: 700, color: '#fff' }}>{addr.address_cep || addr.cep || '---'}</span>
                                                                        </div>
                                                                        { (addr.address_complement || addr.complement) && (
                                                                            <div style={{ gridColumn: 'span 2' }}>
                                                                                <span style={{ fontSize: '0.6rem', color: '#555', display: 'block' }}>COMPLEMENTO</span>
                                                                                <span style={{ fontWeight: 700, color: '#fff' }}>{addr.address_complement || addr.complement}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            } catch (e) {
                                                                return <div style={{ fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{order.delivery_address || 'Retirada na Loja'}</div>;
                                                            }
                                                        })()}
                                                    </div>
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
