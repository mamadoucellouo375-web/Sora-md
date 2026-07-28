import fs from 'fs'

const FILE = './database/notes.json'

function load() {
    try {
        if (fs.existsSync(FILE)) {
            return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
        }
    } catch (error) {
        console.error('⚠️ notes.json invalide, réinitialisation.', error.message)
    }
    return {}
}

const notes = load()

function persist() {
    try {
        fs.writeFileSync(FILE, JSON.stringify(notes, null, 2))
    } catch (error) {
        console.error('⚠️ Échec sauvegarde notes:', error.message)
    }
}

function getText(message) {
    return (message.message?.extendedTextMessage?.text || message.message?.conversation || '').trim()
}

export async function note(client, message) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid
    const text = getText(message)
    const args = text.split(/\s+/).slice(1)
    const action = args[0]?.toLowerCase()

    if (!notes[senderId]) notes[senderId] = []

    if (action === 'add') {
        const content = args.slice(1).join(' ')
        if (!content) return client.sendMessage(remoteJid, { text: '📝 Usage: .note add <texte>' })
        notes[senderId].push({ id: Date.now(), content })
        persist()
        return client.sendMessage(remoteJid, { text: `✅ Note enregistrée (#${notes[senderId].length})` })
    }

    if (action === 'list') {
        if (notes[senderId].length === 0) return client.sendMessage(remoteJid, { text: 'ℹ️ Aucune note enregistrée.' })
        const list = notes[senderId].map((n, i) => `${i + 1}. ${n.content}`).join('\n')
        return client.sendMessage(remoteJid, { text: `📝 *Tes notes*\n\n${list}` })
    }

    if (action === 'del') {
        const index = parseInt(args[1], 10) - 1
        if (isNaN(index) || !notes[senderId][index]) {
            return client.sendMessage(remoteJid, { text: '❌ Usage: .note del <numéro> (voir .note list)' })
        }
        notes[senderId].splice(index, 1)
        persist()
        return client.sendMessage(remoteJid, { text: '🗑️ Note supprimée.' })
    }

    await client.sendMessage(remoteJid, { text: '📝 Usage:\n.note add <texte>\n.note list\n.note del <numéro>' })
}

export default { note }
