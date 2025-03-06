const fs = require('fs');
const https = require('https');

const API_KEY = "AIzaSyBi3kt0iSU5-aCC2jy0SfgKt_TE4cNLj9A"; // 🔴 PON AQUÍ TU NUEVA API KEY
const HISTORIAL_PATH = './conversationHistory.json';

// 📌 Verifica si el archivo de historial existe, si no, lo crea
if (!fs.existsSync(HISTORIAL_PATH)) {
    fs.writeFileSync(HISTORIAL_PATH, JSON.stringify({}));
}

module.exports = {
    name: "ia",
    alias: ["chatbot"],
    category: "ai",
    async run({ conn, msg }) {
        const sender = msg.sender;
        const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';

        // 📌 Verifica si el bot fue mencionado
        const mentioned = msg.quoted ? msg.quoted.sender : msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!mentioned.includes(botNumber)) return; 

        const query = msg.text.replace(new RegExp(`@${botNumber.split('@')[0]}`, 'g'), "").trim();
        if (!query) return msg.reply("Mencióname con un mensaje para responder. 🤖");

        conn.sendPresenceUpdate('composing', msg.from);

        // 📌 Carga el historial del usuario
        let conversationHistory = JSON.parse(fs.readFileSync(HISTORIAL_PATH, 'utf8'));
        if (!conversationHistory[sender]) {
            conversationHistory[sender] = [
                { role: 'system', content: "Eres un bot de WhatsApp llamado YotsubaBot. Responde de forma amigable." }
            ];
        }

        // 📌 Agrega la consulta del usuario al historial
        conversationHistory[sender].push({ role: 'user', content: query });

        // 📌 Prepara la solicitud a la API
        const requestData = JSON.stringify({ contents: [{ parts: [{ text: query }] }] });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        // 📌 Envia la solicitud a la API de Gemini
        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    const responseJson = JSON.parse(responseData);
                    const replyText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (replyText) {
                        conversationHistory[sender].push({ role: 'assistant', content: replyText });
                        fs.writeFileSync(HISTORIAL_PATH, JSON.stringify(conversationHistory, null, 2));
                        conn.sendMessage(msg.from, { text: replyText }, { quoted: msg });
                    } else {
                        msg.reply("La IA no envió una respuesta válida. 🛠️");
                    }
                } catch (error) {
                    msg.reply(`Error al procesar la respuesta 😖: ${error.message}`);
                }
            });
        });

        req.on('error', error => msg.reply(`Error de conexión con la IA 🤨: ${error.message}`));
        req.write(requestData);
        req.end();
    }
};
