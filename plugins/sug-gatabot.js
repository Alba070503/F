import { webp2png } from '../lib/webp2mp4.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import axios from 'axios'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let suggestionQueue = {}
const MAX_VIDEO_SIZE_MB = 60 // Límite de 40MB X videos

// tiempo de espera según la reputación
const reputationTimes = [
{ reputation: 0, time: 4 * 60 * 60 * 1000 }, // 4 horas
{ reputation: 2, time: 3 * 60 * 60 * 1000 }, // 3 horas
{ reputation: 5, time: 2 * 60 * 60 * 1000 }, // 2 horas
{ reputation: 10, time: 30 * 60 * 1000 },    // 30 minutos
{ reputation: 15, time: 15 * 60 * 1000 },    // 15 minutos
{ reputation: 20, time: 10 * 60 * 1000 },    // 10 minutos
{ reputation: 25, time: 5 * 60 * 1000 },     // 5 minutos
{ reputation: 30, time: 1 * 60 * 1000 }      // 1 minuto
]

const ADMIN_ID = "120363186806088548@g.us"  
const CANAL_ID = "120363336642332098@newsletter"
const CANAL_LINK = "https://whatsapp.com/channel/0029VayNseN2phHUJygRvH3H"
const LEYENDA = `Este proceso es para enviar tú contenido al canal *GataBot Test*\n> Si deseas enviar tu contenido a otro canal usa el comando *#menu*`

