const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const databases = new Databases(client);

async function addStockAttrs() {
    const DB_ID = 'main_db';
    const COL_ID = 'products';
    
    try { await databases.createBooleanAttribute(DB_ID, COL_ID, 'allow_backorder', false, false); } catch(e){}
    try { await databases.createBooleanAttribute(DB_ID, COL_ID, 'hide_on_zero', false, false); } catch(e){}
    try { await databases.createBooleanAttribute(DB_ID, COL_ID, 'show_sold_out', false, false); } catch(e){}
    try { await databases.createBooleanAttribute(DB_ID, COL_ID, 'low_stock_enabled', false, false); } catch(e){}
    try { await databases.createFloatAttribute(DB_ID, COL_ID, 'low_stock_threshold', false); } catch(e){}
    console.log("Attributes requested.");
}
addStockAttrs();
