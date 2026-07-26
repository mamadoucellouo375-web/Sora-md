import axios from 'axios'
import stylizedChar from '../utils/fancy.js';

async function facebook(client, message) {
    const remoteJid = message.key?.remoteJid;
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation;
    const args = messageBody.slice(1).trim().split(/\s+/)[1];

    if (!args) {
        await client.sendMessage(remoteJid, { text: stylizedChar(" ✨ Fournis un lien Facebook. Ex: .fb https://facebook.com/xxxx ✨") })
        return;
    }
    if (!/facebook\.com|fb\.watch/i.test(args)) {
        await client.sendMessage(remoteJid, { text: stylizedChar(" ⚠️ Ce n'est pas un lien Facebook valide.") })
        return;
    }

    await client.sendMessage(remoteJid, { text: stylizedChar(" 🚀 Téléchargement en cours... Patiente ⏳ ") });

    try {
        const apiUrl = `https://delirius-apiofc.vercel.app/download/facebook?url=${encodeURIComponent(args)}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000 });

        const result = data?.data || data?.result;
        const videoUrl = Array.isArray(result) ? (result[0]?.url || result[0]?.hd || result[0]?.sd) : (result?.hd || result?.sd || result?.url);

        if (!data.status || !videoUrl) {
            await client.sendMessage(remoteJid, { text: stylizedChar(' 💔 Échec du téléchargement depuis ce lien Facebook.') })
            return;
        }

        await client.sendMessage(remoteJid, {
            video: { url: videoUrl },
            caption: 'SORA MD'
        }, { quoted: message });

    } catch (e) {
        console.error("🔥 Erreur pendant le téléchargement Facebook:", e.message);
        const isTimeout = e.code === 'ECONNABORTED'
        await client.sendMessage(remoteJid, {
            text: stylizedChar(isTimeout
                ? '⏱️ Le service de téléchargement met trop de temps à répondre, réessaie plus tard.'
                : `🚨 Une erreur est survenue: ${e.message} 🚨`)
        });
    }
}

export default facebook;
