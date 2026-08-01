import fs from 'fs'

const FILE = './database/afk.json'

function load() {
    try {
        if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
    } catch (error) {
        console.error('⚠️ afk.json invalide, réinitialisation.', error.message)
    }
    return {}
}

const afkUsers = load()

function persist() {
    try {
        fs.writeFileSync(FILE, JSON.stringify(afkUsers, null, 2))
    } catch (error) {
        console.error('⚠️ Échec sauvegarde afk:', error.message)
    }
}

function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000)
    if (minutes < 1) return "moins d'une minute"
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ${minutes % 60}min`
    const days = Math.floor(hours / 24)
    return `${days}j ${hours % 24}h`
}

export async function setAfk(client, message) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const reason = text.trim().split(/\s+/).slice(1).join(' ') || 'Pas de raison donnée'

    afkUsers[senderId] = { since: Date.now(), reason }
    persist()

    await client.sendMessage(remoteJid, {
        text: `😴 Tu es maintenant AFK.\nRaison: ${reason}`
    })
}

// Appelée sur CHAQUE message (comme gainMessageExp) : gère la levée automatique de l'AFK
// et la notification quand quelqu'un mentionne/répond à un utilisateur AFK.
export async function checkAfk(client, message) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid

    // Si l'expéditeur était AFK et reprend la parole, on lève son statut
    if (afkUsers[senderId]) {
        const duration = formatDuration(Date.now() - afkUsers[senderId].since)
        delete afkUsers[senderId]
        persist()
        try {
            await client.sendMessage(remoteJid, {
                text: `👋 @${senderId.split('@')[0]} n'est plus AFK (absent ${duration}).`,
                mentions: [senderId]
            })
        } catch {}
    }

    // Si le message mentionne ou répond à quelqu'un qui est AFK, on prévient
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant
    const targets = [...new Set([...mentioned, ...(quotedParticipant ? [quotedParticipant] : [])])]

    for (const target of targets) {
        if (target === senderId) continue
        const afk = afkUsers[target]
        if (!afk) continue

        const duration = formatDuration(Date.now() - afk.since)
        try {
            await client.sendMessage(remoteJid, {
                text: `😴 @${target.split('@')[0]} est AFK depuis ${duration}.\nRaison: ${afk.reason}`,
                mentions: [target]
            })
        } catch {}
    }
}

export default { setAfk, checkAfk }
