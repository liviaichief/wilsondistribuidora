
import { storage, BUCKET_ID } from './appwrite';

/**
 * Generates a valid image URL from a variety of source formats (Appwrite File ID, URL, Legacy Path).
 * @param {string} imagePath - The image reference from the database (URL, Path, or ID).
 * @returns {string} - The fully qualified URL to display.
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) {
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Sem+Imagem';
    }

    // 1. If it's already a full URL (Supabase, External, blob, data, or already processed Appwrite URL)
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('data:')) {
        // Optimization: if it's Supabase and not already resized, we could append params, but let's stick to basic validity first.
        return imagePath;
    }

    // 2. If it's a legacy Supabase relative path (e.g., "product-images/...")
    // We can't serve these from Appwrite unless they were migrated with same IDs or paths.
    // Note: Appwrite uses distinct File IDs. If the DB still has "product-images/123.jpg", that's a broken link unless mapped.
    // However, if the user says "in production", and they likely just uploaded via the new admin, it's an Appwrite File ID.

    // 3. Assume it's an Appwrite File ID if it has no slashes and looks like an ID
    try {
        const cleanId = imagePath.replace('product-images/', '');

        // Manual construction of Appwrite Preview URL for maximum reliability
        // Endpoint and Project ID are derived from the same source as the main client
        const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://sfo.cloud.appwrite.io/v1';
        const project = import.meta.env.VITE_APPWRITE_PROJECT_ID || '698e695d001d446b21d9';
        const bucket = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'product-images';

        // Direct URL format that works even if SDK state is weird
        return `${endpoint}/storage/buckets/${bucket}/files/${cleanId}/preview?project=${project}&width=800&height=800&gravity=center&quality=90`;
    } catch (error) {
        console.warn('Error generating Appwrite image URL:', error);
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+Imagem';
    }
};
