import axios from 'axios';

export async function before(m, { conn }) {
    let chat = global.db.data.chats[m.chat];

    // Verificar si el bot fue mencionado
    if (!m.mentionedJid.includes(conn.user.jid)) return;
    if (!chat.autorespond) return;

    let query = m.text.toLowerCase();
    
    // ✅ Respuesta personalizada si preguntan por el creador
    if (query.includes("quién es tu creador") || query.includes("quien te creó")) {
        return m.reply("❀ Mi creador es Alba070503.");
    }

    await conn.sendPresenceUpdate('composing', m.chat);

    try {
        let api = await axios.get(`https://api.agungny.my.id/api/chatgpt?q=${query}`);
        let json = api.data;
        if (json.result) {
            await conn.reply(m.chat, json.result, m);
        } else {
            await conn.reply(m.chat, "❀ Lo siento, no entendí la pregunta.", m);
        }
    } catch (error) {
        console.error(error);
        await conn.reply(m.chat, "❀ Ocurrió un error al procesar tu solicitud.", m);
    }
}
