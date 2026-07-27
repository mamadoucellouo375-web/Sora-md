import axios from 'axios'
import stylizedChar from '../utils/fancy.js';
import { pickBestMediaUrl } from '../utils/extractMediaUrl.js';

async function fetchTiktok(url) {
    // On essaie deux endpoints du même fournisseur, au cas où l'un des deux serait instable.
    const endpoints = [
        `https://apis.davidcyriltech.my.id/download/tiktokv2?url=${encodeURIComponent(url)}`,
        `https://apis.davidcyriltech.my.id/download/tiktok?url=${encodeURIComponent(url)}`
    ];

    let lastError = null;
    for (const apiUrl of endpoints) {
        try {
            const { data } = await axios.get(apiUrl, { timeout: 20000 });
            const mediaUrl = pickBestMediaUrl(data?.result ?? data);
            if ((data.success !== false && data.status !== false) && mediaUrl) {
                return { data, mediaUrl };
            }
        } catch (e) {
            lastError = e;
        }
    }
    if (lastError) throw lastError;
    return { data: null, mediaUrl: null };
}

async function tiktok(client, message) {
    const remoteJid = message.key?.remoteJid;
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation;
    const args = messageBody.slice(1).trim().split(/\s+/)[1];

    if (!args) {
        await client.sendMessage(remoteJid, { text: stylizedChar(" ✨ Fournis un lien TikTok. Ex: .tiktok https://vm.tiktok.com/xxxx ✨") })
        return;
    }
    if (!args.includes('tiktok.com')) {
        await client.sendMessage(remoteJid, { text: stylizedChar(" ⚠️ Ce n'est pas un lien TikTok valide.") })
        return;
    }

    await client.sendMessage(remoteJid, { text: stylizedChar(" 🚀 Téléchargement en cours... Patiente ⏳ ") });

    try {
        const { data, mediaUrl } = await fetchTiktok(args);

        if (!mediaUrl) {
            await client.sendMessage(remoteJid, { text: stylizedChar(' 💔 Échec du téléchargement de cette vidéo TikTok. (Lien expiré, privé, ou supprimé ?)') })
            return;
        }

        const result = data?.result || {};
        const title = result.title || result.desc || '';
        const author = result.author?.nickname || result.author?.username || result.author || '';

        const caption = stylizedChar(
`🎬 *TikTok Vidéo Téléchargée !* 🎬
${author ? `👤 *Créateur:* ${author}\n` : ''}${title ? `📝 *Titre:* ${title}\n` : ''}
ᴘᴏᴡᴇʀᴇᴅ ʙʏ SORA MD`);

        await client.sendMessage(remoteJid, {
            video: { url: mediaUrl },
            caption: caption
        }, { quoted: message });

    } catch (e) {
        console.error("🔥 Erreur pendant le téléchargement TikTok:", e.message);
        const isTimeout = e.code === 'ECONNABORTED'
        await client.sendMessage(remoteJid, {
            text: stylizedChar(isTimeout
                ? '⏱️ Le service de téléchargement met trop de temps à répondre, réessaie plus tard.'
                : `🚨 Une erreur est survenue: ${e.message} 🚨`)
        });
    }
}

export default tiktok;
