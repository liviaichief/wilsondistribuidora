
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProducts, saveProduct } from '../dataService';
import { databases, DATABASE_ID, COLLECTIONS } from '../../lib/appwrite';

// Mocking Appwrite lib
vi.mock('../../lib/appwrite', () => ({
    databases: {
        listDocuments: vi.fn(),
        createDocument: vi.fn(),
        updateDocument: vi.fn(),
        deleteDocument: vi.fn(),
    },
    functions: {
        createExecution: vi.fn(),
    },
    DATABASE_ID: 'test_db',
    COLLECTIONS: {
        PRODUCTS: 'products',
        ORDERS: 'orders',
        BANNERS: 'banners',
        PROFILES: 'profiles'
    }
}));

describe('DataService - Products', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should fetch products and map them correctly', async () => {
        const mockResponse = {
            documents: [
                { $id: '1', title: 'Carne 1', price: 50 },
                { $id: '2', title: 'Carne 2', price: 60 },
            ],
            total: 2
        };

        databases.listDocuments.mockResolvedValue(mockResponse);

        const result = await getProducts();

        expect(databases.listDocuments).toHaveBeenCalled();
        expect(result.documents).toHaveLength(2);
        expect(result.documents[0].id).toBe('1');
    });

    it('should create a new product with active: true by default', async () => {
        databases.createDocument.mockResolvedValue({ $id: 'new_id', title: 'New' });
        databases.listDocuments.mockResolvedValue({ documents: [], total: 0 }); // for SKU

        const newProduct = {
            title: 'Novo Teste',
            price: 15.0,
            category: 'bebidas'
        };

        await saveProduct(newProduct);

        expect(databases.createDocument).toHaveBeenCalled();
        const payload = databases.createDocument.mock.calls[0][3];
        expect(payload.active).toBe(true);
    });
});
