
import fs from 'fs';

async function upload() {
    const bucketId = 'images_bucket';
    const projectId = '69d59db800358cca9f27';
    const apiKey = 'standard_dc313f0ead20b43da4c50584f76ea0316cba57d539fc7586bc7dd8cb8de5d9903afecaa10aa40ebb11b0a63f73706bc9e61c1132d3342b85a40651096b43b9d04fdd54a0bc55317ef9b516542d4c10e91505aaae2d909025c7c779e2dfd09a060cf2e2d69b27f88f85eeb188ea0ada1614ecf6e01f6fb0e8d6932f6f9b37d140';
    const endpoint = 'https://sfo.cloud.appwrite.io/v1/storage/buckets/images_bucket/files';

    async function doUpload(productId, filePath) {
        console.log(`Subindo ${filePath} para ${productId}...`);
        const stats = fs.statSync(filePath);
        const fileName = filePath.split('\\').pop();
        
        const formData = new FormData();
        formData.append('fileId', 'unique()');
        
        // No Node 20+, podemos usar Blob e File para o FormData do fetch nativo
        const buffer = fs.readFileSync(filePath);
        const blob = new Blob([buffer], { type: 'image/png' });
        formData.append('file', blob, fileName);

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'x-appwrite-project': projectId,
                'x-appwrite-key': apiKey
            },
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            console.log(`✅ Sucesso! File ID: ${data.$id}`);
            // Atualizar produto
            const updateRes = await fetch(`https://sfo.cloud.appwrite.io/v1/databases/main_db/collections/products/documents/${productId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-appwrite-project': projectId,
                    'x-appwrite-key': apiKey
                },
                body: JSON.stringify({ data: { image: data.$id } })
            });
            if (updateRes.ok) console.log(`🎉 Produto ${productId} atualizado!`);
            else console.log(`❌ Erro update product:`, await updateRes.text());
        } else {
            console.log(`❌ Erro upload:`, JSON.stringify(data));
        }
    }

    const productId = process.argv[2];
    const filePath = process.argv[3];
    if (productId && filePath) {
        await doUpload(productId, filePath);
    }
}

upload();
