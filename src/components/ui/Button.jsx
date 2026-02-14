
import { cn } from '../../lib/utils'; // Adjust path if needed

// Note: I need to install class-variance-authority or just implement simple logic.
// For now, I'll stick to simple logic to avoid another install command unless I really want it.
// Actually, I'll just use simple template literals for now to keep it lean.

// Updated plan: Simple Button component without CVA dependency to avoid installs.
import React from 'react';

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    className,
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-purple-500",
        outline: "border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500",
        ghost: "hover:bg-gray-100 text-gray-700",
    };

    const sizes = {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-lg",
    };

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
}
