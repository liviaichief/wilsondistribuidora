
const { Client, Databases, ID, Permission, Role, Storage } = require('node-appwrite');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = process.env.VITE_DATABASE_ID;
const BUCKET_ID = process.env.VITE_APPWRITE_BUCKET_ID;
const COLLECTIONS = {
    PRODUCTS: process.env.VITE_COLLECTION_PRODUCTS,
};

const categories = [
    { id: 'kit', label: 'Kit', img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800' },
    { id: 'carne', label: 'Carne', img: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=800' },
    { id: 'suinos', label: 'Suínos', img: 'https://images.unsplash.com/photo-1602410298024-8bb3bece0459?q=80&w=800' },
    { id: 'frango', label: 'Frango', img: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800' },
    { id: 'acompanhamentos', label: 'Acompanhamentos', img: 'https://images.unsplash.com/photo-1534939561126-855b8675ebb7?q=80&w=800' },
    { id: 'acessorios', label: 'Acessórios', img: 'https://images.unsplash.com/photo-1544025162-d76690b67f61?q=80&w=800' },
    { id: 'insumos', label: 'Insumos', img: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=800' },
    { id: 'bebidas', label: 'Bebidas', img: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=800' }
];

const seedData = [
    // KIT
    { title: 'Kit Churrasco Iniciante', price: 149.90, category: 'kit', description: 'O essencial para seu primeiro churrasco.' },
    { title: 'Kit Gourmet Supremo', price: 499.00, category: 'kit', description: 'Cortes premium e acessórios selecionados.' },
    { title: 'Kit Família Wilson', price: 280.50, category: 'kit', description: 'Feito para alimentar toda a família com qualidade.' },
    // CARNE
    { title: 'Picanha Angus Premium', price: 98.90, category: 'carne', description: 'A rainha do churrasco com gordura uniforme.' },
    { title: 'Ancho de Wagyu', price: 235.00, category: 'carne', description: 'Extremo marmoreio e sabor inigualável.' },
    { title: 'Maminha na Manteiga', price: 65.40, category: 'carne', description: 'Corte macio e suculento para o dia a dia.' },
    // SUINOS
    { title: 'Costelinha Barbecue', price: 54.90, category: 'suinos', description: 'Costela suína selecionada de primeira.' },
    { title: 'Lombo Temperado', price: 42.00, category: 'suinos', description: 'Pronto para assar ou grelhar.' },
    { title: 'Panceta Pururuca', price: 38.50, category: 'suinos', description: 'Ideal para fazer aquela pururuca crocante.' },
    // FRANGO
    { title: 'Sobrecoxa Desossada', price: 28.90, category: 'frango', description: 'Saborosa e fácil de preparar.' },
    { title: 'Asinha Picante', price: 24.50, category: 'frango', description: 'O petisco perfeito para acompanhar a cerveja.' },
    { title: 'Coração de Frango Tempero Caseiro', price: 32.00, category: 'frango', description: 'Tradição do churrasco brasileiro.' },
    // ACOMPANHAMENTOS
    { title: 'Pão de Alho Especial', price: 18.90, category: 'acompanhamentos', description: 'Receita exclusiva com muito queijo.' },
    { title: 'Queijo Coalho Premium', price: 22.50, category: 'acompanhamentos', description: 'Packs com 5 espetos selecionados.' },
    { title: 'Farofa da Casa', price: 15.00, category: 'acompanhamentos', description: 'Crocante e com tempero artesanal.' },
    // ACESSORIOS
    { title: 'Faca do Chef Wilson', price: 120.00, category: 'acessorios', description: 'Aço inox de alta performance.' },
    { title: 'Tábua de Madeira Nobre', price: 185.00, category: 'acessorios', description: 'Design rústico e durabilidade.' },
    { title: 'Afiador Profissional', price: 45.00, category: 'acessorios', description: 'Mantenha seu corte sempre em dia.' },
    // INSUMOS
    { title: 'Carvão Vegetal 5kg', price: 28.00, category: 'insumos', description: 'Acendimento rápido e longa duração.' },
    { title: 'Sal de Parrilla', price: 12.50, category: 'insumos', description: 'Granulação ideal para carnes nobres.' },
    { title: 'Lenha de Macieira', price: 35.00, category: 'insumos', description: 'Defumação suave e aromática.' },
    // BEBIDAS
    { title: 'Cerveja Artesanal IPA', price: 14.90, category: 'bebidas', description: 'Harmoniza perfeitamente com carnes gordas.' },
    { title: 'Vinho Tinto Malbec', price: 89.00, category: 'bebidas', description: 'Reserva especial para acompanhamento.' },
    { title: 'Refrigerante 2L', price: 9.50, category: 'bebidas', description: 'Opção refrescante para todos.' }
];

async function seed() {
    console.log('--- Iniciando Seeding de Produtos ---');
    
    for (const item of seedData) {
        try {
            // Find category image
            const catInfo = categories.find(c => c.id === item.category);
            const imageUrl = catInfo ? catInfo.img : 'https://placehold.co/800';

            const payload = {
                title: item.title,
                description: item.description,
                price: item.price,
                category: item.category,
                image: imageUrl, // Saving Unsplash URL as fallback
                active: true,
                uom: item.category === 'suinos' || item.category === 'carne' || item.category === 'frango' ? 'KG' : 'UN',
                is_promotion: Math.random() > 0.7,
                promo_price: Math.random() > 0.7 ? item.price * 0.8 : null,
                sku: `EX-${Math.floor(Math.random() * 9000) + 1000}`
            };

            await databases.createDocument(
                DATABASE_ID,
                COLLECTIONS.PRODUCTS,
                ID.unique(),
                payload,
                [
                    Permission.read(Role.any()),
                    Permission.write(Role.users())
                ]
            );
            console.log(`✅ Criado: ${item.title}`);
        } catch (error) {
            console.error(`❌ Erro ao criar ${item.title}:`, error.message);
        }
    }
    console.log('--- Seeding Finalizado ---');
}

seed();
