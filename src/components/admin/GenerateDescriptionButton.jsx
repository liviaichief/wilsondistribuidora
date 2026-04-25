
import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateProductDescription } from '../../services/aiService';

const GenerateDescriptionButton = ({ productTitle, category, onGenerated }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!productTitle) {
            alert('Por favor, insira um título para o produto primeiro.');
            return;
        }

        setIsGenerating(true);
        try {
            const description = await generateProductDescription(productTitle, category);
            onGenerated(description);
        } catch (error) {
            console.error('Erro ao gerar descrição:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleGenerate}
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
            {isGenerating ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <Sparkles size={14} />
            )}
            {isGenerating ? 'GERANDO...' : 'GERAR DESCRIÇÃO COM IA'}
        </button>
    );
};

export default GenerateDescriptionButton;
