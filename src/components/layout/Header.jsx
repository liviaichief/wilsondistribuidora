import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, X, User, Instagram } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { getSettings } from '../../services/dataService';

const CATEGORIES = [
    { id: 'all', label: 'Todos' },
    { id: 'beef', label: 'Bovinos' },
    { id: 'pork', label: 'Suínos' },
    { id: 'poultry', label: 'Aves' },
    { id: 'exotic', label: 'Exóticos' },
    { id: 'kits', label: 'Kits Churrasco' },
];

export default function Header({ activeCategory, onCategoryChange }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [instagramLink, setInstagramLink] = useState('');
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

    useEffect(() => {
        const fetchSettings = async () => {
            const settings = await getSettings();
            if (settings && settings.instagram_link) {
                setInstagramLink(settings.instagram_link);
            }
        };
        fetchSettings();
    }, []);

    if (isAdmin) return null; // Or render admin header

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <Link to="/" className="mr-6 flex items-center space-x-2">
                            <span className="text-xl font-bold text-primary-700 tracking-tight">BASE<span className="text-gray-900">APP</span></span>
                        </Link>
                        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
                            {CATEGORIES.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => onCategoryChange && onCategoryChange(category.id)}
                                    className={cn(
                                        "transition-colors hover:text-primary-600",
                                        activeCategory === category.id ? "text-primary-600 font-semibold" : "text-gray-600"
                                    )}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        {instagramLink && (
                            <a 
                                href={instagramLink} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-1 transition-transform hover:scale-110"
                                title="Instagram"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <defs>
                                        <linearGradient id="insta-grad-layout" x1="0%" y1="100%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#f09433" />
                                            <stop offset="25%" stopColor="#e6683c" />
                                            <stop offset="50%" stopColor="#dc2743" />
                                            <stop offset="75%" stopColor="#cc2366" />
                                            <stop offset="100%" stopColor="#bc1888" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#insta-grad-layout)"></rect>
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" stroke="url(#insta-grad-layout)"></path>
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="url(#insta-grad-layout)"></line>
                                </svg>
                            </a>
                        )}
                        <div className="flex items-center space-x-2">
                            <Link to="/login">
                            <Button variant="ghost" size="sm">
                                <User className="h-5 w-5" />
                                <span className="sr-only">Login</span>
                            </Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>


            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden border-t border-gray-200 bg-white overflow-hidden"
                    >
                        <div className="container mx-auto px-4 py-2 grid gap-1">
                            {CATEGORIES.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => {
                                        onCategoryChange && onCategoryChange(category.id);
                                        setIsMenuOpen(false);
                                    }}
                                    className={cn(
                                        "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100",
                                        activeCategory === category.id ? "text-primary-600 bg-primary-50" : "text-gray-600"
                                    )}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
