import axios from 'axios'
import stylizedChar from '../utils/fancy.js';
import { pickBestMediaUrl } from '../utils/extractMediaUrl.js';

async function twitter(client, message) {
    const remoteJid = message.key?.remoteJid;
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation;
    const args = messageBody.slice(1).trim().split(/\s+/)[1];

    if (!args) {
        await client.sendMessage(remoteJid, { text: stylizedChar(" ✨ Fournis un lien Twitter/X. Ex: .twitter https://x.com/xxxx ✨") })
        return;
    }
    if (!/twitter\.com|x\.com/i.test(args)) {
        await client.sendMessage(remoteJid, { text: stylizedChar(" ⚠️ Ce n'est pas un lien Twitter/X valide.") })
        return;
    }

    await client.sendMessage(remoteJid, { text: stylizedChar(" 🚀 Téléchargement en cours... Patiente ⏳ ") });

    try {
        // ⚠️ Endpoint non confirmé en direct (pas de curl fourni pour Twitter) — basé sur le
        // même schéma que .fb/.ig du même fournisseur. Si ça 404, renvoie-moi le curl exact
        // depuis https://apis.davidcyriltech.my.id/docs (catégorie Downloader) pour corriger.
        const apiUrl = `https://apis.davidcyriltech.my.id/twitter?url=${encodeURIComponent(args)}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000 });

        const mediaUrl = pickBestMediaUrl(data?.result ?? data);

        if ((data.success === false || data.status === false) || !mediaUrl) {
            await client.sendMessage(remoteJid, { text: stylizedChar(' 💔 Échec du téléchargement depuis ce lien Twitter/X.') })
            return;
        }

        await client.sendMessage(remoteJid, {
            video: { url: mediaUrl },
            caption: 'SORA MD'
        }, { quoted: message });

    } catch (e) {
        console.error("🔥 Erreur pendant le téléchargement Twitter:", e.message);
        const isTimeout = e.code === 'ECONNABORTED'
        await client.sendMessage(remoteJid, {
            text: stylizedChar(isTimeout
                ? '⏱️ Le service de téléchargement met trop de temps à répondre, réessaie plus tard.'
                : `🚨 Une erreur est survenue: ${e.message} 🚨`)
        });
    }
}

export default twitter;
