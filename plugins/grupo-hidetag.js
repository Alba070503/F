import {generateWAMessageFromContent} from '@whiskeysockets/baileys'
import * as fs from 'fs';
const handler = async (m, {conn, text, participants, isOwner, isAdmin, args}) => {
const q = m.quoted ? m.quoted : m || m.text || m.sender
if (q.mtype == 'extendedTextMessage') {
if (args.length >= 1) {
text = args.slice(0).join(" ")
} else if (m.quoted && m.quoted.text) {
text = m.quoted.text
} else {
text = "📣 Anuncio"
} 
const users = participants.map((u) => conn.decodeJid(u.id))
await conn.sendMessage(m.chat, { text: text, mentions: users }, { quoted: m }) 
//const q = m.quoted ? m.quoted : m || m.text || m.sender
//const c = m.quoted ? await m.getQuotedObj() : m.msg || m.text || m.sender
//const msg = conn.cMod(m.chat, generateWAMessageFromContent(m.chat, {[m.quoted ? q.mtype : 'extendedTextMessage']: m.quoted ? c.message[q.mtype] : {text: '' || c}}, {quoted: m, userJid: conn.user.id}), text || q.text, conn.user.jid, {mentions: users})
//await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
} else {

// [ By @NeKosmic || https://github.com/NeKosmic/ ]

const users = participants.map((u) => conn.decodeJid(u.id))
const quoted = m.quoted ? m.quoted : m
const mime = (quoted.msg || quoted).mimetype || ''
const isMedia = /image|video|sticker|audio/.test(mime)
const more = String.fromCharCode(8206)
const masss = more.repeat(850)
const htextos = m.quoted && m.quoted.text ? m.quoted.text : m.text ? m.text : text ? text : '📣📣📣'
if ((isMedia && quoted.mtype === 'imageMessage') && htextos) {
var mediax = await quoted.download?.()
conn.sendMessage(m.chat, { image: mediax, mentions: users, caption: htextos, mentions: users}, {quoted: m})
} else if ((isMedia && quoted.mtype === 'videoMessage') && htextos) {
var mediax = await quoted.download?.()
conn.sendMessage(m.chat, { video: mediax, mentions: users, mimetype: 'video/mp4', caption: htextos}, {quoted: m})
} else if ((isMedia && quoted.mtype === 'audioMessage') && htextos) {
var mediax = await quoted.download?.();
conn.sendMessage(m.chat, {audio: mediax, mentions: users, mimetype: 'audio/mpeg', fileName: `Hidetag.mp3`}, {quoted: m})
} else if ((isMedia && quoted.mtype === 'stickerMessage') && htextos) {
var mediax = await quoted.download?.();
conn.sendMessage(m.chat, {sticker: mediax, mentions: users}, {quoted: m})
} else {
await conn.relayMessage(m.chat, { extendedTextMessage: {text: `${htextos}`, ...{contextInfo: {mentionedJid: users, externalAdReply: { thumbnailUrl: img, sourceUrl: md}}}}}, {});
}}
}
handler.command = /^(hidetag|notificar|notify)$/i
handler.group = true
handler.admin = true
export default handler
