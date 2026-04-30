import { Client, Databases, Storage, ID, Query } from 'node-appwrite';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69ebf93f000372e879ff')
    .setKey('standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46');

const databases = new Databases(client);

const BUCKET_ID = 'images_bucket';
const DATABASE_ID = 'main_db';
const PROJECT_ID = '69ebf93f000372e879ff';
const API_KEY = 'standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46';

const productsData = [
    // BOVINOS
    { sku: 'BOV-001', title: 'Picanha Premium Wilson', category: 'bovinos', description: 'Corte nobre com capa de gordura uniforme e maciez incomparável.', price: 89.90, uom: 'kg', localImage: 'picanha_premium' },
    { sku: 'BOV-002', title: 'Costela Janela Defumada', category: 'bovinos', description: 'Costela bovina selecionada, ideal para churrasco de fogo de chão.', price: 45.00, uom: 'kg', localImage: 'costela_janela' },
    { sku: 'BOV-003', title: 'Fraldinha Especial', category: 'bovinos', description: 'Corte suculento e saboroso, perfeito para grelha ou forno.', price: 54.90, uom: 'kg', localImage: 'fraldinha_premium' },
    { sku: 'BOV-004', title: 'Contra Filé Chorizo', category: 'bovinos', description: 'O clássico corte argentino com o selo de qualidade Wilson.', price: 68.00, uom: 'kg', localImage: 'contra_file_chorizo' },
    { sku: 'BOV-005', title: 'Cupim do Chef', category: 'bovinos', description: 'Cupim bovino extremamente macio, marmorizado e saboroso.', price: 39.90, uom: 'kg', localImage: 'cupim_defumado' },

    // SUINOS
    { sku: 'SUI-001', title: 'Panceta à Pururuca', category: 'suinos', description: 'Panceta suína selecionada para o melhor torresmo da sua vida.', price: 32.00, uom: 'kg', localImage: 'panceta_pururuca' },
    { sku: 'SUI-002', title: 'Linguiça Artesanal', category: 'suinos', description: 'Receita exclusiva Wilson com ervas finas e carnes nobres.', price: 28.50, uom: 'kg', localImage: 'linguica_artesanal' },
    { sku: 'SUI-003', title: 'Costelinha BBQ', category: 'suinos', description: 'Costelinha suína macia, ideal para molhos agridoces.', price: 42.00, uom: 'kg', localImage: 'costelinha_bbq_suina' },
    { sku: 'SUI-004', title: 'Lombo Suíno Temperado', category: 'suinos', description: 'Lombo marinado em ervas e especiarias, pronto para o forno.', price: 35.00, uom: 'kg', localImage: 'lombo_suino_temperado' },
    { sku: 'SUI-005', title: 'Picanha Suína', category: 'suinos', description: 'Sabor marcante e textura macia, um clássico do churrasco moderno.', price: 38.90, uom: 'kg', localImage: 'picanha_suina_premium' },

    // AVES
    { sku: 'AVE-001', title: 'Coxa e Sobrecoxa Grill', category: 'aves', description: 'Cortes suculentos de frango, perfeitos para assados.', price: 18.90, uom: 'kg', localImage: 'coxa_sobrecoxa_assada' },
    { sku: 'AVE-002', title: 'Coração de Frango Premium', category: 'aves', description: 'Limpos e selecionados, o favorito do espetinho brasileiro.', price: 24.00, uom: 'kg', localImage: 'coracao_frango_grelhado' },
    { sku: 'AVE-003', title: 'Tulipa de Frango (Asinha)', category: 'aves', description: 'Meio da asa crocante e saborosa, ideal para petiscos.', price: 22.50, uom: 'kg', localImage: 'asa_frango_tulipa' },
    { sku: 'AVE-004', title: 'Peito de Frango Filetado', category: 'aves', description: 'Filés finos e limpos, ideais para uma dieta equilibrada.', price: 21.00, uom: 'kg', localImage: 'peito_frango_file' },
    { sku: 'AVE-005', title: 'Galeto Atropelado', category: 'aves', description: 'Frango inteiro aberto e temperado ao estilo tradicional.', price: 29.90, uom: 'un', localImage: 'galeto_atropelado' },

    // KITS
    { sku: 'KIT-001', title: 'Kit Churrasco Família', category: 'kits', description: 'Combo completo com Picanha, Linguiça, Frango e Pão de Alho.', price: 249.00, uom: 'un', localImage: 'kit_churrasco_familia' },
    { sku: 'KIT-002', title: 'Kit Burger Gourmet', category: 'kits', description: '4 Blends de 180g, Pão Brioche e Queijo Artesanal.', price: 85.00, uom: 'un', localImage: 'kit_burguer_artesanal' },
    { sku: 'KIT-003', title: 'Kit Semana Prática', category: 'kits', description: 'Porções individuais congeladas para sua rotina.', price: 150.00, uom: 'un', localImage: null },
    { sku: 'KIT-004', title: 'Kit Espetinhos Mix', category: 'kits', description: '20 Espetinhos variados prontos para a brasa.', price: 110.00, uom: 'un', localImage: null },
    { sku: 'KIT-005', title: 'Kit Presente Premium', category: 'kits', description: 'Box luxo com Wagyu e Vinho Selecionado.', price: 450.00, uom: 'un', localImage: null },

    // MERCADO
    { sku: 'MER-001', title: 'Carvão Vegetal 5kg', category: 'mercado', description: 'Carvão de acácia de longa duração e alta caloria.', price: 25.00, uom: 'un', localImage: null },
    { sku: 'MER-002', title: 'Sal Parrilla com Chimichurri', category: 'mercado', description: 'Tempero ideal para cortes grossos na grelha.', price: 15.90, uom: 'un', localImage: null },
    { sku: 'MER-003', title: 'Molho BBQ Defumado', category: 'mercado', description: 'Receita artesanal com toque de defumação natural.', price: 18.00, uom: 'un', localImage: null },
    { sku: 'MER-004', title: 'Faca do Chef Wilson', category: 'mercado', description: 'Aço inox forjado para o corte perfeito.', price: 120.00, uom: 'un', localImage: null },
    { sku: 'MER-005', title: 'Tábua de Corte Rústica', category: 'mercado', description: 'Madeira nobre tratada para longa durabilidade.', price: 89.00, uom: 'un', localImage: null }
];

