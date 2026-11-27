// Desenha a legenda (estilo meme) na imagem usando o próprio Chromium que o bot já abre.
// Vantagem: não precisa instalar nenhuma biblioteca de imagem, e acentos/emojis funcionam.
const { MessageMedia } = require('whatsapp-web.js');

/**
 * @param {import('puppeteer-core').Browser} browser  client.pupBrowser
 * @param {MessageMedia} media                        imagem original
 * @param {{top: string, bottom: string}} caption     textos de cima e de baixo
 * @returns {Promise<MessageMedia>}                   PNG 512x512 com a legenda
 */
async function addCaption(browser, media, caption) {
  const page = await browser.newPage(); // aba temporária, separada do WhatsApp Web
  try {
    const base64 = await page.evaluate(
      async (dataUrl, topText, bottomText) => {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Imagem inválida'));
          img.src = dataUrl;
        });

        const SIZE = 512;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext('2d');

        // Imagem inteira, centralizada, sobre fundo transparente
        const scale = Math.min(SIZE / img.width, SIZE / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);

        const MAX_WIDTH = SIZE - 40;
        const FONT = '"Impact", "Arial Black", "Segoe UI Emoji", sans-serif';

        function wrap(text, size) {
          ctx.font = size + 'px ' + FONT;
          const lines = [];
          let line = '';
          for (const word of text.split(' ')) {
            const test = line ? line + ' ' + word : word;
            if (!line || ctx.measureText(test).width <= MAX_WIDTH) {
              line = test;
            } else {
              lines.push(line);
              line = word;
            }
          }
          if (line) lines.push(line);
          return lines;
        }

        // Começa com letra grande e diminui até caber em até 3 linhas
        function layout(text) {
          for (let size = 64; size >= 22; size -= 4) {
            const lines = wrap(text, size);
            if (lines.length <= 3 && lines.every((l) => ctx.measureText(l).width <= MAX_WIDTH)) {
              return { size, lines };
            }
          }
          return { size: 22, lines: wrap(text, 22).slice(0, 3) };
        }

        function draw(text, where) {
          if (!text) return;
          const { size, lines } = layout(text.toUpperCase());
          ctx.font = size + 'px ' + FONT;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.lineJoin = 'round';
          ctx.lineWidth = Math.max(4, size / 6);
          ctx.strokeStyle = '#000000';
          ctx.fillStyle = '#ffffff';

          const lineHeight = size * 1.1;
          let y = where === 'top' ? 12 : SIZE - lines.length * lineHeight - 12;
          for (const line of lines) {
            ctx.strokeText(line, SIZE / 2, y);
            ctx.fillText(line, SIZE / 2, y);
            y += lineHeight;
          }
        }

        draw(topText, 'top');
        draw(bottomText, 'bottom');
        return canvas.toDataURL('image/png').split(',')[1];
      },
      `data:${media.mimetype};base64,${media.data}`,
      caption.top,
      caption.bottom
    );

    return new MessageMedia('image/png', base64, 'figurinha.png');
  } finally {
    await page.close().catch(() => {});
  }
}

module.exports = { addCaption };
