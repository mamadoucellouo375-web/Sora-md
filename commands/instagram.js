import axios from 'axios'
import stylizedChar from '../utils/fancy.js';
import { pickBestMediaUrl } from '../utils/extractMediaUrl.js';

async function instagram(client, message) {
    const remoteJid = message.key?.remoteJid;
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation;
    const args = messageBody.slice(1).trim().split(/\s+/)[1];

    if (!args) {
        await client.sendMessage(remoteJid, { text: stylizedChar(" ✨ Fournis un lien Instagram. Ex: .ig https://instagram.com/reel/xxxx ✨") })
        return;
    }
    if (!args.includes('instagram.com')) {
        await client.sendMessage(remoteJid, { text: stylizedChar(" ⚠️ Ce n'est pas un lien Instagram valide.") })
        return;
    }

    await client.sendMessage(remoteJid, { text: stylizedChar(" 🚀 Téléchargement en cours... Patiente ⏳ ") });

    try {
        const apiUrl = `https://apis.davidcyriltech.my.id/instagram?url=${encodeURIComponent(args)}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000 });

        const mediaUrl = pickBestMediaUrl(data?.result ?? data);

        if ((data.success === false || data.status === false) || !mediaUrl) {
            await client.sendMessage(remoteJid, { text: stylizedChar(' 💔 Échec du téléchargement depuis ce lien Instagram. (Le lien a peut-être expiré ou est privé)') })
            return;
        }

        const isVideo = /\.mp4($|\?)/i.test(mediaUrl) || /video/i.test(JSON.stringify(data.result || {}));

        await client.sendMessage(remoteJid, isVideo
            ? { video: { url: mediaUrl }, caption: 'SORA MD' }
            : { image: { url: mediaUrl }, caption: 'SORA MD' }
        , { quoted: message });

    } catch (e) {
        console.error("🔥 Erreur pendant le téléchargement Instagram:", e.message);
        const isTimeout = e.code === 'ECONNABORTED'
        await client.sendMessage(remoteJid, {
            text: stylizedChar(isTimeout
                ? '⏱️ Le service de téléchargement met trop de temps à répondre, réessaie plus tard.'
                : `🚨 Une erreur est survenue: ${e.message} 🚨`)
        });
    }
}

export default instagram;

