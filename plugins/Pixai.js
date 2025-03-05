import fetch from 'node-fetch';
import baileys from '@whiskeysockets/baileys';

let handler = async (m, { conn, text }) => {
    if (!text) return m.reply('*⚠️ Debes ingresar una consulta para buscar imágenes.*');

    try {
        // Reacciona al mensaje
        await conn.sendMessage(m.chat, { react: { text: '⏱️', key: m.key } });

        // API de PixAI
        const apiUrl = `https://api.dorratz.com/v2/pix-ai?prompt=${encodeURIComponent(text)}`;
        let response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error(`Error en la red: ${response.status}`);

        let data = await response.json();
        if (!data.images || data.images.length === 0) return m.reply('*❌ No se encontraron imágenes.*');

        // Prepara las imágenes para enviarlas en un álbum
        let medias = data.images.map(url => ({ type: "image", data: { url } }));
        let caption = "🌙 Imagen generada por PixAI";

        // Enviar las imágenes en un álbum
        await sendAlbumMessage(conn, m.chat, medias, { caption, quoted: m });

    } catch (error) {
        console.error('Error:', error);
        m.reply('*❌ Error al obtener imágenes. Intenta de nuevo más tarde.*');
    }
};

// Función para enviar álbum de imágenes
async function sendAlbumMessage(conn, jid, medias, options) {
    if (medias.length < 2) throw new Error("Se necesitan al menos 2 imágenes para enviar un álbum.");

    let caption = options.caption || "";
    let album = baileys.generateWAMessageFromContent(
        jid,
        { albumMessage: { expectedImageCount: medias.length } },
        {}
    );

    await conn.relayMessage(jid, album.message, { messageId: album.key.id });

    for (let i in medias) {
        let { type, data } = medias[i];
        let msg = await baileys.generateWAMessage(jid, { [type]: data, ...(i == 0 ? { caption } : {}) }, { upload: conn.waUploadToServer });
        msg.message.messageContextInfo = { messageAssociation: { associationType: 1, parentMessageKey: album.key } };
        await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
        await baileys.delay(500);
    }

    return album;
}

// Configuración del comando
handler.command = /^(pixai)$/i;
export default handler;
