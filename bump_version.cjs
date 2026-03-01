const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, 'src', 'version.js');

try {
    let content = fs.readFileSync(versionFile, 'utf8');

    // Extract current version
    const match = content.match(/V(\d+)\.(\d+)/);

    if (match) {
        let major = parseInt(match[1]);
        let minor = parseInt(match[2]);

        // Increment minor version
        minor++;

        // Format new version V0.01 -> V0.02
        const newVersion = `V${major}.${String(minor).padStart(2, '0')}`;

        // Formata data e hora para exibição no frontend (padrão Brasil)
        const buildDate = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

        const newContent = `export const APP_VERSION = "${newVersion}";\nexport const BUILD_DATE = "${buildDate}";\n`;

        fs.writeFileSync(versionFile, newContent);

        // Also write to public/version.json for client-side polling
        const publicVersionFile = path.join(__dirname, 'public', 'version.json');
        fs.writeFileSync(publicVersionFile, JSON.stringify({ version: newVersion, timestamp: new Date().toISOString() }));

        console.log(`Version bumped to ${newVersion} (Synced with public/version.json)`);
    } else {
        console.error('Could not find version pattern in src/version.js');
        process.exit(1);
    }
} catch (err) {
    console.error('Error updating version:', err);
    process.exit(1);
}
