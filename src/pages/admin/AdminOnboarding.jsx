/**
 * AdminOnboarding — Questionário de Configuração para Novos Clientes
 *
 * Guia o proprietário por 6 seções de perguntas para configurar
 * 100% do produto com a identidade visual e dados do seu negócio.
 *
 * Ao final, o operador envia as respostas para o agente de IA que
 * aplica todas as configurações automaticamente.
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, Copy, Download } from 'lucide-react';

const SECTIONS = [
  {
    id:    'identity',
    title: '1. Identidade Visual',
    icon:  '🎨',
    description: 'Como seu estabelecimento deve se apresentar visualmente.',
    questions: [
      { id: 'store_name',        label: 'Nome do estabelecimento',                              type: 'text',   placeholder: 'Ex: Açougue do João', required: true },
      { id: 'store_tagline',     label: 'Slogan ou frase de impacto',                           type: 'text',   placeholder: 'Ex: Qualidade em carnes premium' },
      { id: 'color_primary',     label: 'Cor primária (cor de destaque principal)',              type: 'color',  defaultValue: '#800020' },
      { id: 'color_accent',      label: 'Cor secundária (detalhes e botões)',                   type: 'color',  defaultValue: '#D4AF37' },
      { id: 'logo_description',  label: 'Descreva seu logo (para upload posterior)',             type: 'textarea', placeholder: 'Ex: Boi vermelho sobre fundo escuro, fonte serifada' },
      { id: 'visual_style',      label: 'Estilo visual preferido',                              type: 'select', options: ['Premium/Luxo (escuro com dourado)', 'Rústico/Tradicional (tons terrosos)', 'Moderno/Clean (branco e minimalista)', 'Colorido/Jovem'] },
    ],
  },
  {
    id:    'business',
    title: '2. Dados do Negócio',
    icon:  '🏪',
    description: 'Informações operacionais do estabelecimento.',
    questions: [
      { id: 'address_street',    label: 'Endereço (Rua, número)',                              type: 'text',   placeholder: 'Rua das Carnes, 100',      required: true },
      { id: 'address_city',      label: 'Cidade / Estado',                                     type: 'text',   placeholder: 'São Paulo / SP',            required: true },
      { id: 'address_cep',       label: 'CEP',                                                 type: 'text',   placeholder: '00000-000',                 required: true },
      { id: 'whatsapp',          label: 'WhatsApp principal (com DDD)',                         type: 'text',   placeholder: '11999998888',               required: true },
      { id: 'instagram',         label: 'Instagram (@)',                                        type: 'text',   placeholder: '@acouguedojoao' },
      { id: 'hours_weekdays',    label: 'Horário — dias de semana',                             type: 'text',   placeholder: 'Segunda a Sexta: 8h às 18h' },
      { id: 'hours_saturday',    label: 'Horário — sábados',                                   type: 'text',   placeholder: 'Sábados: 8h às 14h' },
      { id: 'hours_sunday',      label: 'Horário — domingos',                                  type: 'text',   placeholder: 'Fechado / 9h às 13h' },
    ],
  },
  {
    id:    'catalog',
    title: '3. Catálogo Inicial',
    icon:  '🥩',
    description: 'Como seu catálogo de produtos deve ser organizado.',
    questions: [
      { id: 'main_categories',   label: 'Categorias de produtos (separe por vírgula)',          type: 'textarea', placeholder: 'Ex: Bovinos, Suínos, Aves, Embutidos, Frutos do Mar', required: true },
      { id: 'uom_types',         label: 'Unidades de medida usadas',                           type: 'text',   placeholder: 'Ex: KG, Unidade, Bandeja, Pacote, Caixa' },
      { id: 'highlight_product', label: 'Produto mais vendido / carro-chefe',                  type: 'text',   placeholder: 'Ex: Picanha maturada' },
      { id: 'price_range',       label: 'Faixa de preço média dos produtos',                   type: 'select', options: ['Até R$30/kg (popular)', 'R$30-80/kg (intermediário)', 'R$80-150/kg (premium)', 'Acima de R$150/kg (boutique)'] },
      { id: 'has_promotions',    label: 'Trabalha com promoções semanais?',                    type: 'select', options: ['Sim, toda semana', 'Às vezes', 'Raramente', 'Não trabalho com promoções'] },
      { id: 'has_bundles',       label: 'Vende kits/combos (ex: kit churrasco)?',              type: 'select', options: ['Sim, é um diferencial', 'Tenho interesse em criar', 'Não por enquanto'] },
      { id: 'brands_used',       label: 'Marcas/fornecedores que quer destacar',               type: 'textarea', placeholder: 'Ex: JBS, Marfrig, fornecedor local XYZ' },
    ],
  },
  {
    id:    'delivery',
    title: '4. Entrega e Retirada',
    icon:  '🛵',
    description: 'Configuração das opções de entrega.',
    questions: [
      { id: 'delivery_modes',    label: 'Modalidades oferecidas',                              type: 'multicheck', options: ['Entrega a domicílio', 'Retirada na loja', 'Ambas'] },
      { id: 'free_radius_km',    label: 'Raio de entrega grátis (km)',                         type: 'number', placeholder: 'Ex: 5', defaultValue: '5' },
      { id: 'fixed_rate',        label: 'Taxa de entrega fixa (R$)',                           type: 'number', placeholder: 'Ex: 8', defaultValue: '8' },
      { id: 'fixed_radius_km',   label: 'Raio máximo para taxa fixa (km)',                     type: 'number', placeholder: 'Ex: 15', defaultValue: '15' },
      { id: 'per_km_rate',       label: 'Taxa por km além do raio fixo (R$/km)',               type: 'number', placeholder: 'Ex: 2', defaultValue: '2' },
      { id: 'store_coords',      label: 'Coordenadas GPS da loja (lat, lng)',                   type: 'text',   placeholder: 'Ex: -23.5505, -46.6333 (busque no Google Maps)' },
      { id: 'min_order',         label: 'Pedido mínimo para entrega (R$)',                     type: 'number', placeholder: 'Ex: 50 (ou deixe em branco para sem mínimo)' },
    ],
  },
  {
    id:    'plan',
    title: '5. Plano e Funcionalidades',
    icon:  '⭐',
    description: 'Qual plano foi contratado e quais funcionalidades ativar.',
    questions: [
      { id: 'contracted_plan',   label: 'Plano contratado',                                    type: 'select', options: ['Básico (R$200/mês)', 'Intermediário (R$300/mês)', 'Premium (R$400/mês)'], required: true },
      { id: 'cashback_enabled',  label: 'Ativar programa de cashback para clientes?',          type: 'select', options: ['Sim', 'Não'] },
      { id: 'cashback_pct',      label: 'Percentual de cashback (%)',                          type: 'number', placeholder: 'Ex: 2 (para 2%)' },
      { id: 'upsell_enabled',    label: 'Ativar sugestões de produtos no checkout?',           type: 'select', options: ['Sim', 'Não'] },
      { id: 'birthday_msg',      label: 'Enviar mensagem de aniversário via WhatsApp?',        type: 'select', options: ['Sim', 'Não'] },
      { id: 'stock_control',     label: 'Controlar estoque por produto?',                      type: 'select', options: ['Sim, para todos os produtos', 'Só para itens específicos', 'Não por enquanto'] },
    ],
  },
  {
    id:    'integrations',
    title: '6. Integrações e IA',
    icon:  '🔗',
    description: 'Chaves de API e integrações externas (Premium).',
    questions: [
      { id: 'has_google_api',    label: 'Tem chave da API do Google Maps?',                   type: 'select', options: ['Sim', 'Não', 'Preciso criar'] },
      { id: 'has_openai_key',    label: 'Tem chave da OpenAI (para recursos de IA)?',         type: 'select', options: ['Sim', 'Não', 'Preciso criar'] },
      { id: 'evolution_api',     label: 'Tem servidor Evolution API para WhatsApp?',           type: 'select', options: ['Sim', 'Não — usar link direto', 'Preciso criar'] },
      { id: 'bbq_ai_persona',    label: '(Premium) Nome do chat IA da loja',                  type: 'text',   placeholder: 'Ex: Mestre do Churrasco, Chef João...' },
      { id: 'seasonal_events',   label: '(Premium) Eventos sazonais para destacar',           type: 'multicheck', options: ['Natal/Réveillon', 'Carnaval', 'Dia dos Pais', 'Dia das Mães', 'Copa do Mundo', 'São João'] },
      { id: 'extra_notes',       label: 'Observações adicionais / informações especiais',     type: 'textarea', placeholder: 'Qualquer detalhe que queira comunicar sobre seu negócio...' },
    ],
  },
];

function QuestionField({ q, value, onChange }) {
  const baseStyle = {
    width: '100%', background: '#1e1e1e', border: '1px solid #333',
    borderRadius: '8px', color: '#fff', padding: '10px 12px',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
  };

  if (q.type === 'textarea') {
    return (
      <textarea
        value={value ?? ''}
        onChange={e => onChange(q.id, e.target.value)}
        placeholder={q.placeholder}
        rows={3}
        style={{ ...baseStyle, resize: 'vertical' }}
      />
    );
  }

  if (q.type === 'select') {
    return (
      <select value={value ?? ''} onChange={e => onChange(q.id, e.target.value)} style={baseStyle}>
        <option value="">— Selecione —</option>
        {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }

  if (q.type === 'color') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <input
          type="color"
          value={value ?? q.defaultValue ?? '#800020'}
          onChange={e => onChange(q.id, e.target.value)}
          style={{ width: '48px', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: 0 }}
        />
        <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{value ?? q.defaultValue ?? '#800020'}</span>
      </div>
    );
  }

  if (q.type === 'multicheck') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {q.options.map(opt => (
          <label key={opt} style={{
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
            background: selected.includes(opt) ? 'rgba(128,0,32,0.3)' : '#1e1e1e',
            border: `1px solid ${selected.includes(opt) ? '#800020' : '#333'}`,
            borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', color: '#ddd',
          }}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={e => {
                const next = e.target.checked ? [...selected, opt] : selected.filter(x => x !== opt);
                onChange(q.id, next);
              }}
              style={{ display: 'none' }}
            />
            {selected.includes(opt) ? '✓ ' : ''}{opt}
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      type={q.type === 'number' ? 'number' : 'text'}
      value={value ?? q.defaultValue ?? ''}
      onChange={e => onChange(q.id, e.target.value)}
      placeholder={q.placeholder}
      style={baseStyle}
    />
  );
}

export default function AdminOnboarding() {
  const [activeSection, setActiveSection] = useState(0);
  const [answers, setAnswers]             = useState({});
  const [completed, setCompleted]         = useState(false);
  const [copied, setCopied]               = useState(false);

  const updateAnswer = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }));

  const currentSection = SECTIONS[activeSection];
  const isLast         = activeSection === SECTIONS.length - 1;

  const answeredInSection = currentSection.questions.filter(q => {
    const v = answers[q.id];
    return v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
  }).length;

  // Gera o sumário formatado para copiar/enviar ao agente de IA
  const generateSummary = () => {
    const lines = ['# CONFIGURAÇÃO — NOVO CLIENTE\n'];
    SECTIONS.forEach(sec => {
      lines.push(`## ${sec.title}`);
      sec.questions.forEach(q => {
        const v = answers[q.id];
        if (v !== undefined && v !== '') {
          const display = Array.isArray(v) ? v.join(', ') : v;
          lines.push(`- **${q.label}:** ${display}`);
        }
      });
      lines.push('');
    });
    return lines.join('\n');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateSummary()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([generateSummary()], { type: 'text/markdown' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'onboarding-cliente.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (completed) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '8px' }}>Questionário Concluído!</h2>
          <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
            Suas respostas estão prontas. Copie o resumo abaixo e envie para o agente de IA configurar o sistema.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: copied ? '#166534' : '#800020', color: '#fff',
              border: 'none', borderRadius: '8px', padding: '10px 20px',
              cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
            }}
          >
            <Copy size={16} /> {copied ? 'Copiado!' : 'Copiar Resumo'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#1a1a1a', color: '#fff', border: '1px solid #333',
              borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.875rem',
            }}
          >
            <Download size={16} /> Baixar .md
          </button>
          <button
            onClick={() => { setCompleted(false); setActiveSection(0); }}
            style={{
              background: 'transparent', color: '#aaa', border: '1px solid #333',
              borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '0.875rem',
            }}
          >
            Editar Respostas
          </button>
        </div>

        <pre style={{
          background: '#111', border: '1px solid #222', borderRadius: '12px',
          padding: '20px', color: '#ccc', fontSize: '0.78rem', lineHeight: '1.7',
          overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto',
        }}>
          {generateSummary()}
        </pre>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '6px' }}>
          Configuração de Novo Cliente
        </h2>
        <p style={{ color: '#aaa', fontSize: '0.875rem' }}>
          Responda as perguntas abaixo para configurar o sistema com a identidade do seu negócio.
        </p>
      </div>

      {/* Progress bar + seções */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {SECTIONS.map((sec, i) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(i)}
            style={{
              flex: '1 1 auto', minWidth: '80px',
              padding: '8px 4px', borderRadius: '8px', border: 'none',
              background: i === activeSection ? '#800020' : i < activeSection ? '#166534' : '#1e1e1e',
              color: '#fff', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600,
            }}
          >
            {sec.icon} {sec.id === 'identity' ? 'Visual' : sec.id === 'business' ? 'Negócio' : sec.id === 'catalog' ? 'Catálogo' : sec.id === 'delivery' ? 'Entrega' : sec.id === 'plan' ? 'Plano' : 'Integr.'}
          </button>
        ))}
      </div>

      {/* Seção atual */}
      <div style={{ background: '#111', border: '1px solid #222', borderRadius: '16px', padding: '28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '1.8rem' }}>{currentSection.icon}</span>
          <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>{currentSection.title}</h3>
        </div>
        <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '24px' }}>{currentSection.description}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {currentSection.questions.map(q => (
            <div key={q.id}>
              <label style={{ display: 'block', color: '#ccc', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
                {q.label}
                {q.required && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
              </label>
              <QuestionField q={q} value={answers[q.id]} onChange={updateAnswer} />
            </div>
          ))}
        </div>

        <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '20px' }}>
          {answeredInSection}/{currentSection.questions.length} perguntas respondidas
        </div>
      </div>

      {/* Navegação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setActiveSection(prev => Math.max(0, prev - 1))}
          disabled={activeSection === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#1a1a1a', color: activeSection === 0 ? '#555' : '#fff',
            border: '1px solid #333', borderRadius: '8px', padding: '10px 20px',
            cursor: activeSection === 0 ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
          }}
        >
          <ChevronLeft size={16} /> Anterior
        </button>

        {isLast ? (
          <button
            onClick={() => setCompleted(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#166534', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 24px', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 700,
            }}
          >
            <CheckCircle size={16} /> Gerar Resumo
          </button>
        ) : (
          <button
            onClick={() => setActiveSection(prev => Math.min(SECTIONS.length - 1, prev + 1))}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#800020', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '10px 24px', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 600,
            }}
          >
            Próxima Seção <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
