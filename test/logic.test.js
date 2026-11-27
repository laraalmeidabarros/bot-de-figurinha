const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isStickerCommand,
  isHelpCommand,
  isConvertibleType,
  shouldConvertMedia,
  createCooldown,
} = require('../logic');

test('reconhece os comandos de figurinha', () => {
  assert.equal(isStickerCommand('!figurinha'), true);
  assert.equal(isStickerCommand('  !Sticker  '), true);
  assert.equal(isStickerCommand('!fig'), true);
  assert.equal(isStickerCommand('figurinha'), false);
  assert.equal(isStickerCommand('!figurinhas'), false);
  assert.equal(isStickerCommand(''), false);
  assert.equal(isStickerCommand(undefined), false);
});

test('reconhece o comando de ajuda', () => {
  assert.equal(isHelpCommand('!ajuda'), true);
  assert.equal(isHelpCommand('!HELP'), true);
  assert.equal(isHelpCommand('ajuda'), false);
});

test('só imagem e vídeo são convertidos (figurinha não, para evitar loop)', () => {
  assert.equal(isConvertibleType('image'), true);
  assert.equal(isConvertibleType('video'), true);
  assert.equal(isConvertibleType('sticker'), false);
  assert.equal(isConvertibleType('audio'), false);
  assert.equal(isConvertibleType('document'), false);
});

test('no privado, toda imagem vira figurinha', () => {
  assert.equal(shouldConvertMedia({ isGroup: false, type: 'image', body: '' }), true);
});

test('em grupo, só com o comando na legenda', () => {
  assert.equal(shouldConvertMedia({ isGroup: true, type: 'image', body: '' }), false);
  assert.equal(shouldConvertMedia({ isGroup: true, type: 'image', body: '!figurinha' }), true);
});

test('tipos não suportados nunca são convertidos', () => {
  assert.equal(shouldConvertMedia({ isGroup: false, type: 'sticker', body: '' }), false);
  assert.equal(shouldConvertMedia({ isGroup: false, type: 'audio', body: '!figurinha' }), false);
});

test('cooldown bloqueia pedidos muito seguidos da mesma pessoa', () => {
  const allow = createCooldown(3000);
  assert.equal(allow('ana', 1000), true);
  assert.equal(allow('ana', 2000), false); // 1s depois
  assert.equal(allow('bia', 2000), true); // outra pessoa
  assert.equal(allow('ana', 4500), true); // passou de 3s
});
