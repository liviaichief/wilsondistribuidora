
import { storage, BUCKET_ID, client } from './appwrite';

/**
 * Generates a valid image URL from a variety of source formats (Appwrite File ID, URL, Legacy Path).
 * @param {string} imagePath - The image reference from the database (URL, Path, or ID).
 * @returns {string} - The fully qualified URL to display.
 */
export const getImageUrl = (imagePath, options = {}) => {
    if (!imagePath) {
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Sem+Imagem';
    }

    // 1. If it's already a full URL (External, blob, data, or already processed Appwrite URL)
    if (typeof imagePath === 'string' && (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('data:'))) {
        return imagePath;
    }

    // 2. Process Appwrite File ID or Legacy Path
    try {
        // Handle legacy paths if they exist
        const rawFileId = typeof imagePath === 'string' ? imagePath.replace('product-images/', '') : imagePath;
        const fileId = encodeURIComponent(rawFileId);

        // Use the SDK method which is more reliable than manual construction
        if (storage && fileId) {
            const lowerFileId = rawFileId.toLowerCase();
            const isMedia = lowerFileId.endsWith('.gif') || 
                           lowerFileId.startsWith('v_') || 
                           lowerFileId.endsWith('.mp4') || 
                           lowerFileId.endsWith('.webm') || 
                           lowerFileId.endsWith('.mov');

            if (isMedia) {
                return storage.getFileView(BUCKET_ID, rawFileId).toString();
            }

            return storage.getFileView(BUCKET_ID, rawFileId).toString();
        }

        // Fallback manual altamente resiliente
        const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
        const project = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

        return `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${project}`;
    } catch (error) {
        console.warn('Error generating Appwrite image URL:', error);
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+no+Link';
    }
};
