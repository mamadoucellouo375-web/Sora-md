import axios from 'axios'
import stylizedChar from '../utils/fancy.js';

const MAX_HISTORY = 10 // messages gardés en mémoire par utilisateur (5 échanges)
const conversations = {}

function getHistory(userId) {
    if (!conversations[userId]) conversations[userId] = []
    return conversations[userId]
}

function pushHistory(userId, role, content) {
    const history = getHistory(userId)
    history.push({ role, content })
    while (history.length > MAX_HISTORY) history.shift()
}

async function ia(client, message) {
    const remoteJid = message.key?.remoteJid;
    const senderId = message.key?.participant || remoteJid;
    const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    const prompt = messageBody.trim().split(/\s+/).slice(1).join(' ');
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';

    const fullPrompt = [quotedText, prompt].filter(Boolean).join('\n');

    if (!fullPrompt) {
        if (prompt === 'reset' || messageBody.trim() === '.ia reset') {
            delete conversations[senderId]
            await client.sendMessage(remoteJid, { text: stylizedChar('🧹 Mémoire de conversation réinitialisée.') });
            return;
        }
        await client.sendMessage(remoteJid, { text: stylizedChar('🤖 Pose ta question. Ex: .ia explique moi la photosynthèse\n(.ia reset pour effacer la mémoire de conversation)') });
        return;
    }

    if (fullPrompt.trim().toLowerCase() === 'reset') {
        delete conversations[senderId]
        await client.sendMessage(remoteJid, { text: stylizedChar('🧹 Mémoire de conversation réinitialisée.') });
        return;
    }

    await client.sendMessage(remoteJid, { text: stylizedChar('🤖 Réflexion en cours...') });

    const system = "Tu es SORA MD, un assistant IA intégré à un bot WhatsApp. Réponds en français, de façon claire et concise.";

    try {
        const history = getHistory(senderId)
        const answer = await askPollinations(fullPrompt, system, history);
        pushHistory(senderId, 'user', fullPrompt)
        pushHistory(senderId, 'assistant', answer)
        await client.sendMessage(remoteJid, { text: stylizedChar(answer) }, { quoted: message });
    } catch (e) {
        console.error("🔥 Erreur IA:", e.message);
        await client.sendMessage(remoteJid, {
            text: stylizedChar(`🚨 Le service IA est indisponible pour le moment (${e.message}). Réessaie plus tard.`)
        });
    }
}

async function askPollinations(prompt, system, history = []) {
    // Pollinations text API — gratuit, sans clé API
    const url = 'https://text.pollinations.ai/openai';
    const { data } = await axios.post(url, {
        model: 'openai',
        messages: [
            { role: 'system', content: system },
            ...history,
            { role: 'user', content: prompt }
        ]
    }, { timeout: 30000 });

    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error('Réponse vide du service IA.');
    return content.trim();
}

export default ia;
