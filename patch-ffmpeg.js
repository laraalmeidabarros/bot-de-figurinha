// Corrige a incompatibilidade entre o whatsapp-web.js e versões novas do ffmpeg:
// a opção "-vsync" foi removida do ffmpeg e substituída por "-fps_mode".
// Roda sozinho depois do "npm install" (postinstall) e nunca derruba a instalação.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'node_modules', 'whatsapp-web.js', 'src', 'util', 'Util.js');

try {
  if (!fs.existsSync(file)) {
    console.log('[patch] Util.js do whatsapp-web.js não encontrado; nada a fazer.');
    process.exit(0);
  }

  const original = fs.readFileSync(file, 'utf8');
  const patched = original
    .replace(/(['"])-vsync\1\s*,\s*(['"])0\2/g, "'-fps_mode', 'passthrough'")
    .replace(/(['"])-vsync\s+0\1/g, "'-fps_mode', 'passthrough'");

  if (patched !== original) {
    fs.writeFileSync(file, patched);
    console.log("[patch] '-vsync' trocado por '-fps_mode' ✅ (GIFs e vídeos)");
  } else if (original.includes('vsync')) {
    console.log('[patch] encontrei "vsync" em um formato inesperado; nada foi alterado.');
  } else {
    console.log('[patch] nada a corrigir (já aplicado ou não necessário).');
  }
} catch (err) {
  console.log('[patch] não foi possível aplicar:', err.message);
}
