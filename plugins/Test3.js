import { sticker } from '../lib/sticker.js';

const ADMIN_GROUP_ID = "120363382897286189@g.us"; // Grupo de administradores
const DESTINATION_GROUP_ID = "120363379254033969@g.us"; // Grupo destino

let handler = async (m, { conn, text }) => {
  try {
    // Verificar si el usuario es administrador en el grupo de STAFF
    let groupMetadata = await conn.groupMetadata(ADMIN_GROUP_ID);
    let groupAdmins = groupMetadata.participants.filter(p => p.admin);
    const isAdmin = groupAdmins.some(admin => admin.id === m.sender);
    
    if (!isAdmin) return m.reply('*❌ No tienes permiso para usar este comando.*');

    if (!text && !m.quoted) return m.reply('*⚠️ Ingresa un mensaje o archivo a enviar.*');

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || '';
    text = text || (m.quoted ? m.quoted.text : q.text) || q.caption || '';

    let media = null;
    if (/image|video|mp4|audio|webp/.test(mime)) {
      media = await q.download();
      if (!media) return m.reply('❌ Error al descargar el archivo.');
    }

    await m.reply('Enviando... ⏳ Si el contenido lleva multimedia, tomará tiempo.');

    let messageType = 'Texto';
    if (/webp/.test(mime) && media) {
      let sticker_ = await sticker(media, false, 'FicctBot', 'Powered @Alba070503');
      await conn.sendFile(DESTINATION_GROUP_ID, sticker_, 'sticker.webp', '', null);
      messageType = 'Sticker';
    } else if (/image/.test(mime) && media) {
      await conn.sendMessage(DESTINATION_GROUP_ID, { image: media, caption: text });
      messageType = 'Imagen';
    } else if (/video/.test(mime) && media) {
      await conn.sendMessage(DESTINATION_GROUP_ID, { video: media, caption: text });
      messageType = 'Video';
    } else if (/audio/.test(mime) && media) {
      await conn.sendMessage(DESTINATION_GROUP_ID, { audio: media, mimetype: 'audio/mp4', ptt: true });
      messageType = 'Audio';
    } else if (text) {
      await conn.sendMessage(DESTINATION_GROUP_ID, { text });
    } else {
      return m.reply('❌ No se pudo procesar el archivo o mensaje.');
    }

    let groupMessage = `*@${m.sender.split("@")[0]} ha enviado lo siguiente al grupo:*\n\n\`Tipo de mensaje:\` ${messageType}\n\`Texto:\` ${text || 'No se incluyó un mensaje de texto.'}`;
    await conn.sendMessage(ADMIN_GROUP_ID, { text: groupMessage, mentions: [m.sender] });

    await m.reply('✅ Mensaje enviado al grupo destino y notificado en el grupo de administradores.');
  } catch (e) {
    console.error('❌ Error:', e);
    m.reply('❌ Error al enviar el mensaje.');
  }
};

handler.command = /^(prueb)$/i;
export default handler;