let handler = async (m, { conn, text, usedPrefix, command }) => {
let who = m.mentionedJid && m.mentionedJid.length > 0 ? m.mentionedJid[0] : (m.fromMe ? conn.user.jid : m.sender)
let pp = await conn.profilePictureUrl(who, 'image').catch(_ => "https://telegra.ph/file/33bed21a0eaa789852c30.jpg")

if (!global.db.data.users[m.sender]) {
  global.db.data.users[m.sender] = {
    reputation: 0,
    suggetimme: 0
  };
}

let users = global.db.data.users[m.sender];

let waitTime = getWaitTime(users?.reputation || 0);
let time = (users?.suggetimme || 0) + waitTime;

if (new Date() - users.suggetimme < waitTime) {
return m.reply(`⚠️ *Ya has enviado una publicación.*\n\nPor favor, espera ${msToTime(time - new Date())} antes de enviar otra publicación.\n\nSi deseas reducir o eliminar el tiempo de espera, puedes mejorar tu reputación usando el comando *${usedPrefix}reputacion* ¡Tu reputación influye en tu tiempo de espera!\n\n${LEYENDA}`)
}

if (!text && !m.quoted) return m.reply(`*⚠️ Por favor, escribe tu contenido o envía un archivo multimedia.* 📝\n\n> *Elige una categoría de las siguientes opciones:*\n\n1. Reporte de comando\n2. Suggestion de comando\n3- ayudar\n\n> *Ejemplo:* ${usedPrefix + command} 1 Texto\n\n${LEYENDA}`)

let media = false
let q = m.quoted ? m.quoted : m
let mime = (q.msg || q).mimetype || ''
let url = ''

if (/image|video/.test(mime)) {
media = await q.download()

if (/video/.test(mime)) {
let videoPath = join(__dirname, `./temp_video_${new Date().getTime()}.mp4`)
fs.writeFileSync(videoPath, media)

let videoStats = fs.statSync(videoPath)
let videoSizeMB = videoStats.size / (1024 * 1024)

if (videoSizeMB > MAX_VIDEO_SIZE_MB) {
fs.unlinkSync(videoPath)
return m.reply(`*⚠️ El video excede el tamaño permitido (max 40 MB). Por favor, recórtalo, comprime o envía uno más ligero.*\n\n${LEYENDA}`)
}
url = videoPath
} else {
url = await uploadImage(media)
}} else if (/webp/.test(mime)) {
media = await q.download()
url = await webp2png(media)
}

let [categoryChoice, ...rest] = text.split(' ')
let suggestionText = rest.join(' ')
if (!suggestionText && !media) return m.reply(`⚠️ Por favor, agrega un texto o archivo multimedia después de seleccionar la categoría.\n*Ejemplo:*\n*${usedPrefix + command}* 1  El futuro no está escrito, ¡tú eres el autor!\n\n${LEYENDA}`)

let categories = {
  '1': 'Reporte de comando',
  '2': 'Suggestion de comando', 
  '3': 'ayudar'
}


let category = categories[categoryChoice]
if (!category) return m.reply(`*⚠️ Opción inválida.*\n\nPor favor, elige una categoría válida: 1, 2, 3 o 4. Revisa las opciones disponibles usando el comando *${usedPrefix + command}* antes de intentarlo nuevamente.\n\n${LEYENDA}`)

await m.reply(`✅ Tu mensaje ha sido enviada a los administradores para su revisión.\n
📌 *Proceso de revisión:*
- Si la revisión es exitosa, recibirás un mensaje positivo y lo solicitado será publicado en el canal.  
- Si la revisión no es exitosa, recibirás un mensaje negativo y, opcionalmente, los administradores podrán informarte la razón del rechazo.\n
🔄 *Si no es aprobada:* 
Puedes realizar una nueva solicitud sin recibir sanción. Sin embargo, si el contenido es vulgar u obsceno, es posible que pierdas el acceso a este servicio en el futuro.\n
> \`Tiempo estimado de la revisión de 5 min hasta 10 horas. Sea paciente por favor.\`\n\n${LEYENDA}`)


let groupMetadata = await conn.groupMetadata(ADMIN_ID)
let groupAdmins = groupMetadata.participants.filter(p => p.admin)

if (!groupAdmins || groupAdmins.length === 0) {
return 
}

let suggestionId = Math.floor(Math.random() * 901)
suggestionQueue[suggestionId] = { suggestionText, category, sender: m.sender, senderName: m.pushName, pp, suggestionId, url, mime }
global.db.data.users[m.sender].suggetimme = new Date * 1

let confirmMessage = `📢 El usuario @${m.sender.split('@')[0]} ha enviado un mensaje para su revisión.  

📝 *Categoría:* ${category.charAt(0).toUpperCase() + category.slice(1)}  
📄 *Contenido:* ${suggestionText || 'Sin texto'}  

🔍 *Opciones de revisión:*  
- Escribe *"si ${suggestionId}"* para aprobar la publicación.  
- Escribe *"no ${suggestionId} [motivo]"* para rechazarla indicando el motivo. (Motivo opcional).  

🔔 Si se rechaza en mensaje, el motivo será enviado de forma anónima al usuario que solicitó la revisión.  

📋 *Ejemplo de rechazo:*  
_"no ${suggestionId} Tu contenido contiene [motivo específico], por favor corrige y vuelve a solicitar una revisión."_  

> 📌 *ID de la publicación:* ${suggestionId}`


if (url) {
if (/image/.test(mime)) {
await conn.sendMessage(ADMIN_ID, { image: { url }, caption: confirmMessage, contextInfo:{ mentionedJid:[m.sender]}}, { quoted: m })
} else if (/video/.test(mime)) {
await conn.sendMessage(ADMIN_ID, { video: { url }, caption: confirmMessage, contextInfo:{ mentionedJid:[m.sender]}}, { quoted: m })        
}} else {
await conn.sendMessage(ADMIN_ID, {text: confirmMessage, mentions: [m.sender]}, {quoted: m })
}}

