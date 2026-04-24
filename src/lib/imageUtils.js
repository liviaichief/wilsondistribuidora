
import { storage, BUCKET_ID, client } from './appwrite';

/**
 * Generates a valid image URL from a variety of source formats (Appwrite File ID, URL, Legacy Path).
 * @param {string} imagePath - The image reference from the database (URL, Path, or ID).
 * @returns {string} - The fully qualified URL to display.
 */
/**
 * Generates a valid image URL from a variety of source formats (Appwrite File ID, URL, Legacy Path).
 * Supports on-the-fly optimization via Appwrite's Preview API.
 * @param {string} imagePath - The image reference from the database (URL, Path, or ID).
 * @param {Object} options - Optimization options { width, height, quality, gravity }.
 * @returns {string} - The fully qualified URL to display.
 */
export const getImageUrl = (imagePath, options = {}) => {
    if (!imagePath) {
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Sem+Imagem';
    }

    // 1. If it's already a full external URL, return as is
    if (typeof imagePath === 'string' && (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('data:'))) {
        return imagePath;
    }

    try {
        const rawFileId = typeof imagePath === 'string' ? imagePath.replace('product-images/', '') : imagePath;
        const fileId = encodeURIComponent(rawFileId);

        // Standard Appwrite Cloud/Self-hosted Preview API parameters
        const { width, height, quality = 80, gravity = 'center' } = options;
        
        // Appwrite Preview API structure: /storage/buckets/{bucketId}/files/{fileId}/preview
        // Params: width, height, quality, gravity, output (webp)
        const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
        const project = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

        // Se for um vídeo ou GIF animado que não suporta preview estático da mesma forma, usamos view
        const lowerFileId = rawFileId.toLowerCase();
        const isMedia = lowerFileId.endsWith('.mp4') || 
                       lowerFileId.endsWith('.webm') || 
                       lowerFileId.endsWith('.mov');

        if (isMedia) {
            return `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${project}`;
        }

        // Construção da URL de Preview (Otimizada)
        // Adicionamos &output=webp para forçar compressão moderna
        let url = `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/preview?project=${project}&output=webp&quality=${quality}`;
        
        if (width) url += `&width=${width}`;
        if (height) url += `&height=${height}`;
        if (gravity) url += `&gravity=${gravity}`;

        return url;
    } catch (error) {
        console.warn('Error generating optimized Appwrite image URL:', error);
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+no+Link';
    }
};
