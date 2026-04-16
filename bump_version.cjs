const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, 'src', 'version.js');
const now = new Date().toLocaleString('pt-BR');

let currentVersion = "V1.0.0";
try {
    const content = fs.readFileSync(versionPath, 'utf8');
    const match = content.match(/APP_VERSION = "(V\d+\.\d+\.)(\d+)"/);
    if (match) {
        const prefix = match[1];
        const patch = parseInt(match[2], 10);
        currentVersion = `${prefix}${patch + 1}`;
    } else {
        // Fallback se o formato estiver diferente
        currentVersion = "V1.0.1";
    }
} catch (e) {
    console.warn("Nao foi possivel ler a versao atual, resetando para V1.0.1");
    currentVersion = "V1.0.1";
}

const versionContent = `export const APP_VERSION = "${currentVersion}";\nexport const BUILD_DATE = "${now}";\n`;

try {
    fs.writeFileSync(versionPath, versionContent);
    console.log(`Versão atualizada para ${currentVersion}:`, now);
} catch (err) {
    console.error('Erro ao atualizar versão:', err);
    process.exit(1);
}
