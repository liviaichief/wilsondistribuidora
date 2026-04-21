import { Client, Databases } from 'node-appwrite';

const ENDPOINT = 'https://sfo.cloud.appwrite.io/v1';
const PROJECT_ID = '69d59db800358cca9f27';
const API_KEY = 'standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

async function run() {
    console.log("Configurando atributos de estoque...");
    try { await databases.createBooleanAttribute('main_db', 'products', 'manage_stock', false, false); console.log('+ attr: manage_stock'); } catch (e) { if(e.code!==409) console.log(e); }
    try { await databases.createIntegerAttribute('main_db', 'products', 'stock_quantity', false, -1000000, 1000000, 0); console.log('+ attr: stock_quantity'); } catch (e) { if(e.code!==409) console.log(e); }
    try { await databases.createBooleanAttribute('main_db', 'products', 'allow_backorder', false, false); console.log('+ attr: allow_backorder'); } catch (e) { if(e.code!==409) console.log(e); }
    try { await databases.createBooleanAttribute('main_db', 'products', 'disable_on_zero_stock', false, false); console.log('+ attr: disable_on_zero_stock'); } catch (e) { if(e.code!==409) console.log(e); }
    
    console.log("Processo finalizado.");
}
run();