const IMAGES_DIR = 'C:/Users/Talita/.gemini/antigravity/brain/5c5f2253-a87e-4a12-8ad9-fc1f151f3822';

async function populate() {
    try {
        console.log('🗑️ Limpando catálogo atual...');
        const existing = await databases.listDocuments(DATABASE_ID, 'products', [Query.limit(100)]);
        for (const doc of existing.documents) {
            await databases.deleteDocument(DATABASE_ID, 'products', doc.$id);
        }
        console.log('✅ Catálogo limpo.');

        const files = fs.readdirSync(IMAGES_DIR);
        
        for (const p of productsData) {
            try {
                let imageId = '';
                
                if (p.localImage) {
                    const fileMatch = files.find(f => f.startsWith(p.localImage) && f.endsWith('.png'));
                    if (fileMatch) {
                        const filePath = path.join(IMAGES_DIR, fileMatch);
                        console.log(`📤 Subindo ${fileMatch} via CURL...`);
                        
                        const curlCmd = `curl.exe -s -X POST https://sfo.cloud.appwrite.io/v1/storage/buckets/${BUCKET_ID}/files -H "X-Appwrite-Project: ${PROJECT_ID}" -H "X-Appwrite-Key: ${API_KEY}" -F "fileId=unique()" -F "file=@${filePath}"`;
                        const output = execSync(curlCmd).toString();
                        const res = JSON.parse(output);
                        imageId = res.$id;
                        console.log(`✅ Upload OK: ${imageId}`);
                    }
                }

                if (!imageId) {
                    imageId = 'https://placehold.co/600x400/1e1e1e/D4AF37?text=Em+Breve';
                }

                console.log(`📝 Criando produto: ${p.title}`);
                await databases.createDocument(DATABASE_ID, 'products', ID.unique(), {
                    sku: p.sku,
                    title: p.title,
                    description: p.description,
                    price: p.price,
                    category: p.category,
                    image: imageId,
                    uom: p.uom,
                    is_promotion: false,
                    promo_price: 0,
                    active: true,
                    manage_stock: true,
                    stock_quantity: 50,
                    allow_backorder: false,
                    disable_on_zero_stock: true
                });

            } catch (e) {
                console.error(`❌ Erro em ${p.title}:`, e.message);
            }
        }
        console.log('🚀 Base de dados populada com sucesso!');
    } catch (err) {
        console.error('Erro global:', err.message);
    }
}

populate();
