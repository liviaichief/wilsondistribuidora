
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
        const fileId = typeof imagePath === 'string' ? imagePath.replace('product-images/', '') : imagePath;

        // Use the SDK method which is more reliable than manual construction
        // It automatically uses the correct endpoint and project ID from the client config
        if (storage && fileId) {
            // No Appwrite Cloud (plano Free), transformações via preview são bloqueadas.
            // Usamos getFileView para garantir que a imagem seja exibida independente do plano.
            return storage.getFileView(BUCKET_ID, fileId).toString();
        }

        // Fallback to manual construction if storage is not available (unlikely)
        const endpoint = client?.config?.endpoint || 'https://cloud.appwrite.io/v1';
        const project = client?.config?.project || '69d59db800358cca9f27';

        return `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${project}`;
    } catch (error) {
        console.warn('Error generating Appwrite image URL:', error);
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+Imagem';
    }
};
