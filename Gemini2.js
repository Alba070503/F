const fs = require('fs');
const https = require('https');

module.exports = {
  name: "ia",
  alias: ["ai", "chatgpt"],
  category: "ai",
  use: "@bot <mensaje>",
  example: "@bot ¿Cómo estás?",
  cooldown: 3,
  isSpam: true,

  async run({ conn, msg }) {
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const sender = msg.key.participant || msg.key.remoteJid;
    const path = './conversationHistory.json';

    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, JSON.stringify({}));
    }

    let conversationHistory = JSON.parse(fs.readFileSync(path, 'utf8'));

    // Verifica si fue etiquetado o si es un mensaje privado
    const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const isMentioned = mentionedJid.includes(botNumber);
    const isPrivateChat = msg.key.remoteJid === sender;

    if (!isMentioned && !isPrivateChat) return;

    let txt = msg.body.replace(new RegExp(`@${botNumber.split('@')[0]}`, 'g'), '').trim();
    if (!txt) return msg.reply('Debes escribir algo para que la IA responda.');

    conn.sendPresenceUpdate('composing', msg.from);
    conn.readMessages([msg.key]);

    if (!conversationHistory[sender]) {
      conversationHistory[sender] = [
        { role: 'system', content: `Eres un asistente de WhatsApp llamado FicctBot, creado por Alba070503 Dev. Responde de manera amigable.` }
      ];
    }

    conversationHistory[sender].push({ role: 'user', content: txt });

    let conversationText = conversationHistory[sender]
      .map(msg => (msg.role === 'user' ? `Usuario: ${msg.content}` : `IA: ${msg.content}`))
      .join("\n\n");

    const data = JSON.stringify({
      contents: [{ parts: [{ text: conversationText }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: '/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBi3kt0iSU5-aCC2jy0SfgKt_TE4cNLj9A',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const responseJson = JSON.parse(responseData);
          const replyText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (replyText) {
            conversationHistory[sender].push({ role: 'assistant', content: replyText });
            fs.writeFileSync(path, JSON.stringify(conversationHistory, null, 2));
            conn.sendMessage(msg.from, { text: replyText }, { quoted: msg });
          } else {
            msg.reply("La IA no respondió correctamente.");
          }
        } catch (error) {
          msg.reply(`Error en la respuesta: ${error.message}`);
        }
      });
    });

    req.on('error', (error) => {
      msg.reply(`Error de conexión con la IA: ${error.message}`);
    });

    req.write(data);
    req.end();
  }
};
