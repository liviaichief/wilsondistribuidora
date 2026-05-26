/**
 * orderMessageBuilder — Construção da mensagem de pedido para WhatsApp
 *
 * Função pura que recebe os dados do pedido e retorna a string
 * formatada para envio via WhatsApp. Separada do CartSidebar para
 * facilitar testes unitários e reutilização.
 */

const BRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

/**
 * Constrói a mensagem completa do pedido
 *
 * @param {Object} params
 * @param {string}  params.orderNumber     - Número do pedido (ex: WD0042)
 * @param {Array}   params.items           - Itens do carrinho [{title, quantity, price, isBox, boxPrice}]
 * @param {Object}  params.customer        - { name, phone }
 * @param {Object}  params.delivery        - { mode, address, fee, distance }
 * @param {string}  params.paymentMethod   - Forma de pagamento selecionada
 * @param {number}  params.total           - Total do pedido
 * @param {number}  params.cashbackUsed    - Valor de cashback aplicado (0 se não usar)
 * @param {string}  params.storeName       - Nome do estabelecimento (para template)
 * @returns {string} Mensagem formatada
 */
export function buildOrderMessage({
  orderNumber,
  items = [],
  customer,
  delivery,
  paymentMethod = 'A combinar',
  total,
  cashbackUsed = 0,
  storeName = 'BASE APP',
  notes = '',
}) {
  const lines = [];

  // Cabeçalho
  lines.push(`*NOVO PEDIDO #${orderNumber} - ${storeName.toUpperCase()}*\n`);

  // Itens
  const isKit = (item) => (item.category || '').toLowerCase().includes('kit');
  lines.push('*Itens do Pedido:*');
  items.forEach(item => {
    const unitPrice = item.isBox ? (item.boxPrice ?? item.price) : item.price;
    const label     = item.isBox ? `${item.title} (Caixa)` : item.title;
    lines.push(`• ${item.quantity}x ${label} — ${BRL(unitPrice * item.quantity)}`);
    if (isKit(item) && item.description) {
      lines.push(`  _↳ ${item.description.trim()}_`);
    }
  });

  lines.push('');

  // Cliente
  lines.push(`*Cliente:* ${customer.name}`);
  lines.push(`*WhatsApp:* ${customer.phone}`);
  lines.push('');

  // Entrega
  lines.push('*Entrega/Retirada:*');
  if (delivery.mode === 'delivery') {
    lines.push('🛵 Modalidade: Entrega');
    const addr = delivery.address;
    if (addr) {
      lines.push(`*Endereço:* ${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}`);
      lines.push(`Bairro: ${addr.neighborhood}`);
      lines.push(`CEP: ${addr.cep} — ${addr.city}/${addr.state}`);
    }
    if (delivery.distance != null) {
      lines.push(`Distância: ${delivery.distance.toFixed(1)} km`);
    }
    lines.push(`Frete: ${delivery.fee > 0 ? BRL(delivery.fee) : '🆓 GRÁTIS'}`);
  } else {
    lines.push('🏪 Modalidade: Retirada no Local');
  }

  lines.push('');

  // Pagamento
  lines.push(`*Pagamento:* ${paymentMethod}`);

  // Cashback
  if (cashbackUsed > 0) {
    lines.push(`*Cashback Aplicado:* -${BRL(cashbackUsed)}`);
  }

  lines.push('');
  lines.push(`*TOTAL: ${BRL(total)}*`);

  if (notes?.trim()) {
    lines.push('');
    lines.push(`*Observações:* ${notes.trim()}`);
  }

  return lines.join('\n');
}
