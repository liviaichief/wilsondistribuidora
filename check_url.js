import { Client, Storage } from 'node-appwrite';
const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('698e695d001d446b21d9');
const storage = new Storage(client);
const url = storage.getFilePreview(
    'product-images',
    '6998fadc001199b1f494',
    800,
    800,
    'center',
    90
).toString();
console.log(url);
