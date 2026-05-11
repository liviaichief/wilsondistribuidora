/**
 * Factories de dados de teste
 *
 * Funções que criam objetos mockados consistentes para uso nos testes.
 * Aceita overrides parciais para customizar casos específicos.
 *
 * Uso:
 *   const product = createMockProduct({ price: 50, is_promotion: true, promo_price: 35 });
 */

export function createMockProduct(overrides = {}) {
  return {
    $id:                  'product-1',
    id:                   'product-1',
    sku:                  'WD0100',
    title:                'Picanha Premium',
    description:          'Corte nobre com excelente marmoreio.',
    price:                120.00,
    category:             '1',
    category_name:        'Bovinos',
    image:                'file-123',
    uom:                  'KG',
    is_promotion:         false,
    promo_price:          null,
    active:               true,
    manage_stock:         false,
    stock_quantity:       0,
    allow_backorder:      false,
    disable_on_zero_stock: false,
    has_box_option:       false,
    box_price:            null,
    has_bundle_option:    false,
    unit_price:           null,
    has_assorted_min:     false,
    assorted_min_qty:     null,
    brand:                null,
    external_code:        null,
    $createdAt:           '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createMockOrder(overrides = {}) {
  return {
    $id:              'WD0001',
    order_number:     'WD0001',
    customer_name:    'João Silva',
    customer_phone:   '11999998888',
    payment_method:   'PIX',
    total:            240.00,
    status:           'pending',
    delivery_mode:    'delivery',
    delivery_address: JSON.stringify({
      street: 'Rua das Flores', number: '123', neighborhood: 'Centro',
      city: 'São Paulo', state: 'SP', cep: '01310100',
    }),
    items: JSON.stringify([
      { id: 'product-1', title: 'Picanha Premium', quantity: 2, price: 120 },
    ]),
    user_id:    'user-1',
    $createdAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

export function createMockUser(overrides = {}) {
  return {
    $id:       'user-1',
    id:        'user-1',
    email:     'joao@exemplo.com',
    full_name: 'João Silva',
    labels:    [],
    ...overrides,
  };
}

export function createMockSettings(overrides = {}) {
  return {
    whatsapp_number:           '5511999998888',
    shipping_free_radius:      5,
    shipping_fixed_rate:       8,
    shipping_fixed_radius_max: 15,
    shipping_per_km_rate:      2,
    store_latitude:            '-23.5505',
    store_longitude:           '-46.6333',
    cashback_enabled:          false,
    cashback_percentage:       2,
    active_plan:               'basic',
    ...overrides,
  };
}

export function createMockCartItem(overrides = {}) {
  return {
    id:       'product-1',
    title:    'Picanha Premium',
    price:    120.00,
    quantity: 1,
    image:    'file-123',
    uom:      'KG',
    isBox:    false,
    ...overrides,
  };
}
