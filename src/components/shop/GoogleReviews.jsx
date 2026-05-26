
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { fetchGoogleReviews } from '../../services/googleService';
import { getSettings } from '../../services/dataService';

const GoogleReviews = () => {
    const [data, setData] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        const loadReviews = async () => {
            const settings = await getSettings();
            // Respeita o toggle "Avaliações Google no Rodapé" (padrão: ativo)
            if (settings.show_google_reviews === false) {
                setEnabled(false);
                setLoading(false);
                return;
            }
            const reviewsData = await fetchGoogleReviews(settings.google_api_key, settings.google_place_id);
            setData(reviewsData);
            setLoading(false);
        };
        loadReviews();
    }, []);

    const next = () => {
        if (!data) return;
        setCurrentIndex((prev) => (prev + 1) % data.reviews.length);
    };

    const prev = () => {
        if (!data) return;
        setCurrentIndex((prev) => (prev - 1 + data.reviews.length) % data.reviews.length);
    };

    if (loading) return null;
    if (!enabled) return null;
    if (!data || data.reviews.length === 0) return null;

    const current = data.reviews[currentIndex];

    return (
        <section className="google-reviews-section" style={{ padding: '40px 20px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div className="container" style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ marginBottom: '24px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '8px' }}>
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill="#D4AF37" color="#D4AF37" />
                        ))}
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: '0 0 5px' }}>O que dizem nossos clientes</h2>
                    <p style={{ color: '#888', fontSize: '0.8rem' }}>
                        Nota <span style={{ color: '#fff', fontWeight: 'bold' }}>{data.rating}</span> baseada em mais de {data.total_reviews} avaliações no Google
                    </p>
                </motion.div>

                {/* Carousel Card */}
                <div style={{ position: 'relative', minHeight: '150px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.4 }}
                            className="glass-card"
                            style={{
                                padding: '20px',
                                borderRadius: '15px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(255,255,255,0.02)',
                                position: 'relative'
                            }}
                        >
                            <Quote size={30} color="rgba(212, 175, 55, 0.1)" style={{ position: 'absolute', top: '10px', left: '10px' }} />

                            <p style={{ fontSize: '0.9rem', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '15px', color: '#eee', position: 'relative', zIndex: 1 }}>
                                "{current.text}"
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {current.photo ? (
                                    <img src={current.photo} alt={current.author} style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                                ) : (
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#D4AF37', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                        {current.author[0]}
                                    </div>
                                )}
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: '0.75rem' }}>{current.author}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#555' }}>Cliente via Google • {current.time}</div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
                        <button onClick={prev} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <ChevronLeft size={14} />
                        </button>
                        <button onClick={next} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '6px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GoogleReviews;
