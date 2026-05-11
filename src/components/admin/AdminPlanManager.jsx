/**
 * AdminPlanManager — Gerenciamento de Plano e Identidade do Cliente
 *
 * Permite ao operador do sistema configurar:
 * 1. Qual plano está ativo para este cliente
 * 2. Identidade visual (nome, logo, cores)
 * 3. Visão de quais features estão disponíveis no plano selecionado
 */

import { useState } from 'react';
import { Save, Loader2, Check, Lock, Star, Zap, Crown } from 'lucide-react';
import { PLANS, PLAN_INFO, PLAN_FEATURES, FEATURE_LABELS } from '../../config/plans';
import { updateSettings, updateMultipleSettings } from '../../services/settingsService';
import { useAlert } from '../../context/AlertContext';
import { usePlan } from '../../hooks/usePlan';

// Ícone de cada plano
const PLAN_ICONS = {
  [PLANS.BASIC]:        <Zap size={20} />,
  [PLANS.INTERMEDIATE]: <Star size={20} />,
  [PLANS.PREMIUM]:      <Crown size={20} />,
};

// Agrupa features por categoria para exibição organizada
function groupFeatures(features) {
  const groups = {};
  features.forEach(f => {
    const meta = FEATURE_LABELS[f];
    if (!meta) return;
    if (!groups[meta.group]) groups[meta.group] = [];
    groups[meta.group].push({ key: f, ...meta });
  });
  return groups;
}

export default function AdminPlanManager({ settings, onSettingsChange }) {
  const { currentPlan, refreshPlan } = usePlan();
  const { showAlert } = useAlert();
  const [selectedPlan, setSelectedPlan]   = useState(settings?.active_plan ?? currentPlan ?? PLANS.BASIC);
  const [clientName, setClientName]       = useState(settings?.store_name ?? '');
  const [colorPrimary, setColorPrimary]   = useState(settings?.color_primary ?? '#800020');
  const [colorAccent, setColorAccent]     = useState(settings?.color_accent ?? '#D4AF37');
  const [saving, setSaving]               = useState(false);

  const planOrder = [PLANS.BASIC, PLANS.INTERMEDIATE, PLANS.PREMIUM];
  const featuresInPlan = PLAN_FEATURES[selectedPlan] ?? [];
  const featureGroups  = groupFeatures(featuresInPlan);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMultipleSettings({
        active_plan:     selectedPlan,
        store_name:      clientName,
        color_primary:   colorPrimary,
        color_accent:    colorAccent,
      });
      onSettingsChange?.({ active_plan: selectedPlan, store_name: clientName, color_primary: colorPrimary, color_accent: colorAccent });
      await refreshPlan();
      showAlert('Plano e identidade salvos com sucesso!', 'success');
    } catch (err) {
      showAlert('Erro ao salvar configurações de plano.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Seleção de Plano ─────────────────────────────────────────────── */}
      <div>
        <p style={{ color: '#888', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          Plano Ativo
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {planOrder.map(plan => {
            const info     = PLAN_INFO[plan];
            const active   = selectedPlan === plan;
            return (
              <button
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                style={{
                  padding: '20px 16px',
                  borderRadius: '16px',
                  border: `2px solid ${active ? info.color : 'rgba(255,255,255,0.08)'}`,
                  background: active ? `${info.color}18` : 'rgba(0,0,0,0.2)',
                  color: active ? info.color : '#888',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '0.9rem' }}>
                  {PLAN_ICONS[plan]}
                  {info.name}
                  {active && <Check size={14} style={{ marginLeft: 'auto' }} />}
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 900 }}>
                  R$ {info.price}<span style={{ fontSize: '0.7rem', fontWeight: 400 }}>/mês</span>
                </span>
                <span style={{ fontSize: '0.72rem', opacity: 0.7, lineHeight: 1.4 }}>{info.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Features do Plano Selecionado ────────────────────────────────── */}
      <div>
        <p style={{ color: '#888', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          Funcionalidades Incluídas
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(featureGroups).map(([group, items]) => (
            <div key={group}>
              <p style={{ color: '#555', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                {group}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {items.map(item => (
                  <span
                    key={item.key}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      background: 'rgba(212,175,55,0.1)',
                      border: '1px solid rgba(212,175,55,0.25)',
                      color: '#D4AF37',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Identidade Visual ────────────────────────────────────────────── */}
      <div>
        <p style={{ color: '#888', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          Identidade do Cliente
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: '#666', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Nome do Estabelecimento
            </label>
            <input
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Ex: Açougue do João"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 14px', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#666', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Cor Primária
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={colorPrimary} onChange={e => setColorPrimary(e.target.value)}
                  style={{ width: '48px', height: '48px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'none' }} />
                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{colorPrimary}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ color: '#666', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Cor de Destaque
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="color" value={colorAccent} onChange={e => setColorAccent(e.target.value)}
                  style={{ width: '48px', height: '48px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'none' }} />
                <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{colorAccent}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Botão Salvar ─────────────────────────────────────────────────── */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: saving ? 'rgba(255,255,255,0.05)' : '#D4AF37',
          color: saving ? '#555' : '#000',
          border: 'none',
          borderRadius: '14px',
          padding: '14px 24px',
          fontWeight: 900,
          fontSize: '0.9rem',
          cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s',
        }}
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        {saving ? 'SALVANDO...' : 'SALVAR PLANO E IDENTIDADE'}
      </button>
    </div>
  );
}
