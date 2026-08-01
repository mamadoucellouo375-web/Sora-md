import configmanager from '../utils/configmanager.js'

export async function callad(client, message) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid
    const number = client.user.id.split(':')[0]

    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
    const userMessage = text.trim().split(/\s+/).slice(1).join(' ')

    if (!userMessage) {
        return client.sendMessage(remoteJid, {
            text: `📖 Usage: .callad <message>\nEnvoie un message directement à l'admin du bot.`
        })
    }

    const admins = configmanager.config.users[number]?.sudoList?.length
        ? configmanager.config.users[number].sudoList
        : [`${number}@s.whatsapp.net`]

    const isGroup = remoteJid.includes('@g.us')
    let location = 'DM'
    if (isGroup) {
        try {
            const metadata = await client.groupMetadata(remoteJid)
            location = `Groupe: ${metadata.subject}`
        } catch {
            location = `Groupe: ${remoteJid}`
        }
    }

    const senderName = message.pushName || 'Inconnu'
    const adminMsg = `📬 *Message reçu via .callad*\n\n` +
        `👤 De: ${senderName}\n` +
        `📍 ${location}\n` +
        `🆔 UID: ${senderId}\n\n` +
        `💬 Message: ${userMessage}`

    let sent = 0
    for (const adminId of admins) {
        try {
            await client.sendMessage(adminId, { text: adminMsg })
            sent++
        } catch (error) {
            console.error(`callad: échec envoi à ${adminId}:`, error.message)
        }
    }

    await client.sendMessage(remoteJid, {
        text: sent > 0 ? '✅ Ton message a été envoyé à l\'admin !' : '❌ Impossible de contacter l\'admin.'
    })
}

export default { callad }
