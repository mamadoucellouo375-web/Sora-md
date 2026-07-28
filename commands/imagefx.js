import sharp from 'sharp'
import { downloadMediaMessage } from 'baileys'

function getQuotedImage(message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (quoted?.imageMessage) return quoted
    if (message.message?.imageMessage) return message.message
    return null
}

async function applyEffect(client, message, effectName, sharpFn) {
    const remoteJid = message.key.remoteJid
    const target = getQuotedImage(message)

    if (!target) {
        return await client.sendMessage(remoteJid, {
            text: `🖼️ Réponds à une image (ou envoie-en une) avec .${effectName}`
        })
    }

    try {
        const buffer = await downloadMediaMessage({ message: target }, 'buffer')
        const output = await sharpFn(sharp(buffer)).toBuffer()

        await client.sendMessage(remoteJid, {
            image: output,
            caption: 'SORA MD'
        }, { quoted: message })
    } catch (error) {
        console.error(`Erreur effet ${effectName}:`, error.message)
        await client.sendMessage(remoteJid, { text: `❌ Erreur: ${error.message}` })
    }
}

export async function blur(client, message) {
    await applyEffect(client, message, 'blur', (img) => img.blur(12))
}

export async function grayscale(client, message) {
    await applyEffect(client, message, 'grayscale', (img) => img.grayscale())
}

export async function invert(client, message) {
    await applyEffect(client, message, 'invert', (img) => img.negate())
}

export async function resize(client, message) {
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
    const width = parseInt(text.trim().split(/\s+/)[1], 10) || 512
    const clamped = Math.min(Math.max(width, 32), 2048)
    await applyEffect(client, message, 'resize', (img) => img.resize(clamped))
}

export default { blur, grayscale, invert, resize }
