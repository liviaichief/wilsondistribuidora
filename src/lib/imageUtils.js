
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
        // Clean up path found in some migrations
        const cleanId = imagePath.replace('product-images/', '');

        // Use getFilePreview with slightly lower quality and size for better compatibility
        const result = storage.getFilePreview(
            BUCKET_ID,
            cleanId,
            800, // width
            800, // height
            'center', // gravity
            90 // quality - 100 sometimes causes issues
        );

        return result.href || result;
    } catch (error) {
        console.warn('Error generating Appwrite image URL:', error);
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+Imagem';
    }
};
