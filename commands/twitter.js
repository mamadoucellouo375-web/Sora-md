import axios from 'axios'
import stylizedChar from '../utils/fancy.js';

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
        const apiUrl = `https://delirius-apiofc.vercel.app/download/twitter?url=${encodeURIComponent(args)}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000 });

        const result = data?.data || data?.result;
        const media = Array.isArray(result?.media) ? result.media : (Array.isArray(result) ? result : null);
        const videoUrl = media?.find(m => m.type === 'video' || m.hd || m.url)?.hd
            || media?.find(m => m.url)?.url
            || result?.url;

        if (!data.status || !videoUrl) {
            await client.sendMessage(remoteJid, { text: stylizedChar(' 💔 Échec du téléchargement depuis ce lien Twitter/X.') })
            return;
        }

        await client.sendMessage(remoteJid, {
            video: { url: videoUrl },
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
