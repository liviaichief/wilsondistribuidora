const fs = require('fs');
const path = require('path');

const versionPath = path.join(__dirname, 'src', 'version.js');
const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

let newVersion = 'V1.0.0';

try {
    if (fs.existsSync(versionPath)) {
        const oldContent = fs.readFileSync(versionPath, 'utf8');
        // Regex mais flexível para capturar a versão
        const match = oldContent.match(/APP_VERSION\s*=\s*"V(\d+)\.(\d+)\.(\d+)"/);
        
        if (match) {
            const major = parseInt(match[1]);
            const minor = parseInt(match[2]);
            const patch = parseInt(match[3]);
            
            // Incrementa o patch (último dígito)
            newVersion = `V${major}.${minor}.${patch + 1}`;
        }
    }

    const versionContent = `export const APP_VERSION = "${newVersion}";\nexport const BUILD_DATE = "${now}";\n`;
    fs.writeFileSync(versionPath, versionContent);
    console.log(`\x1b[32m%s\x1b[0m`, `✓ Versão incrementada para: ${newVersion}`);
    console.log(`\x1b[34m%s\x1b[0m`, `  Data do Build: ${now}`);
} catch (err) {
    console.error('❌ Erro ao atualizar versão:', err);
    process.exit(1);
}
