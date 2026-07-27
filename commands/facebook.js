import axios from 'axios'
import stylizedChar from '../utils/fancy.js';
import { pickBestMediaUrl } from '../utils/extractMediaUrl.js';

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
        const apiUrl = `https://apis.davidcyriltech.my.id/facebook?url=${encodeURIComponent(args)}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000 });

        const videoUrl = data?.result?.downloads?.hd?.url || data?.result?.downloads?.sd?.url || pickBestMediaUrl(data?.result);

        if (!data.success || !videoUrl) {
            await client.sendMessage(remoteJid, { text: stylizedChar(' 💔 Échec du téléchargement depuis ce lien Facebook.') })
            return;
        }

        await client.sendMessage(remoteJid, {
            video: { url: videoUrl },
            caption: `${data.result?.title ? '🎬 ' + data.result.title + '\n\n' : ''}SORA MD`
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
