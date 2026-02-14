
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log('URL Length:', url ? url.length : 0);
console.log('URL First Char:', url ? url[0] : 'N/A');
console.log('URL Last Char:', url ? url[url.length - 1] : 'N/A');
console.log('URL contains quotes?', url && (url.includes('"') || url.includes("'")));

console.log('Key Length:', key ? key.length : 0);
console.log('Key First Char:', key ? key[0] : 'N/A');
