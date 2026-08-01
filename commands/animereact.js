import axios from 'axios'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'

// Liste officielle des catégories SFW de l'API waifu.pics
export const REACTIONS = [
    'bite', 'blush', 'bonk', 'bully', 'cringe', 'cry', 'cuddle', 'dance',
    'glomp', 'handhold', 'happy', 'highfive', 'hug', 'kick', 'kill', 'kiss',
    'lick', 'nom', 'pat', 'poke', 'slap', 'smile', 'smug', 'wave', 'wink', 'yeet'
]

const VERBS = {
    bite: 'a mordu', blush: 'rougit devant', bonk: 'a bonk', bully: "embête",
    cringe: 'a un malaise devant', cry: 'pleure devant', cuddle: 'câline',
    dance: 'danse avec', glomp: 'saute au cou de', handhold: 'tient la main de',
    happy: 'est content(e) avec', highfive: 'tape dans la main de', hug: 'fait un câlin à',
    kick: 'a donné un coup de pied à', kill: 'a "tué" (pour de faux)', kiss: 'embrasse',
    lick: 'lèche', nom: 'grignote avec', pat: 'tapote la tête de', poke: 'chatouille',
    slap: 'a giflé', smile: 'sourit à', smug: 'nargue', wave: 'fait coucou à',
    wink: 'fait un clin d\'œil à', yeet: 'a envoyé valser'
}

async function gifToVideoBuffer(gifBuffer) {
    const uniqueId = Date.now() + '_' + Math.random().toString(36).slice(2)
    const gifPath = `./temp_react_${uniqueId}.gif`
    const mp4Path = `./temp_react_${uniqueId}.mp4`

    try {
        fs.writeFileSync(gifPath, gifBuffer)

        await new Promise((resolve, reject) => {
            ffmpeg(gifPath)
                .output(mp4Path)
                .outputOptions([
                    '-movflags faststart',
                    '-pix_fmt yuv420p',
                    '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2'
                ])
                .on('end', resolve)
                .on('error', reject)
                .run()
        })

        return fs.readFileSync(mp4Path)
    } finally {
        if (fs.existsSync(gifPath)) fs.unlinkSync(gifPath)
        if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path)
    }
}

export async function animeReact(client, message, reaction) {
    const remoteJid = message.key.remoteJid
    const senderId = message.key.participant || remoteJid

    if (!REACTIONS.includes(reaction)) {
        return client.sendMessage(remoteJid, {
            text: `❌ Réaction inconnue. Liste: ${REACTIONS.join(', ')}`
        })
    }

    try {
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        const target = quotedParticipant || mentioned || senderId
        const isSelf = target === senderId

        const { data } = await axios.get(`https://api.waifu.pics/sfw/${reaction}`, { timeout: 15000 })
        if (!data?.url) throw new Error('Pas de résultat renvoyé par le service.')

        const { data: gifBuffer } = await axios.get(data.url, { responseType: 'arraybuffer', timeout: 20000 })
        const videoBuffer = await gifToVideoBuffer(Buffer.from(gifBuffer))

        const caption = `*@${senderId.split('@')[0]}* ${VERBS[reaction]} ${isSelf ? 'lui/elle-même' : `*@${target.split('@')[0]}*`} !`

        await client.sendMessage(remoteJid, {
            video: videoBuffer,
            gifPlayback: true,
            caption,
            mentions: [senderId, target]
        }, { quoted: message })

    } catch (error) {
        console.error('Erreur animeReact:', error.message)
        await client.sendMessage(remoteJid, { text: `❌ Erreur: ${error.message}` })
    }
}

export default { animeReact, REACTIONS }
