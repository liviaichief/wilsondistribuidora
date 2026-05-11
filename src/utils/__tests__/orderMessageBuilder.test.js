import { describe, it, expect } from 'vitest';
import { buildOrderMessage } from '../orderMessageBuilder';

const baseParams = {
  orderNumber: 'WD0001',
  items: [
    { title: 'Picanha Premium', quantity: 2, price: 120, isBox: false },
    { title: 'Costela',         quantity: 1, price: 80,  isBox: false },
  ],
  customer: { name: 'João Silva', phone: '11999998888' },
  delivery: {
    mode: 'delivery',
    fee: 8,
    distance: 3.5,
    address: {
      street: 'Rua das Flores', number: '123', neighborhood: 'Centro',
      city: 'São Paulo', state: 'SP', cep: '01310-100', complement: '',
    },
  },
  paymentMethod: 'PIX',
  total: 328,
  cashbackUsed: 0,
  storeName: 'Wilson Distribuidora',
};

describe('buildOrderMessage()', () => {
  it('includes order number in header', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).toContain('WD0001');
  });

  it('includes store name in header', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).toContain('WILSON DISTRIBUIDORA');
  });

  it('lists all items', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).toContain('Picanha Premium');
    expect(msg).toContain('Costela');
  });

  it('shows customer name and phone', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).toContain('João Silva');
    expect(msg).toContain('11999998888');
  });

  it('shows delivery address when mode is delivery', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).toContain('Rua das Flores');
    expect(msg).toContain('123');
    expect(msg).toContain('Centro');
    expect(msg).toContain('São Paulo');
  });

  it('shows distance when provided', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).toContain('3.5 km');
  });

  it('shows shipping fee when > 0', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).toContain('R$ 8,00');
  });

  it('shows GRÁTIS when fee is 0', () => {
    const msg = buildOrderMessage({ ...baseParams, delivery: { ...baseParams.delivery, fee: 0 } });
    expect(msg).toContain('GRÁTIS');
  });

  it('shows "Retirada no Local" for pickup mode', () => {
    const msg = buildOrderMessage({
      ...baseParams,
      delivery: { mode: 'pickup', fee: 0 },
    });
    expect(msg).toContain('Retirada no Local');
    expect(msg).not.toContain('Rua das Flores');
  });

  it('shows payment method', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).toContain('PIX');
  });

  it('shows total', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).toContain('328');
  });

  it('shows cashback when > 0', () => {
    const msg = buildOrderMessage({ ...baseParams, cashbackUsed: 10 });
    expect(msg).toContain('Cashback');
  });

  it('does NOT show cashback line when cashbackUsed is 0', () => {
    const msg = buildOrderMessage(baseParams);
    expect(msg).not.toContain('Cashback');
  });

  it('handles box items with boxPrice', () => {
    const boxParams = {
      ...baseParams,
      items: [{ title: 'Frango', quantity: 1, price: 30, isBox: true, boxPrice: 250 }],
    };
    const msg = buildOrderMessage(boxParams);
    expect(msg).toContain('Frango (Caixa)');
  });

  it('works with default storeName', () => {
    const { storeName: _, ...withoutStore } = baseParams;
    const msg = buildOrderMessage(withoutStore);
    expect(msg).toContain('BASE APP');
  });

  it('handles address complement', () => {
    const params = {
      ...baseParams,
      delivery: {
        ...baseParams.delivery,
        address: { ...baseParams.delivery.address, complement: 'Apto 42' },
      },
    };
    const msg = buildOrderMessage(params);
    expect(msg).toContain('Apto 42');
  });
});
