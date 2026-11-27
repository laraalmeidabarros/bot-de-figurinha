// Regras do bot, sem depender do WhatsApp (por isso são fáceis de testar).

const STICKER_CMD = /^!(figurinha|sticker|fig)\b/i;
const STICKER_CMD_WITH_ARGS = /^!(?:figurinha|sticker|fig)\b\s*([\s\S]*)$/i;
const HELP_CMD = /^!(ajuda|help|menu)\b/i;
// Mensagem que é só uma saudação (ou "menu"): "oi", "olá", "bom dia", "menu"...
const GREETING = /^(oi+|ol[aá]|oie|e a[ií]|bom dia|boa tarde|boa noite|menu|in[ií]cio)[\s!.,?]*$/i;

// 'video' inclui GIFs. Figurinhas ('sticker') ficam de fora para o bot não entrar em loop.
const CONVERTIBLE_TYPES = new Set(['image', 'video']);

const MAX_CAPTION_PART = 80;

const isStickerCommand = (text = '') => STICKER_CMD.test(text.trim());
const isHelpCommand = (text = '') => HELP_CMD.test(text.trim());
const isGreeting = (text = '') => GREETING.test(text.trim());
const isConvertibleType = (type) => CONVERTIBLE_TYPES.has(type);

// "!figurinha bom dia" -> "bom dia"
function getStickerArgs(text = '') {
  const match = text.trim().match(STICKER_CMD_WITH_ARGS);
  return match ? match[1].trim() : '';
}

// "texto de cima | texto de baixo" -> { top, bottom }
// Só um texto (sem "|") fica embaixo, como nos memes. Sem texto -> null.
function parseCaption(raw = '') {
  const clean = raw.replace(/\s+/g, ' ').trim();
  if (!clean) return null;

  const parts = clean.split('|');
  const cut = (value) => value.trim().slice(0, MAX_CAPTION_PART);

  if (parts.length === 1) return { top: '', bottom: cut(parts[0]) };

  const top = cut(parts[0]);
  const bottom = cut(parts.slice(1).join('|'));
  if (!top && !bottom) return null;
  return { top, bottom };
}

// Conversa privada: toda imagem/vídeo vira figurinha.
// Grupo: só quando a legenda tem o comando (evita o bot responder tudo).
function shouldConvertMedia({ isGroup, type, body }) {
  if (!isConvertibleType(type)) return false;
  return !isGroup || isStickerCommand(body);
}

// Limita 1 pedido a cada `ms` por pessoa. Retorna true se pode prosseguir.
function createCooldown(ms) {
  const last = new Map();
  return (key, now = Date.now()) => {
    const previous = last.get(key);
    if (previous !== undefined && now - previous < ms) return false;
    last.set(key, now);
    return true;
  };
}

module.exports = {
  isStickerCommand,
  isHelpCommand,
  isGreeting,
  isConvertibleType,
  getStickerArgs,
  parseCaption,
  shouldConvertMedia,
  createCooldown,
};
