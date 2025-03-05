import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
    if (!text) return m.reply('*⚠️ Debes ingresar una consulta para buscar imágenes.*');

    try {
        // Reacción mientras se procesa la petición
        await conn.sendMessage(m.chat, { react: { text: '⏱️', key: m.key } });

        // URL de la API PixAI
        const apiUrl = `https://api.dorratz.com/v2/pix-ai?prompt=${encodeURIComponent(text)}`;
        let response = await fetch(apiUrl);

        if (!response.ok) throw new Error(`Error en la red: ${response.status}`);

        let data = await response.json();
        if (!data.images || data.images.length === 0) return m.reply('*❌ No se encontraron imágenes.*');

        // Obtiene las imágenes y las envía en un álbum
        let images = data.images.map(url => ({ image: { url } }));

        // Envío de imágenes
        await conn.sendMessage(m.chat, { forward: images, caption: "🌙 Imagen generada por PixAI" }, { quoted: m });

    } catch (error) {
        console.error('Error:', error);
        m.reply('*❌ Error al obtener imágenes. Intenta de nuevo más tarde.*');
    }
};

// Configuración del comando
handler.command = /^(pixai)$/i;
export default handler;
