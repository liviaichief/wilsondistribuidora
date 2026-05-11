/**
 * OrderConfirmation — Tela de confirmação após pedido criado (CRO-2)
 *
 * Exibida ANTES do redirect para WhatsApp, dando ao cliente
 * a certeza de que o pedido foi registrado, independente do WhatsApp.
 * Reduz confusão quando o popup de WhatsApp é bloqueado ou fechado.
 */

import { motion } from 'framer-motion';
import { CheckCircle, MessageCircle, Package } from 'lucide-react';

const BRL = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

/**
 * @param {Object}   props
 * @param {string}   props.orderNumber    - Número do pedido (ex: WD0042)
 * @param {Array}    props.items          - Itens do carrinho
 * @param {number}   props.total          - Total do pedido
 * @param {string}   props.paymentMethod  - Forma de pagamento selecionada
 * @param {Function} props.onConfirmWhatsApp - Callback ao clicar em "Confirmar no WhatsApp"
 * @param {Function} props.onClose        - Callback para fechar sem ir ao WhatsApp
 */
export function OrderConfirmation({ orderNumber, items = [], total, paymentMethod, onConfirmWhatsApp, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
        padding: '32px 20px',
        textAlign: 'center',
      }}
    >
      {/* Ícone de sucesso */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
      >
        <CheckCircle size={64} color="#22c55e" strokeWidth={1.5} />
      </motion.div>

      {/* Título */}
      <div>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
          Pedido #{orderNumber} Registrado!
        </h2>
        <p style={{ margin: '8px 0 0', color: '#888', fontSize: '0.9rem' }}>
          Seu pedido foi salvo com sucesso. Agora confirme pelo WhatsApp para iniciarmos o preparo.
        </p>
      </div>

      {/* Resumo rápido */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '16px',
        padding: '16px 20px',
        width: '100%',
        border: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#888' }}>
          <Package size={16} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
        </div>
        {items.slice(0, 3).map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#ccc', marginBottom: '4px' }}>
            <span>{item.quantity}x {item.title}</span>
            <span>{BRL((item.isBox ? item.boxPrice : item.price) * item.quantity)}</span>
          </div>
        ))}
        {items.length > 3 && (
          <p style={{ fontSize: '0.75rem', color: '#555', marginTop: '4px' }}>
            +{items.length - 3} item(s)...
          </p>
        )}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '12px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 900, color: '#fff' }}>Total</span>
          <span style={{ fontWeight: 900, color: 'var(--color-accent, #D4AF37)', fontSize: '1.1rem' }}>{BRL(total)}</span>
        </div>
        {paymentMethod && (
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '8px', marginBottom: 0 }}>
            Pagamento: {paymentMethod}
          </p>
        )}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <button
          onClick={onConfirmWhatsApp}
          style={{
            background: '#25D366',
            color: '#fff',
            border: 'none',
            borderRadius: '14px',
            padding: '16px',
            fontWeight: 900,
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <MessageCircle size={20} />
          Confirmar no WhatsApp
        </button>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            color: '#555',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            padding: '12px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Fechar — já confirmei
        </button>
      </div>
    </motion.div>
  );
}
