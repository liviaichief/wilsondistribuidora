
import { storage, BUCKET_ID, client } from './appwrite';

/**
 * Generates a valid image URL from a variety of source formats (Appwrite File ID, URL, Legacy Path).
 * @param {string} imagePath - The image reference from the database (URL, Path, or ID).
 * @returns {string} - The fully qualified URL to display.
 */
export const getImageUrl = (imagePath) => {
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
        const fileId = typeof imagePath === 'string' ? imagePath.replace('product-images/', '') : imagePath;

        // Use the SDK method which is more reliable than manual construction
        // It automatically uses the correct endpoint and project ID from the client config
        if (storage && fileId) {
            const url = storage.getFilePreview(
                BUCKET_ID,
                fileId,
                800,
                800,
                'center',
                90
            ).toString();

            // Helpful debug for the user to see what's being requested
            if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
                console.debug(`[getImageUrl] Generated URL for ${fileId}:`, url);
            }

            return url;
        }

        // Fallback to manual construction if storage is not available (unlikely)
        const endpoint = client?.config?.endpoint || 'https://cloud.appwrite.io/v1';
        const project = client?.config?.project || '698e695d001d446b21d9';

        return `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/preview?project=${project}`;
    } catch (error) {
        console.warn('Error generating Appwrite image URL:', error);
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+Imagem';
    }
};
