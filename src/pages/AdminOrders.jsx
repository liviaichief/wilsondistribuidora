import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../services/dataService';
import { ShoppingBag, Search, Package, X, ChevronRight, MapPin, Phone, CreditCard, Truck, Store, RefreshCw, Loader2 } from 'lucide-react';
import { useAlert } from '../context/AlertContext';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── helpers ─────────────────────────────────────────────── */
const STATUS_META = {
    pending:    { label: 'Pendente',       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)' },
    processing: { label: 'Processando',    color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.25)' },
    completed:  { label: 'Concluído',      color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)' },
    cancelled:  { label: 'Cancelado',      color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' },
};

const fmtCurrency = (v) =>
    parseFloat(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) +
        ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const parseItems = (raw) => {
    try { return typeof raw === 'string' ? JSON.parse(raw) : (raw || []); }
    catch { return []; }
};

/* ─── StatusPill ──────────────────────────────────────────── */
const StatusPill = ({ status, small }) => {
    const m = STATUS_META[status] || STATUS_META.pending;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: small ? '3px 9px' : '5px 12px',
            borderRadius: '999px',
            fontSize: small ? '0.6rem' : '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: m.color,
            background: m.bg,
            border: `1px solid ${m.border}`,
            whiteSpace: 'nowrap'
        }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
            {m.label}
        </span>
    );
};

