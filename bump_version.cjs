const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, 'src', 'version.js');
const now = new Date().toLocaleString('pt-BR');

let newVersion = 'V1.0.1';

try {
    if (fs.existsSync(versionPath)) {
        const oldContent = fs.readFileSync(versionPath, 'utf8');
        const match = oldContent.match(/APP_VERSION\s*=\s*"V(\d+)\.(\d+)\.(\d+)"/);
        if (match) {
            const major = parseInt(match[1]);
            const minor = parseInt(match[2]);
            const patch = parseInt(match[3]);
            newVersion = `V${major}.${minor}.${patch + 1}`;
        }
    }

    const versionContent = `export const APP_VERSION = "${newVersion}";\nexport const BUILD_DATE = "${now}";\n`;
    fs.writeFileSync(versionPath, versionContent);
    console.log(`Versão atualizada para Produção: ${newVersion} (${now})`);
} catch (err) {
    console.error('Erro ao atualizar versão:', err);
    process.exit(1);
}
