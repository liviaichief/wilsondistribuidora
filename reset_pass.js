import { Client, Users } from 'node-appwrite';

const client = new Client()
    .setEndpoint('https://sfo.cloud.appwrite.io/v1')
    .setProject('69ebf93f000372e879ff')
    .setKey('standard_06684859eef23fe37b1b2b5e69fba753f7637355c69fe55c029cd878bcc2ef835e1deb4b4f9fed425e938d81245cec097cffe9e3bd18692f28b3434cc5b73edc3b10dd447f75aec2c4f381bce89c56688ad8bed3bdaac0c0ec1876722e6259578a3a99aeb3802544082dd77cf6f438eedd16ee5a0a95e4b863cad153f5471e46');

const users = new Users(client);

async function resetPassword() {
    try {
        const list = await users.list();
        const admin = list.users.find(u => u.email === 'admin@wilsondistribuidora.com.br');
        if (admin) {
            await users.updatePassword(admin.$id, 'admin@wilson2026');
            console.log('✅ Senha redefinida com sucesso para: admin@wilson2026');
        } else {
            console.log('❌ Usuário admin@wilsondistribuidora.com.br não encontrado.');
        }
    } catch (e) {
        console.error('❌ Erro:', e.message);
    }
}

resetPassword();
