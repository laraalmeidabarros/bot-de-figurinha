# 🎨 Bot de Figurinhas para WhatsApp

Bot em Node.js que transforma imagens, GIFs e vídeos curtos em figurinhas do WhatsApp. Você manda a imagem, ele devolve a figurinha.

## Funcionalidades
- 📷 No privado: qualquer imagem/GIF/vídeo vira figurinha automaticamente
- 👥 Em grupos: só responde quando a legenda tem `!figurinha` (ou quando você responde a uma imagem com o comando)
- ⏳ Limite de 1 pedido a cada 3 segundos por pessoa (anti-spam)
- 🏷️ Nome e autor personalizáveis na figurinha
- ✅ Testes automatizados (`node --test`) + GitHub Actions

## Tecnologias
Node.js 18+, [whatsapp-web.js](https://wwebjs.dev/), qrcode-terminal

## ⚠️ Aviso importante
O `whatsapp-web.js` **não é uma biblioteca oficial** do WhatsApp. Ele controla o WhatsApp Web por trás dos panos, e o WhatsApp não permite automações não oficiais: existe risco de a conta ser **banida**. Por isso:
- Use um número secundário, não o seu principal
- Não use para enviar mensagens em massa nem para spam
- Este projeto é para **estudo**

Para uso profissional, o caminho correto é a [API oficial do WhatsApp Business (Cloud API)](https://developers.facebook.com/docs/whatsapp/cloud-api).

## Como rodar
```bash
npm install
npm start
```
A primeira instalação baixa o Chromium (~150 MB), então pode demorar.

1. Um QR Code aparece no terminal
2. No celular: **WhatsApp → Aparelhos conectados → Conectar um aparelho** e escaneie
3. Quando aparecer `Bot pronto!`, mande uma imagem para o número do bot

Para testar sozinha, mande uma imagem na conversa com **você mesma** ("Mensagem para mim mesma").

> 🔒 A pasta `.wwebjs_auth/` guarda a sessão do WhatsApp. Quem tiver essa pasta acessa a conta. Ela já está no `.gitignore`, nunca a suba para o GitHub.

## Personalização (opcional)
```bash
# Windows (PowerShell)
$env:STICKER_AUTHOR="Seu Nome"; npm start

# Mac/Linux
STICKER_AUTHOR="Seu Nome" npm start
```

## Comandos
| Comando | O que faz |
|---|---|
| imagem/vídeo no privado | Vira figurinha |
| `!figurinha` (ou `!sticker`, `!fig`) | Em grupos: converte a imagem da legenda ou da mensagem respondida |
| `!ajuda` | Mostra a ajuda |

## Testes
```bash
npm test
```

## Estrutura
```
index.js        # conexão com o WhatsApp e tratamento das mensagens
logic.js        # regras do bot (comandos, cooldown), fáceis de testar
test/           # testes automatizados
```

## Ideias para evoluir
- Texto vira figurinha (`!texto Olá`)
- Figurinha vira imagem (`!imagem`)
- Remover o fundo da imagem automaticamente
- Estatísticas de uso salvas em SQLite
- Migrar para a API oficial (Cloud API)
