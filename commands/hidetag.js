export async function hidetag(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) {
        return client.sendMessage(groupId, { text: '❌ Cette commande ne marche que dans un groupe.' })
    }

    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const content = text.trim().split(/\s+/).slice(1).join(' ') || '📢'

    try {
        const metadata = await client.groupMetadata(groupId)
        const users = metadata.participants.map(p => p.id)

        await client.sendMessage(groupId, {
            text: content,
            mentions: users
        }, { quoted: message })
    } catch (error) {
        await client.sendMessage(groupId, { text: `❌ Erreur: ${error.message}` })
    }
}

export default { hidetag }
