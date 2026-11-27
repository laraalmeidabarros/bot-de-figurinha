const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const {
  isStickerCommand,
  isHelpCommand,
  isGreeting,
  isConvertibleType,
  getStickerArgs,
  parseCaption,
  shouldConvertMedia,
  createCooldown,
} = require('./logic');
const { addCaption } = require('./caption');

// Nome e autor que aparecem embaixo da figurinha. Por padrão ficam em branco.
// Para colocar texto: STICKER_NAME="Meu nome" STICKER_AUTHOR="Meu autor" npm start
const STICKER_NAME = process.env.STICKER_NAME ?? '';
const STICKER_AUTHOR = process.env.STICKER_AUTHOR ?? '';
// Um espaço em vez de texto vazio: se ficasse vazio, a biblioteca poderia usar um nome padrão.
const blankIfEmpty = (value) => (value && value.trim() ? value : ' ');
const COOLDOWN_MS = 3000;

const HELP_TEXT = `🤖 *Bot de Figurinhas* — Menu

📷 *Criar figurinha*
No privado: mande uma imagem, GIF ou vídeo curto e eu devolvo como figurinha.

✏️ *Figurinha com legenda* (só imagens)
Envie a imagem com a legenda:
*!figurinha seu texto aqui*
Para texto em cima e embaixo, separe com |
*!figurinha texto de cima | texto de baixo*

👥 *Em grupos*
Envie a imagem com a legenda *!figurinha*, ou responda a uma imagem com *!figurinha*. O texto da legenda também funciona.

📋 *Comandos*
*!figurinha* (ou !sticker, !fig) — cria a figurinha
*!menu* (ou !ajuda) — mostra este menu

💡 Dica: vídeos e GIFs funcionam melhor com até 6 segundos.`;

const allowRequest = createCooldown(COOLDOWN_MS);

const client = new Client({
  authStrategy: new LocalAuth(), // guarda a sessão em .wwebjs_auth (não precisa escanear o QR toda vez)
  puppeteer: {
    // Para ver o navegador abrindo (útil para achar problemas): HEADLESS=false npm start
    headless: process.env.HEADLESS !== 'false',
    protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

client.on('qr', (qr) => {
  console.log('\nEscaneie o QR Code com o WhatsApp:');
  console.log('WhatsApp > Aparelhos conectados > Conectar um aparelho\n');
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => console.log('Autenticado ✅'));
client.on('auth_failure', (msg) => console.error('Falha na autenticação:', msg));
client.on('ready', () => console.log('Bot pronto! Mande uma imagem para o número.'));
client.on('disconnected', (reason) => console.log('Desconectado:', reason));

async function handleMessage(msg) {
  // Mensagens enviadas por mim só valem na conversa comigo mesma (útil para testar).
  // Sem isso, o bot responderia a toda foto que eu mandasse para outras pessoas.
  if (msg.fromMe && msg.to !== msg.from) return;
  if (msg.isStatus) return;

  const chat = await msg.getChat();
  const body = msg.body || '';

  // Menu: pelo comando (!menu, !ajuda) ou, no privado, ao mandar só "oi", "olá", "menu"...
  const wantsMenu =
    isHelpCommand(body) || (!chat.isGroup && !msg.hasMedia && isGreeting(body));
  if (wantsMenu) {
    await msg.reply(HELP_TEXT);
    return;
  }

  // Descobre de qual mensagem sai a mídia
  let target = null;
  if (msg.hasMedia && shouldConvertMedia({ isGroup: chat.isGroup, type: msg.type, body })) {
    target = msg;
  } else if (msg.hasQuotedMsg && isStickerCommand(body)) {
    const quoted = await msg.getQuotedMessage();
    if (quoted.hasMedia && isConvertibleType(quoted.type)) target = quoted;
  }

  if (!target) {
    if (isStickerCommand(body)) {
      await msg.reply(
        '📎 Envie uma imagem ou vídeo curto com a legenda *!figurinha*, ou responda a uma imagem com *!figurinha*.'
      );
    }
    return;
  }

  // Texto da legenda: "!figurinha texto" ou "!figurinha cima | baixo"
  const caption = isStickerCommand(body) ? parseCaption(getStickerArgs(body)) : null;

  if (caption && target.type !== 'image') {
    await msg.reply('✏️ A legenda só funciona em imagens. Para vídeos e GIFs, use só *!figurinha*.');
    return;
  }

  if (!allowRequest(msg.author || msg.from)) {
    await msg.reply('⏳ Calma! Espere alguns segundos antes de pedir outra figurinha.');
    return;
  }

  try {
    await chat.sendStateTyping();
    let media = await target.downloadMedia();
    if (!media) throw new Error('Não foi possível baixar a mídia');

    if (caption) {
      media = await addCaption(client.pupBrowser, media, caption);
    }

    await chat.sendMessage(media, {
      sendMediaAsSticker: true,
      stickerName: blankIfEmpty(STICKER_NAME),
      stickerAuthor: blankIfEmpty(STICKER_AUTHOR),
    });
  } catch (err) {
    console.error('Erro ao criar figurinha:', err);
    await msg.reply(
      '😕 Não consegui criar a figurinha. Tente outra imagem ou um vídeo mais curto (até ~6 segundos).'
    );
  } finally {
    await chat.clearState().catch(() => {});
  }
}

client.on('message_create', (msg) => {
  handleMessage(msg).catch((err) => console.error('Erro inesperado:', err));
});

client.initialize();
