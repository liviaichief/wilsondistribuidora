const { Client, Databases, ID } = require('node-appwrite');

// Use frontend client (no API key) to simulate guest
const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27');

const databases = new Databases(client);

async function testGuest() {
    try {
        console.log("Fetching one product as guest...");
        const res = await databases.listDocuments('main_db', 'products', []);
        if (res.documents.length === 0) return console.log("no products");
        const product = res.documents[0];
        console.log("Product:", product.title, "Stock:", product.stock);

        console.log("Attempting to deduct stock by 1 as guest...");
        await databases.updateDocument('main_db', 'products', product.$id, {
            stock: (product.stock || 0) - 1
        });
        console.log("Success");
    } catch (e) {
        console.error("Guest Error:", e.message);
    }
}

testGuest();
