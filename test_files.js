import { Client, Storage } from 'node-appwrite';
import https from 'https';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('698e695d001d446b21d9')
    .setKey('standard_b6cd42bf7c58b5449ecb614ace3be50ab1f5c21900cfe1d83fe521b6aa848d2a7c625c58a64bc770b3612e62e2940df27df51671ff287184ed374b60f75b177f06d6a64b6e391e047e8590ce7ebc91c7a77c8b244a5c9135c67028f55f240ccdaf4528634410fdd34fad22baaaeeddd7097a877dbb250c73aa538ade05c7d0b1');

const storage = new Storage(client);

async function testFiles() {
    const list = await storage.listFiles('product-images');
    console.log("Total files:", list.total);
    const filesToTest = [list.files[0].$id, '6998fadc001199b1f494'];

    for (const f of filesToTest) {
        const url = `https://sfo.cloud.appwrite.io/v1/storage/buckets/product-images/files/${f}/preview?project=698e695d001d446b21d9`;
        https.get(url, (res) => {
            console.log(`File ${f} -> Status Code:`, res.statusCode);
        }).on('error', (e) => {
            console.error(`File ${f} Error:`, e.message);
        });
    }
}
testFiles();
