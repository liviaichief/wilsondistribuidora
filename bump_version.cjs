const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, 'src', 'version.js');
const now = new Date().toLocaleString('pt-BR');

// Mantemos V1.0.0 para "zerar" as versões conforme solicitado
const versionContent = `export const APP_VERSION = "V1.0.0";\nexport const BUILD_DATE = "${now}";\n`;

try {
    fs.writeFileSync(versionPath, versionContent);
    console.log('Versão atualizada para Produção:', now);
} catch (err) {
    console.error('Erro ao atualizar versão:', err);
    process.exit(1);
}
