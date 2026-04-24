
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { fetchGoogleReviews } from '../../services/googleService';
import { getSettings } from '../../services/dataService';

const GoogleReviews = () => {
    const [data, setData] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReviews = async () => {
            const settings = await getSettings();
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
    if (!data || data.reviews.length === 0) return null;

    const current = data.reviews[currentIndex];

    return (
        <section className="google-reviews-section" style={{ padding: '80px 20px', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
                
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ marginBottom: '50px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px' }}>
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={24} fill="#D4AF37" color="#D4AF37" />
                        ))}
                    </div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: '0 0 10px' }}>O que dizem nossos clientes</h2>
                    <p style={{ color: '#888', fontSize: '1.1rem' }}>
                        Nota <span style={{ color: '#fff', fontWeight: 'bold' }}>{data.rating}</span> baseada em mais de {data.total_reviews} avaliações no Google
                    </p>
                </motion.div>

                {/* Carousel Card */}
                <div style={{ position: 'relative', minHeight: '300px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.4 }}
                            className="glass-card"
                            style={{ 
                                padding: '40px', 
                                borderRadius: '30px', 
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(255,255,255,0.02)',
                                position: 'relative'
                            }}
                        >
                            <Quote size={60} color="rgba(212, 175, 55, 0.1)" style={{ position: 'absolute', top: '20px', left: '20px' }} />
                            
                            <p style={{ fontSize: '1.4rem', fontStyle: 'italic', lineHeight: '1.6', marginBottom: '30px', color: '#eee', position: 'relative', zIndex: 1 }}>
                                "{current.text}"
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                                {current.photo ? (
                                    <img src={current.photo} alt={current.author} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                                ) : (
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#D4AF37', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        {current.author[0]}
                                    </div>
                                )}
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{current.author}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#555' }}>Cliente via Google • {current.time}</div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
                        <button onClick={prev} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '12px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={next} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '12px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default GoogleReviews;
