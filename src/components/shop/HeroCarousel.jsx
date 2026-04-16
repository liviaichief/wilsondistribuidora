import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getBanners } from '../../services/dataService';
import { getImageUrl } from '../../lib/imageUtils';
import './HeroCarousel.css';

const HeroCarousel = () => {
    const navigate = useNavigate();
    const [slides, setSlides] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBannersData();
    }, []);

    const loadBannersData = async () => {
        try {
            console.log('HeroCarousel: Fetching banners...');
            // Use our new dataService which wraps Appwrite
            const banners = await getBanners();

            console.log('HeroCarousel: Data received:', banners);

            if (banners && banners.length > 0) {
                setSlides(banners);
            } else {
                console.log('HeroCarousel: No banners found, using defaults');
                // Optional: setSlides(DEFAULT_SLIDES);
            }
        } catch (err) {
            console.error('HeroCarousel: Error loading banners:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slides.length === 0) return;

        const currentSlide = slides[currentIndex];
        const duration = (currentSlide.duration || 5) * 1000; // Default 5s if not set

        const timer = setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, duration);

        return () => clearTimeout(timer);
    }, [currentIndex, slides]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const handleSlideClick = (slide) => {
        // Se houver um ID de produto vinculado, rotear para a tela de Detalhes do Produto
        if (slide.product_id) {
            navigate(`/produto/${slide.product_id}`);
            return;
        }

        // Se houver um link customizado (ex: /promocoes), rotear para ele
        if (slide.link && (slide.link.startsWith('/') || slide.link.startsWith('http'))) {
            if (slide.link.startsWith('http')) {
                window.open(slide.link, '_blank');
            } else {
                navigate(slide.link);
            }
        }
    };

    if (slides.length === 0) {
        return <div className="hero-carousel" style={{ backgroundColor: '#121212' }}></div>;
    }

    return (
        <div className="hero-carousel">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="carousel-slide"
                    onClick={() => handleSlideClick(slides[currentIndex])}
                    style={{ cursor: slides[currentIndex].product_id ? 'pointer' : 'default', backgroundColor: '#121212' }}
                >
                    {(() => {
                        const mediaUrl = getImageUrl(slides[currentIndex].image_url || slides[currentIndex].image, { width: 1200 });
                        // Appwrite serves files by ID in the URL. If the ID starts with v_, it's our video flag.
                        const isVideo = mediaUrl && (
                            mediaUrl.toLowerCase().includes('/files/v_') ||
                            mediaUrl.toLowerCase().includes('.mp4') || 
                            mediaUrl.toLowerCase().includes('.webm') || 
                            mediaUrl.toLowerCase().includes('.mov')
                        );

                        if (isVideo) {
                            return (
                                <video
                                    src={mediaUrl}
                                    poster={slides[currentIndex].thumbnail_url ? getImageUrl(slides[currentIndex].thumbnail_url) : undefined}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    className="carousel-image"
                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                />
                            );
                        }

                        return (
                            <img
                                src={mediaUrl}
                                alt={slides[currentIndex].title}
                                className="carousel-image"
                                style={{ objectFit: 'contain' }}
                            />
                        );
                    })()}

                    <div className="carousel-overlay">
                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {slides[currentIndex].title}
                        </motion.h2>
                        {/* If 'link' contains text describing the slide, use it as subtitle. If it's a URL, we might want to make it clickable or hide it here. For now, using it as subtitle if present and distinct from title */}
                        {slides[currentIndex].link && !slides[currentIndex].link.startsWith('http') && !slides[currentIndex].link.startsWith('/') && (
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                {slides[currentIndex].link}
                            </motion.p>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            <button className="carousel-btn prev" onClick={(e) => { e.stopPropagation(); prevSlide(); }}>
                <ChevronLeft size={32} />
            </button>
            <button className="carousel-btn next" onClick={(e) => { e.stopPropagation(); nextSlide(); }}>
                <ChevronRight size={32} />
            </button>

            <div className="carousel-indicators">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        className={`indicator ${idx === currentIndex ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;


