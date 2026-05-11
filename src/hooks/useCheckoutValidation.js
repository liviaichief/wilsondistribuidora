/**
 * useCheckoutValidation — Validação de campos do checkout
 *
 * Valida os campos do formulário de checkout campo a campo (onBlur).
 * Retorna erros por campo e um flag global isValid.
 *
 * Uso:
 *   const { errors, validateField, validateAll, isValid } = useCheckoutValidation();
 */

import { useState } from 'react';

const PHONE_REGEX  = /^\(?[1-9]{2}\)?\s?[0-9]{4,5}-?[0-9]{4}$/;
const CEP_REGEX    = /^\d{5}-?\d{3}$/;

// Regras de validação por campo
const RULES = {
  customerName:    v => (!v?.trim() ? 'Nome é obrigatório' : v.trim().length < 3 ? 'Nome muito curto' : null),
  customerPhone:   v => (!v?.trim() ? 'WhatsApp é obrigatório' : !PHONE_REGEX.test(v.replace(/\D/g, '').replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')) && v.replace(/\D/g, '').length < 10 ? 'WhatsApp inválido (precisa de DDD)' : null),
  deliveryMode:    v => (!v ? 'Escolha retirada ou entrega' : null),
  cep:             v => (!v?.trim() ? 'CEP é obrigatório' : !CEP_REGEX.test(v.trim()) ? 'CEP inválido' : null),
  street:          v => (!v?.trim() ? 'Rua é obrigatória' : null),
  number:          v => (!v?.trim() ? 'Número é obrigatório' : null),
  neighborhood:    v => (!v?.trim() ? 'Bairro é obrigatório' : null),
  city:            v => (!v?.trim() ? 'Cidade é obrigatória' : null),
  paymentMethod:   v => (!v ? 'Selecione uma forma de pagamento' : null),
};

export function useCheckoutValidation() {
  const [errors, setErrors] = useState({});

  /**
   * Valida um campo específico e armazena o erro (ou limpa)
   * @param {string} field - Nome do campo (chave em RULES)
   * @param {*} value - Valor atual do campo
   */
  const validateField = (field, value) => {
    const rule = RULES[field];
    if (!rule) return;
    const error = rule(value);
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  /**
   * Valida todos os campos de uma vez e retorna se o formulário é válido
   * @param {Object} values - Objeto com todos os valores do formulário
   * @param {boolean} isDelivery - Se o modo é entrega (exige campos de endereço)
   */
  const validateAll = (values, isDelivery) => {
    const baseFields  = ['customerName', 'customerPhone', 'deliveryMode', 'paymentMethod'];
    const addrFields  = ['cep', 'street', 'number', 'neighborhood', 'city'];
    const fieldsToCheck = isDelivery ? [...baseFields, ...addrFields] : baseFields;

    const newErrors = {};
    fieldsToCheck.forEach(field => {
      const value = field in values ? values[field] : values.address?.[field];
      const rule  = RULES[field];
      if (rule) newErrors[field] = rule(value);
    });

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  /** Limpa todos os erros */
  const clearErrors = () => setErrors({});

  const isValid = !Object.values(errors).some(Boolean);

  return { errors, validateField, validateAll, clearErrors, isValid };
}
