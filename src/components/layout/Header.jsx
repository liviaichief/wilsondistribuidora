import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, X, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

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
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

    if (isAdmin) return null; // Or render admin header

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        <Link to="/" className="mr-6 flex items-center space-x-2">
                            <span className="text-xl font-bold text-primary-700 tracking-tight">BOUTIQUE<span className="text-gray-900">CARNE</span></span>
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