handler.before = async (response) => {
if (!response.text || !response.text.match(/^(si|no)\s*(\d+)?/i)) return

let groupMetadata = await conn.groupMetadata(ADMIN_ID)
let groupAdmins = groupMetadata.participants.filter(p => p.admin)
const isAdmin = groupAdmins.some(admin => admin.id === response.sender)
if (!isAdmin) return

let matches = response.text.match(/^(si|no)\s*(\d+)?/i)
let action = matches[1].toLowerCase()
let suggestionId = matches[2] 

let matches_motivo = response.text.match(/^(si|no)\s*(\d+)?\s*(.*)?/i)
let action_motivo = matches[1].toLowerCase()
let suggestionId_motivo = matches[2]
let reason_motivo = matches[3]?.trim() || "Los administradores no dejaron un motivo específico"

if (!suggestionId || !suggestionQueue[suggestionId]) {
return
}

const { suggestionText, category, sender, senderName, pp, url, mime } = suggestionQueue[suggestionId]

let users = global.db.data.users[response.sender];

if (action === 'no') {
if (users.reputation > 0) {
users.reputation -= 1
} else {
users.reputation = 0
}
await conn.sendMessage(ADMIN_ID, { react: { text: "❌", key: response.key } })
await conn.reply(sender, `⚠️ *Tu mensaje ha sido rechazada por los administradores.*\n\n📌 *Motivo del rechazo:* ${reason_motivo}\n\n_Si el motivo no es claro, te invitamos a enviar un nuevo mensaje o contenido_`, null, { mentions: [sender] })
delete suggestionQueue[suggestionId]
return
}

if (action === 'si') {
users.reputation += 1
await conn.sendMessage(ADMIN_ID, { react: { text: "✅", key: response.key } })
let approvedText = `👤 *Usuario:* ${senderName || 'Anónimo'}\n📝 *${category.charAt(0).toUpperCase() + category.slice(1)}:* ${suggestionText || 'Sin descripción'}`
let title, body

switch (category) {
case 'sugerencia':
case 'propuesta':
case 'opinión':
case 'feedback':
title = `【 🔔 ¡Nueva ${category.charAt(0).toUpperCase() + category.slice(1)}! 🔔 】`
body = `🌟 ¡Nueva ${category.charAt(0).toUpperCase() + category.slice(1)} enviada por un usuario! 🌟`
break

case 'error':
case 'queja':
case 'report':
case 'reporte':
title = `【 ⚠️ ¡Nueva queja o reporte de error! ⚠️ 】`
body = `🔧 ¡Un usuario ha enviado un reporte de error o queja! 🔧`
break

case 'Suggestion de comando':
title = `【 🆕 ¡Sugerencia de Comando! 🆕 】`
body = `💡 ¡Un usuario ha enviado una nueva sugerencia de comando! 💡`
break

case 'ayudar':
case 'soporte técnico':
title = `【 🛠️ ¡Solicitud de soporte técnico! 】`
body = `📞 ¡Un usuario necesita ayuda con soporte técnico!`
break

default:
title = `【 🔔 ¡Nuevo aporte! 🔔 】`;
body = `🌟 ¡Un usuario ha enviado un nuevo aporte! 🌟`
break
}

let options = { contextInfo: { externalAdReply: {
title: title, body: body,
thumbnailUrl: pp, 
sourceUrl: yt2,
mediaType: 1,
showAdAttribution: false,
renderLargerThumbnail: false
}}}

if (url && /image/.test(mime)) {
await conn.sendMessage(CANAL_ID, { image: { url }, caption: approvedText, contextInfo: options.contextInfo }, { quoted: null });
} else if (url && /video/.test(mime)) {
await conn.sendMessage(CANAL_ID, { video: { url }, caption: approvedText, contextInfo: options.contextInfo }, { quoted: null });
fs.unlinkSync(url)  
} else {
await conn.sendMessage(CANAL_ID, { text: approvedText, contextInfo: options.contextInfo }, { quoted: null })
}
await conn.reply(sender, `✅ *¡Tu mensaje ha sido aprobada por los administradores!* 🎉\n\n\`Puedes verla en el siguiente canal:\`\n${CANAL_LINK}\n\n¡Gracias por contribuir, sigue publicando es gratis! 🙌`)

delete suggestionQueue[suggestionId]
}}
handler.command = /^(suggatabot)$/i

export default handler

function msToTime(duration) {
let seconds = Math.floor((duration / 1000) % 60),
minutes = Math.floor((duration / (1000 * 60)) % 60),
hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

hours = hours > 0 ? `${hours} horas, ` : ''
minutes = minutes > 0 ? `${minutes} minutos, ` : ''
seconds = `${seconds} segundo(s)`

return `${hours}${minutes}`
}

function getWaitTime(reputation) {
let waitTime = reputationTimes.find(r => r.reputation >= reputation)
if (waitTime) {
return waitTime.time
} else if (reputation > 30) {
// Si la reputación es mayor a 30, asignar un tiempo de espera de 1 minuto
return 1 * 60 * 1000
} else {
// Si no hay coincidencia, asigna el tiempo (24 horas)
return 86400000 // 24 horas en milisegundos
}}
