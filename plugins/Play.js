import fetch from 'node-fetch';

const handler = async (m, { conn, text, usedPrefix, command }) => {
    await conn.sendMessage(m.chat, { react: { text: `🎶`, key: m.key } });

    try {
        if (!text) return m.reply(`🎵 Escribe por favor el nombre de la canción :)...`);

        let play2 = await fetch(`https://carisys.online/api/pesquisas/youtube?query=${encodeURIComponent(text)}`)
            .then(res => res.json());

        if (!play2.resultado || !play2.resultado.url) return m.reply(`❌ No se encontró la canción.`);

        await conn.sendMessage(m.chat, {
            audio: { url: `https://carisys.online/api/downloads/youtube/mp3-2?url=${play2.resultado.url}` },
            fileName: `${play2.resultado.titulo}.mpeg`,
            mimetype: "audio/mpeg",
            contextInfo: {
                externalAdReply: {
                    title: play2.resultado.titulo,
                    body: `𝐏.𝐀. 𝐙𝐢𝐧 𝐖𝐞𝐛`,
                    mediaType: 1,
                    reviewType: "PHOTO",
                    thumbnailUrl: play2.resultado.imagem,
                    showAdAttribution: true,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });
    } catch (error) {
        console.error(error);
        return m.reply(`❌ Hubo un pequeño error al procesar la solicitud.`);
    }
};

handler.command = ['playrandom'];
export default handler;
