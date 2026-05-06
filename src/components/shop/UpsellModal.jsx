import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, X, ArrowRight, Sparkles, TrendingUp, ShoppingBag, Trash2 } from 'lucide-react';
import { getImageUrl } from '../../lib/imageUtils';

const UpsellModal = ({ isOpen, onClose, baseProduct, recommendations, onAdd, onUpdateQuantity, cartItems }) => {
    if (!baseProduct || !isOpen) return null;

    const getQty = (id) => {
        const item = cartItems?.find(i => i.id === id);
        return item ? item.quantity : 0;
    };

    return (
        <AnimatePresence>
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
                />

                {/* Modal Content */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{ 
                            position: 'relative', 
                            width: '100%', 
                            maxWidth: '480px', 
                            maxHeight: '90vh',
                            background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.95), rgba(15, 15, 15, 0.98))', 
                            borderRadius: '35px', 
                            border: '1px solid rgba(212, 175, 55, 0.3)',
                            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), 0 0 30px rgba(212, 175, 55, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Category Badge */}
                        <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#D4AF37', color: '#000', padding: '8px 20px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900, zIndex: 10, boxShadow: '0 10px 20px rgba(212, 175, 55, 0.3)', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                            <TrendingUp size={12} /> {baseProduct.categoryName || 'Sugestão'}
                        </div>

                        <div style={{ padding: '40px 25px 20px', textAlign: 'center', flexShrink: 0 }}>
                        <button onClick={onClose} style={{ position: 'absolute', right: '25px', top: '25px', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', cursor: 'pointer', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={18} />
                        </button>
                        
                        <h2 style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>
                            Ótima escolha!
                        </h2>
                        <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: '1.5', margin: 0 }}>
                            Que tal aproveitar o frete e levar também estes itens que <strong>combinam perfeitamente</strong> com seu pedido?
                        </p>
                    </div>

                    {/* Recommendations List */}
                    <style>
                        {`
                            .upsell-scroll-area::-webkit-scrollbar {
                                width: 5px;
                            }
                            .upsell-scroll-area::-webkit-scrollbar-track {
                                background: rgba(0,0,0,0.1);
                                border-radius: 10px;
                            }
                            .upsell-scroll-area::-webkit-scrollbar-thumb {
                                background: rgba(212, 175, 55, 0.4);
                                border-radius: 10px;
                            }
                        `}
                    </style>
                    <div 
                        className="upsell-scroll-area"
                        style={{ 
                            padding: '0 25px 25px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '12px',
                            flex: 1,
                            overflowY: 'auto',
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(212, 175, 55, 0.4) rgba(0,0,0,0.1)'
                        }}
                    >
                        {recommendations.slice(0, 3).map((item, index) => {
                            const qty = getQty(item.id);
                            const isAdded = qty > 0;

                            return (
                                <motion.div 
                                    key={item.id || index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '10px', 
                                        padding: '10px', 
                                        background: isAdded ? 'rgba(212, 175, 55, 0.05)' : 'rgba(255,255,255,0.02)', 
                                        borderRadius: '20px',
                                        border: isAdded ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        transition: '0.3s',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div style={{ width: '70px', height: '70px', borderRadius: '15px', overflow: 'hidden', background: '#000', flexShrink: 0, border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <img 
                                            src={getImageUrl(item.image)} 
                                            alt={item.title} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isAdded ? 0.7 : 1 }}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Wilson'; }}
                                        />
                                    </div>
                                    
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h4 style={{ color: isAdded ? '#D4AF37' : '#fff', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 6px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {item.title}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: isAdded ? '#D4AF37' : '#D4AF37', fontWeight: 900, fontSize: '1rem' }}>
                                                R$ {item.price?.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.3)', borderRadius: '15px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {!isAdded ? (
                                            <button 
                                                onClick={() => onAdd(item)}
                                                style={{ 
                                                    background: '#D4AF37', 
                                                    color: '#000', 
                                                    border: 'none', 
                                                    padding: '8px 12px', 
                                                    borderRadius: '12px', 
                                                    fontSize: '0.65rem', 
                                                    fontWeight: 900, 
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                <Plus size={14} /> ADICIONAR
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 4px' }}>
                                                <button 
                                                    onClick={() => onUpdateQuantity(item.id, qty - 1)}
                                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    {qty === 1 ? <Trash2 size={14} color="#ef4444" /> : <Minus size={14} />}
                                                </button>
                                                
                                                <span style={{ color: '#fff', fontWeight: 900, fontSize: '0.9rem', minWidth: '15px', textAlign: 'center' }}>
                                                    {qty}
                                                </span>

                                                <button 
                                                    onClick={() => onUpdateQuantity(item.id, qty + 1)}
                                                    style={{ background: '#D4AF37', border: 'none', color: '#000', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '20px 25px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', flexShrink: 0 }}>
                        <button 
                            onClick={onClose}
                            style={{ 
                                flex: 1,
                                background: '#22c55e', 
                                border: 'none', 
                                color: '#fff', 
                                padding: '18px', 
                                borderRadius: '22px', 
                                fontSize: '1rem', 
                                fontWeight: 900, 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                transition: '0.3s',
                                boxShadow: '0 10px 20px rgba(34, 197, 94, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 15px 30px rgba(34, 197, 94, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 20px rgba(34, 197, 94, 0.2)';
                            }}
                        >
                            <ShoppingBag size={20} /> IR PARA O CARRINHO <ArrowRight size={18} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default UpsellModal;
