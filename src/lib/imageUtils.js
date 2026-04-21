
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
        if (storage && fileId) {
            // Se for um item especial ou GIF, visualização direta
            if (fileId.toLowerCase().endsWith('.gif') || fileId.startsWith('v_')) {
                return storage.getFileView(BUCKET_ID, fileId).toString();
            }

            // Para garantir compatibilidade e evitar erros 403 (Forbidden) observados no preview,
            // usamos getFileView por padrão. O preview pode ser habilitado se as permissões 
            // do bucket forem ajustadas no Appwrite.
            try {
                // Se quisermos forçar o preview no futuro, a lógica está aqui, 
                // mas por ora o View é mais confiável para este ambiente.
                return storage.getFileView(BUCKET_ID, fileId).toString();
            } catch (e) {
                console.warn('SDK View failed:', e);
                return storage.getFileView(BUCKET_ID, fileId).toString();
            }
        }

        // Fallback manual altamente resiliente usando as mesmas variáveis do client
        const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
        const project = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';

        return `${endpoint}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${project}`;
    } catch (error) {
        console.warn('Error generating Appwrite image URL:', error);
        return 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Erro+Imagem';
    }
};
