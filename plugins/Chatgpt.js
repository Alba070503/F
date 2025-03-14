import axios from 'axios';

let handler = async (m, { conn, text }) => {
    const botNumber = conn.user.id.split(':')[0] + '@s.whatsapp.net';
    const mentioned = m.mentionedJid || [];

    // 📌 Verifica si el bot fue mencionado
    if (!mentioned.includes(botNumber)) return;

    if (!text) return m.reply(`❀ Ingresa un texto para hablar con ChatGPT.`);

    // ✅ Respuesta personalizada si preguntan por el creador
    if (text.toLowerCase().includes("quién es tu creador") || text.toLowerCase().includes("quien te creó")) {
        return m.reply("❀ Mi creador es Alba070503.");
    }

    try {
        let api = await axios.get(`https://api.agungny.my.id/api/chatgpt?q=${encodeURIComponent(text)}`);
        let json = api.data;

        if (json?.result) {
            m.reply(json.result);
        } else {
            m.reply("❀ No recibí una respuesta válida de ChatGPT.");
        }
    } catch (error) {
        console.error(error);
        m.reply("❀ Error al conectar con la API de ChatGPT.");
    }
};

handler.command = [];
handler.customPrefix = /@|@bot/;  // 📌 Activa solo si etiquetan al bot
handler.accepts = (m) => m.mentionedJid?.length > 0;

export default handler;
