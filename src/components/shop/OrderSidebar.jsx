import React from 'react';
import { useOrder } from '../../context/OrderContext';
import { X, ShoppingBag, Clock, CheckCircle } from 'lucide-react';
import './CartSidebar.css'; // Reusing CartSidebar styles for consistency

const OrderSidebar = () => {
    const { orders, isOrderSidebarOpen, toggleOrderSidebar } = useOrder();

    if (!isOrderSidebarOpen) return null;

    return (
        <>
            <div className="cart-backdrop" onClick={toggleOrderSidebar}></div>
            <div className={`cart-sidebar ${isOrderSidebarOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h2><ShoppingBag size={20} /> Meus Pedidos</h2>
                    <button className="close-cart" onClick={toggleOrderSidebar}>
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-items" style={{ paddingBottom: '20px' }}>
                    {orders.length === 0 ? (
                        <div className="empty-cart">
                            <ShoppingBag size={48} opacity={0.3} />
                            <p>Você ainda não fez nenhum pedido.</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px', background: '#1e1e1e', border: '1px solid #333', padding: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px' }}>
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>#{order.id.toString().padStart(4, '0')}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#888', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Clock size={12} /> {new Date(order.created_at).toLocaleString()}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '5px' }}>
                                    {order.items.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#ccc' }}>
                                            <span>{item.quantity}x {item.title}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderTop: '1px solid #333', paddingTop: '10px', marginTop: '5px' }}>
                                    <span style={{ fontSize: '0.9rem' }}>Total:</span>
                                    <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>R$ {parseFloat(order.total).toFixed(2)}</span>
                                </div>

                                <div style={{ marginTop: '5px', fontSize: '0.8rem', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <CheckCircle size={12} /> Enviado via WhatsApp
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default OrderSidebar;