/* ─── OrderDetailsContent (REUSABLE) ───────────────────────── */
const OrderDetailsContent = ({ order, onStatusChange }) => {
    const items = parseItems(order.items);
    const addr = (() => {
        try { return typeof order.delivery_address === 'string' ? JSON.parse(order.delivery_address) : order.delivery_address; }
        catch { return null; }
    })();

    const nextStatuses = {
        pending:    ['processing', 'cancelled'],
        processing: ['completed', 'cancelled'],
        completed:  [],
        cancelled:  [],
    };
    const actions = nextStatuses[order.status] || [];

    return (
        <div style={{ padding: '20px' }}>
            {/* Itens */}
            <div style={{ marginBottom: 22 }}>
                <div style={{ fontSize: '0.62rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 12 }}>
                    Itens do Pedido
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                                <span style={{ fontWeight: 900, color: '#D4AF37', fontSize: '0.8rem', flexShrink: 0 }}>{item.quantity}×</span>
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                                    {item.external_code && (
                                        <div style={{ fontSize: '0.62rem', color: '#444', fontWeight: 700, fontFamily: 'monospace', marginTop: 2 }}>{item.external_code}</div>
                                    )}
                                </div>
                            </div>
                            <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.82rem', flexShrink: 0, marginLeft: 10 }}>
                                {fmtCurrency(item.price * item.quantity)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'rgba(212,175,55,0.06)', borderRadius: 14, border: '1px solid rgba(212,175,55,0.15)', marginBottom: 22 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Total do Pedido</span>
                <span style={{ fontWeight: 900, color: '#D4AF37', fontSize: '1.1rem' }}>{fmtCurrency(order.total)}</span>
            </div>

            {/* Entrega & Pagamento */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
                <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {order.delivery_mode === 'pickup' ? <Store size={10} /> : <Truck size={10} />} Entrega
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37' }}>
                        {order.delivery_mode === 'pickup' ? 'Retirada' : 'Delivery'}
                    </div>
                </div>
                <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '0.58rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <CreditCard size={10} /> Pagamento
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>
                        {order.payment_method || 'A combinar'}
                    </div>
                </div>
            </div>

            {/* Contato */}
            {(order.customer_phone || order.customer_name) && (
                <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Phone size={16} color="#555" />
                    <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{order.customer_name}</div>
                        {order.customer_phone && <div style={{ fontSize: '0.72rem', color: '#666', marginTop: 2 }}>{order.customer_phone}</div>}
                    </div>
                </div>
            )}

            {/* Endereço */}
            {addr && order.delivery_mode === 'delivery' && (
                <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', marginBottom: 22, display: 'flex', gap: 12 }}>
                    <MapPin size={16} color="#555" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.78rem', color: '#aaa', lineHeight: 1.6 }}>
                        {addr.street}, {addr.number}<br />
                        {addr.neighborhood} — {addr.city}<br />
                        <span style={{ color: '#555' }}>{addr.cep}</span>
                        {addr.complement && <><br /><span style={{ color: '#555' }}>({addr.complement})</span></>}
                    </div>
                </div>
            )}

            {/* Ações de status */}
            {actions.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 10 }}>
                    <div style={{ fontSize: '0.62rem', color: '#444', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>Atualizar Status</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {actions.map(s => {
                            const m = STATUS_META[s];
                            return (
                                <button
                                    key={s}
                                    onClick={() => onStatusChange(order.$id, s)}
                                    style={{
                                        flex: 1, minWidth: '160px', padding: '14px', borderRadius: 14,
                                        background: m.bg, border: `1px solid ${m.border}`,
                                        color: m.color, fontWeight: 900, fontSize: '0.85rem',
                                        cursor: 'pointer', letterSpacing: '0.5px',
                                        textTransform: 'uppercase'
                                    }}
                                >
                                    Marcar como {m.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── OrderDetailSheet ────────────────────────────────────── */
const OrderDetailSheet = ({ order, onClose, onStatusChange }) => {
    return (
        <>
            {/* backdrop */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 300 }}
            />

            {/* sheet */}
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 301,
                    background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)',
                    borderRadius: '28px 28px 0 0',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderBottom: 'none',
                    maxHeight: '88vh',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* drag handle */}
                <div style={{ display: 'flex', justifyContent: 'center', padding: '14px 0 6px' }}>
                    <div style={{ width: 40, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.12)' }} />
                </div>

                {/* header */}
                <div style={{ padding: '10px 22px 18px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                        <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 4 }}>
                            Pedido #{order.$id?.slice(-6).toUpperCase()}
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                            {order.customer_name || 'Cliente'}
                        </div>
                        <div style={{ marginTop: 6 }}>
                            <StatusPill status={order.status} />
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, color: '#888', cursor: 'pointer', display: 'flex' }}>
                        <X size={18} />
                    </button>
                </div>

                <div className="custom-scroll" style={{ overflowY: 'auto', flex: 1 }}>
                    <OrderDetailsContent
                        order={order}
                        onStatusChange={(id, s) => { onStatusChange(id, s); onClose(); }}
                    />
                </div>
            </motion.div>
        </>
    );
};

/* ─── Main Component ──────────────────────────────────────── */
const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const { showAlert } = useAlert();

    useEffect(() => {
        loadData();
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getOrders();
            setOrders(data.documents || []);
        } catch { showAlert('Erro ao carregar pedidos', 'error'); }
        finally { setLoading(false); }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.$id === orderId ? { ...o, status: newStatus } : o));
            showAlert('Status atualizado!', 'success', null, 3000);
        } catch { showAlert('Erro ao atualizar status', 'error'); }
    };

    const filtered = orders.filter(o => {
        const matchStatus = filter === 'all' || o.status === filter;
        const matchSearch = !search ||
            (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (o.$id || '').includes(search);
        return matchStatus && matchSearch;
    });

    const counts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        completed: orders.filter(o => o.status === 'completed').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    return (
        <div className="admin-page-wrapper" style={{ padding: '0 10px 80px' }}>

            {/* ── Search bar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '0 2px' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '0 12px' }}>
                    <Search size={15} color="#555" />
                    <input
                        placeholder="Buscar cliente ou ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: 'none', border: 'none', color: '#fff', padding: '11px 4px', width: '100%', outline: 'none', fontSize: '0.88rem' }}
                    />
                </div>
                <button onClick={loadData} disabled={loading} title="Recarregar" style={{ flexShrink: 0, width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                </button>
            </div>

            {/* ── Filter chips ── */}
            <div className="custom-scroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 18, paddingBottom: 4, paddingLeft: 2 }}>
                {[
                    { key: 'all',        label: 'Todos' },
                    { key: 'pending',    label: 'Pendentes' },
                    { key: 'processing', label: 'Processando' },
                    { key: 'completed',  label: 'Concluídos' },
                    { key: 'cancelled',  label: 'Cancelados' },
                ].map(({ key, label }) => {
                    const active = filter === key;
                    const m = STATUS_META[key];
                    return (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            style={{
                                flexShrink: 0, padding: '6px 14px', borderRadius: 999,
                                fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                                letterSpacing: '0.3px', whiteSpace: 'nowrap',
                                border: active
                                    ? `1px solid ${m ? m.border : 'rgba(255,255,255,0.3)'}`
                                    : '1px solid rgba(255,255,255,0.06)',
                                background: active
                                    ? (m ? m.bg : 'rgba(255,255,255,0.08)')
                                    : 'rgba(255,255,255,0.03)',
                                color: active ? (m ? m.color : '#fff') : '#555',
                                transition: 'all 0.2s',
                            }}
                        >
                            {label}
                            {counts[key] > 0 && (
                                <span style={{ marginLeft: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 99, padding: '1px 6px', fontSize: '0.6rem' }}>
                                    {counts[key]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Order list ── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <Loader2 size={32} color="#D4AF37" className="animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#444', fontSize: '0.88rem', fontWeight: 600 }}>
                    Nenhum pedido encontrado.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {filtered.map(order => {
                        const items = parseItems(order.items);
                        const m = STATUS_META[order.status] || STATUS_META.pending;
                        const isExpanded = expandedOrderId === order.$id;

                        return (
                            <div key={order.$id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <motion.div
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        if (isMobile) {
                                            setSelectedOrder(order);
                                        } else {
                                            setExpandedOrderId(isExpanded ? null : order.$id);
                                        }
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 13,
                                        padding: '13px 14px',
                                        background: 'rgba(20,20,20,0.5)',
                                        border: `1px solid ${isExpanded ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                        borderLeft: `3px solid ${m.color}`,
                                        borderRadius: 14,
                                        cursor: 'pointer',
                                        backdropFilter: 'blur(10px)',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {/* icon */}
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, border: `1px solid ${m.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Package size={16} color={m.color} />
                                    </div>

                                    {/* info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {order.customer_name || 'Cliente'}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                                            <span style={{ fontSize: '0.62rem', color: '#444', fontWeight: 700 }}>{fmtDate(order.$createdAt)}</span>
                                            <span style={{ fontSize: '0.62rem', color: '#333' }}>·</span>
                                            <span style={{ fontSize: '0.62rem', color: '#555', fontWeight: 700 }}>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
                                        </div>
                                    </div>

                                    {/* right */}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                                        <span style={{ fontWeight: 900, color: '#fff', fontSize: '0.88rem' }}>
                                            {fmtCurrency(order.total)}
                                        </span>
                                        <StatusPill status={order.status} small />
                                    </div>

                                    <div style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: '0.3s' }}>
                                        <ChevronRight size={16} color="#333" style={{ flexShrink: 0 }} />
                                    </div>
                                </motion.div>

                                <AnimatePresence>
                                    {isExpanded && !isMobile && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            style={{
                                                overflow: 'hidden',
                                                background: 'rgba(255,255,255,0.02)',
                                                borderRadius: '0 0 14px 14px',
                                                border: '1px solid rgba(255,255,255,0.03)',
                                                borderTop: 'none',
                                                marginTop: -8,
                                                paddingTop: 8
                                            }}
                                        >
                                            <OrderDetailsContent
                                                order={order}
                                                onStatusChange={handleStatusChange}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Bottom Sheet Detail (MOBILE ONLY) ── */}
            <AnimatePresence>
                {selectedOrder && isMobile && (
                    <OrderDetailSheet
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        onStatusChange={handleStatusChange}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOrders;
