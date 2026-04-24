import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Beer, Store, Box } from 'lucide-react';
import { getCategories } from '../../services/dataService';
import './CategoryBar.css';

// Custom Icons
const OssobucoIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.6" />
    </svg>
);

const DrumstickIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 13c-2.5-2.5-3.5-7-1.5-9s6.5-1 9 1.5 1.5 6.5-1 8.5-6.5 1.5-6.5-1z" />
        <path d="M11.5 12.5L7 17" />
        <path d="M7 15.5c-1-1-2.5 0-1.5 1 .5.5 1 .5 1.5 0s1 .5 1.5 0c1-1-0.5-2-1.5-1z" />
    </svg>
);

const SausageIcon = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8c1.5 1.5 2 4 0.5 5.5l-9 9c-1.5 1.5-4 1-5.5-0.5s-2-4-0.5-5.5l9-9c1.5-1.5 4-1 5.5 0.5Z" />
    </svg>
);

const CategoryBar = ({ activeCategory, onCategoryChange }) => {
    const [categories, setCategories] = React.useState([{ id: 'all', label: 'PROMOÇÕES', icon: Sparkles }]);
    const scrollRef = React.useRef(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [startX, setStartX] = React.useState(0);
    const [scrollLeft, setScrollLeft] = React.useState(0);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // Velocidade do scroll
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    React.useEffect(() => {
        const loadCats = async () => {
            try {
                const data = await getCategories();
                const getIcon = (id) => {
                    switch (id) {
                        case '1': return OssobucoIcon;
                        case '2': return SausageIcon;
                        case '3': return DrumstickIcon;
                        case '4': return Beer;
                        case '5': return Store;
                        default: return Box;
                    }
                };
                setCategories([
                    { id: 'all', label: 'PROMOÇÕES', icon: Sparkles },
                    ...data.filter(cat => cat.active !== false).map(cat => ({
                        id: cat.id,
                        label: cat.name.toUpperCase(),
                        icon: getIcon(cat.id)
                    }))
                ]);
            } catch (e) { console.error(e); }
        };
        loadCats();
    }, []);

    return (
        <div className="category-bar-container">
            <div 
                className={`category-bar-inner ${isDragging ? 'dragging' : ''}`} 
                ref={scrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        className={`cat-tab-btn ${activeCategory === cat.id ? 'active' : ''} ${cat.id === 'all' ? 'promo-tab' : ''}`}
                        onClick={() => onCategoryChange(cat.id)}
                    >
                        {cat.id === 'all' && <cat.icon size={18} />}
                        <span>{cat.label}</span>
                        {activeCategory === cat.id && (
                            <motion.div layoutId="activeCatBar" className="cat-tab-indicator" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CategoryBar;
