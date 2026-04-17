const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69d59db800358cca9f27')
    .setKey('standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140');

const databases = new Databases(client);

async function testDeduction() {
    try {
        console.log("Fetching one product...");
        const res = await databases.listDocuments('main_db', 'products', []);
        if (res.documents.length === 0) return console.log("no products");
        const product = res.documents[0];
        console.log("Product:", product.title, "Stock:", product.stock);

        if (product.stock !== null) {
            console.log("Attempting to deduct stock by 1...");
            await databases.updateDocument('main_db', 'products', product.$id, {
                stock: product.stock - 1
            });
            console.log("Success");
        } else {
            console.log("Stock is null. Please set stock first.");
            // Set stock to 10 for testing
            await databases.updateDocument('main_db', 'products', product.$id, {
                stock: 10
            });
            console.log("Set stock to 10 for testing.");
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testDeduction();
