case 'playrandom': {
  await conn.sendMessage(m.chat, { react: { text: `🎶`, key: m.key }});
  
  try {
    if (!q) return m.reply(`${SetEmoji[userSender] || SetEmoji.default} Escribe por favor el nombre de la canción :)...`);

    let play2 = await fetchJson(`https://carisys.online/api/pesquisas/youtube?query=${encodeURIComponent(q)}`);
    
    await conn.sendMessage(from, {
      audio: {
        url: `https://carisys.online/api/downloads/youtube/mp3-2?url=${play2.resultado.url}`
      },
      fileName: play2.resultado.titulo + '.mpeg',
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
    console.log(error);
    return m.reply(`${SetEmoji[userSender] || SetEmoji.default} Hubo un pequeño error :(...`);
  }
  break;
}
