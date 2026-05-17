import { formatTitleCase } from './utils';

/**
 * Gera a mensagem formatada para o WhatsApp
 * @param {Object} orderData - Dados do pedido (itens, cliente, entrega, etc)
 * @param {string} whatsappMessageTemplate - Template da mensagem vindo das configurações
 * @returns {string} - Mensagem final para o WhatsApp
 */
export const generateWhatsAppMessage = (orderData, whatsappMessageTemplate = '*NOVO PEDIDO {pedido} - BASE APP*') => {
    const { 
        customer_name, 
        customer_phone, 
        items, 
        delivery_mode, 
        delivery_address, 
        total, 
        delivery_fee, 
        order_number 
    } = orderData;

    const isKit = (item) => (item.category || '').toLowerCase().includes('kit');
    const itemsList = items.map(item => {
        const linha = `• ${item.quantity}x ${formatTitleCase(item.title)}${item.external_code ? ` [Ref: ${item.external_code}]` : ''} - R$ ${(item.price * item.quantity).toFixed(2)}`;
        const descricao = isKit(item) && item.description ? `  _↳ ${item.description.trim()}_` : '';
        return descricao ? `${linha}\n${descricao}` : linha;
    }).join('\n');

    let addressText = '';
    if (delivery_mode === 'pickup') {
        addressText = '🛵 Opção: Retirar na Loja';
    } else if (delivery_address) {
        addressText = `🛵 Opção: Entrega\n` +
            `*Endereço:*\n` +
            `${delivery_address.street}, ${delivery_address.number} ${delivery_address.complement ? `- ${delivery_address.complement}` : ''}\n` +
            `Bairro: ${delivery_address.neighborhood}\n` +
            `CEP: ${delivery_address.cep} - ${delivery_address.city}/${delivery_address.state}`;
    }

    let headerText = whatsappMessageTemplate || '*NOVO PEDIDO - BASE APP*';
    const displayNum = order_number ? `#${order_number}` : 'NOVO';
    
    if (headerText.includes('{pedido}')) {
        headerText = headerText.replace('{pedido}', displayNum);
    } else {
        headerText = `${headerText} ${displayNum}`;
    }

    return `${headerText}\n\n` +
        `*Itens do Pedido:*\n${itemsList}\n\n` +
        `Nome: ${customer_name}\n` +
        `WhatsApp: ${customer_phone}\n\n` +
        `*Entrega/Retirada:*\n${addressText}\n` +
        (delivery_mode === 'delivery' ? `Frete: R$ ${delivery_fee.toFixed(2)}\n` : '') +
        `*TOTAL: R$ ${total.toFixed(2)}*`;
};
