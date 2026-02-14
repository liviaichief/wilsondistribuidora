import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Button from './Button';

import { motion } from 'framer-motion';

export default function ProductCard({ product }) {
    const { title, description, price, image } = product;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
        >
            <div className="aspect-square w-full overflow-hidden bg-gray-100">
                {image ? (
                    <img
                        src={(() => {
                            if (!image) return null;
                            if (image.startsWith('http')) return image;
                            const supabaseUrl = "https://ofpqtmiyuffmfgeoocml.supabase.co";
                            const storagePath = image.startsWith('product-images')
                                ? image
                                : `product-images/${image}`;
                            return `${supabaseUrl}/storage/v1/object/public/${storagePath}`;
                        })()}
                        alt={title}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col p-4">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500 line-clamp-2 flex-grow">{description}</p>
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-primary-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)}
                    </span>
                    <Button size="sm" className="gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Adicionar
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
