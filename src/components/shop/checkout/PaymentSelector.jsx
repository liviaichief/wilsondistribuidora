/**
 * PaymentSelector — Seleção de forma de pagamento (CRO-9)
 *
 * Substitui o campo "A combinar" estático por uma seleção real,
 * o que reduz cancelamentos por expectativa diferente entre
 * cliente e loja.
 */

import { CreditCard, Banknote, QrCode, HelpCircle } from 'lucide-react';

const PAYMENT_OPTIONS = [
  { value: 'PIX',              label: 'PIX',                    icon: <QrCode size={18} /> },
  { value: 'Dinheiro',         label: 'Dinheiro',               icon: <Banknote size={18} /> },
  { value: 'Cartão na entrega', label: 'Cartão na entrega',     icon: <CreditCard size={18} /> },
  { value: 'A combinar',       label: 'A combinar com a loja',  icon: <HelpCircle size={18} /> },
];

export function PaymentSelector({ value, onChange, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{ fontWeight: 800, fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Forma de Pagamento
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {PAYMENT_OPTIONS.map(opt => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 14px',
                borderRadius: '12px',
                border: `1.5px solid ${selected ? 'var(--color-accent, #D4AF37)' : 'rgba(255,255,255,0.08)'}`,
                background: selected ? 'rgba(212,175,55,0.1)' : 'rgba(0,0,0,0.2)',
                color: selected ? 'var(--color-accent, #D4AF37)' : '#888',
                fontWeight: selected ? 800 : 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
              }}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
      {error && (
        <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600 }}>{error}</span>
      )}
    </div>
  );
}
