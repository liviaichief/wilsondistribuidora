
import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateProductDescription } from '../../services/aiService';
import { getSettings } from '../../services/dataService';

const GenerateDescriptionButton = ({ productTitle, category, onGenerated }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [context, setContext] = useState('');
    const [showContext, setShowContext] = useState(false);
    const [aiEnabled, setAiEnabled] = useState(true);

    useEffect(() => {
        getSettings().then(data => {
            // ai_description_enabled é true por padrão se não estiver definido
            setAiEnabled(data.ai_description_enabled !== false);
        }).catch(() => {});
    }, []);

    const handleGenerate = async () => {
        if (!productTitle) {
            alert('Por favor, insira um título para o produto primeiro.');
            return;
        }

        setIsGenerating(true);
        try {
            const description = await generateProductDescription(productTitle, category, context);
            onGenerated(description);
            setShowContext(false);
        } catch (error) {
            console.error('Erro ao gerar descrição:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Não renderiza nada se a IA estiver desabilitada nas configurações
    if (!aiEnabled) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {showContext ? (
                <div style={{ display: 'flex', gap: '8px', animation: 'fadeIn 0.3s' }}>
                    <input 
                        value={context} 
                        onChange={e => setContext(e.target.value)}
                        placeholder="Contexto: ex: promoção, carne macia..."
                        style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '8px', padding: '6px 10px', color: '#fff', fontSize: '0.75rem' }}
                    />
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        style={{ background: '#D4AF37', color: '#000', border: 'none', borderRadius: '8px', padding: '0 12px', fontWeight: 800, fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : 'GERAR'}
                    </button>
                    <button onClick={() => setShowContext(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666', borderRadius: '8px', padding: '0 10px', cursor: 'pointer' }}>X</button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setShowContext(true)}
                    disabled={isGenerating || !productTitle}
                    className="ai-gen-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid rgba(212, 175, 55, 0.2)',
                        borderRadius: '8px',
                        color: '#D4AF37',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        cursor: (isGenerating || !productTitle) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: !productTitle ? 0.5 : 1
                    }}
                >
                    <Sparkles size={14} />
                    GERAR DESCRIÇÃO COM IA
                </button>
            )}
        </div>
    );
};

export default GenerateDescriptionButton;
