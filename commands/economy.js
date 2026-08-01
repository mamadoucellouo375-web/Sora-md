import { getUser, calculateRank, save } from '../utils/economyStore.js'

const DAILY_AMOUNT = 500
const DAILY_COOLDOWN = 24 * 60 * 60 * 1000 // 24h

function getTargetId(message) {
    const senderId = message.key.participant || message.key.remoteJid
    const quoted = message.message?.extendedTextMessage?.contextInfo?.participant
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
    return quoted || mentioned || senderId
}

export async function balance(client, message) {
    const remoteJid = message.key.remoteJid
    const target = getTargetId(message)
    const user = getUser(target)

    await client.sendMessage(remoteJid, {
        text: `💰 *Solde de @${target.split('@')[0]}*\n\n${user.money} 🪙`,
        mentions: [target]
    })
}

export async function daily(client, message) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid
    const user = getUser(senderId)

    const now = Date.now()
    const elapsed = now - (user.lastDaily || 0)

    if (elapsed < DAILY_COOLDOWN) {
        const remainingMs = DAILY_COOLDOWN - elapsed
        const hours = Math.floor(remainingMs / (60 * 60 * 1000))
        const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))
        return client.sendMessage(remoteJid, {
            text: `⏱️ Déjà récupéré aujourd'hui. Reviens dans ${hours}h ${minutes}m.`
        })
    }

    user.money = (user.money || 0) + DAILY_AMOUNT
    user.lastDaily = now
    save()

    await client.sendMessage(remoteJid, {
        text: `🎁 Récompense quotidienne récupérée: *+${DAILY_AMOUNT} 🪙*\nSolde: ${user.money} 🪙`
    })
}

export async function rank(client, message) {
    const remoteJid = message.key.remoteJid
    const target = getTargetId(message)
    const user = getUser(target)
    const r = calculateRank(user.exp || 0)

    await client.sendMessage(remoteJid, {
        text: `🏆 *Niveau de @${target.split('@')[0]}*\n\n` +
            `📊 Niveau: ${r.level}\n` +
            `⭐ XP: ${user.exp || 0} / ${r.nextLevelExp}\n` +
            `📈 Progression: ${r.progress}%\n` +
            `💬 Messages envoyés: ${user.totalMsg || 0}`,
        mentions: [target]
    })
}

export async function spy(client, message) {
    const remoteJid = message.key.remoteJid
    const target = getTargetId(message)
    const user = getUser(target)
    const r = calculateRank(user.exp || 0)

    const text = `🕵️ *Profil de @${target.split('@')[0]}*\n\n` +
        `🆔 ${target}\n` +
        `💰 Solde: ${user.money || 0} 🪙\n` +
        `⭐ XP: ${user.exp || 0}\n` +
        `🏆 Niveau: ${r.level} (${r.progress}%)\n` +
        `💬 Messages: ${user.totalMsg || 0}`

    await client.sendMessage(remoteJid, { text, mentions: [target] })
}

export default { balance, daily, rank, spy }
