/*
CODE IA PAPI 🤓
LA IA MANTIENE LA CONVERSACIÓN CON EL USUARIO 
ECHO POR EliasarYT 👾
CANAL "https://whatsapp.com/channel/0029VadxAUkKLaHjPfS1vP36"
API RICA "https://eliasar-yt-api.vercel.app"
*/
case 'ia': {
const fs = require('fs');
const https = require('https');
const sender = m.key.fromMe ? (conn.user.id.split(':')[0] + '@s.whatsapp.net' || conn.user.id) : (m.key.participant || m.key.remoteJid);
const botNumber = await conn.decodeJid(conn.user.id);
const senderNumber = sender.split('@')[0];
const path = './conversationHistory.json';

if (!fs.existsSync(path)) {
fs.writeFileSync(path, JSON.stringify({}));
}

let args = m.text.split(/\s+/).slice(1);
let txt = args.join(" ").trim();

if (!txt) {
m.reply('Por favor, proporciona un texto para enviar a la IA 😑.');
return;
}

conn.sendPresenceUpdate('composing', m.chat);
conn.readMessages([m.key]);

let conversationHistory = JSON.parse(fs.readFileSync(path, 'utf8'));

if (!conversationHistory[sender]) {
conversationHistory[sender] = [
{ role: 'system', content: 
`Actúa como un bot de WhatsApp. Te llamas ansi-BOT-MD, un modelo de lenguaje natural avanzado. Responderás de manera amigable a los usuarios. Tu creador es EliasarYT (o en GitHub como Eliasar54), y mi nombre es ${pushname}.` }
];
}

conversationHistory[sender].push({ role: 'user', content: txt });

let conversationText = conversationHistory[sender].map(msg => 
msg.role === 'system' ? `Sistema: ${msg.content}\n\n`
: msg.role === 'user' ? `Usuario: ${msg.content}\n\n`
: `${msg.content}\n\n`
).join('');

const data = JSON.stringify({
contents: [{ parts: [{ text: conversationText }] }]
});

const options = {
hostname: 'generativelanguage.googleapis.com',
path: '/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBi3kt0iSU5-aCC2jy0SfgKt_TE4cNLj9A',
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Content-Length': Buffer.byteLength(data)
}
};

const req = https.request(options, (res) => {
let responseData = '';

res.on('data', (chunk) => {
responseData += chunk;
});

res.on('end', () => {
try {
const responseJson = JSON.parse(responseData);
const replyText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;

if (replyText) {
conversationHistory[sender].push({ role: 'assistant', content: replyText });
fs.writeFileSync(path, JSON.stringify(conversationHistory, null, 2));
conn.sendMessage(m.chat, { text: replyText }, { quoted: m });
} else {
m.reply("La IA no envió una respuesta válida. 🙀");
}
} catch (error) {
m.reply(`Error al procesar la respuesta 😖: ${error.message}`);
}
});
});

req.on('error', (error) => {
m.reply(`Error de conexión con la IA 🤨: ${error.message}`);
});

req.write(data);
req.end();
break;
}
