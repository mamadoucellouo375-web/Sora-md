import crypto from 'crypto'

function getText(message) {
    return (message.message?.extendedTextMessage?.text || message.message?.conversation || '').trim()
}

function getArgsText(message) {
    return getText(message).split(/\s+/).slice(1).join(' ')
}

async function reply(client, message, text) {
    await client.sendMessage(message.key.remoteJid, { text }, { quoted: message })
}

// ---------- .calc ----------
function safeEval(expr) {
    if (!/^[0-9+\-*/().\s%^]+$/.test(expr)) throw new Error('Expression invalide. Utilise seulement chiffres et + - * / % ^ ( )')
    if (expr.length > 200) throw new Error('Expression trop longue.')
    const sanitized = expr.replace(/\^/g, '**')
    const result = Function('"use strict"; return (' + sanitized + ')')()
    if (typeof result !== 'number' || !isFinite(result)) throw new Error('Résultat invalide (division par zéro ?).')
    return result
}

export async function calc(client, message) {
    const expr = getArgsText(message)
    if (!expr) return reply(client, message, '🧮 Usage: .calc 2+2*10')
    try {
        const result = safeEval(expr)
        await reply(client, message, `🧮 ${expr} = *${result}*`)
    } catch (e) {
        await reply(client, message, `❌ ${e.message}`)
    }
}

// ---------- .base64 ----------
export async function base64(client, message) {
    const args = getArgsText(message)
    const [mode, ...rest] = args.split(/\s+/)
    const text = rest.join(' ')

    if (!mode || !text || !['encode', 'decode'].includes(mode.toLowerCase())) {
        return reply(client, message, '🔐 Usage: .base64 encode <texte>\n.base64 decode <texte>')
    }

    try {
        if (mode.toLowerCase() === 'encode') {
            await reply(client, message, `🔐 ${Buffer.from(text, 'utf-8').toString('base64')}`)
        } else {
            await reply(client, message, `🔓 ${Buffer.from(text, 'base64').toString('utf-8')}`)
        }
    } catch {
        await reply(client, message, '❌ Texte base64 invalide.')
    }
}

// ---------- .hash ----------
export async function hash(client, message) {
    const args = getArgsText(message)
    const [algo, ...rest] = args.split(/\s+/)
    const text = rest.join(' ')
    const supported = ['md5', 'sha1', 'sha256', 'sha512']

    if (!algo || !text || !supported.includes(algo.toLowerCase())) {
        return reply(client, message, `🔒 Usage: .hash <${supported.join('|')}> <texte>`)
    }

    const digest = crypto.createHash(algo.toLowerCase()).update(text).digest('hex')
    await reply(client, message, `🔒 *${algo.toUpperCase()}*\n${digest}`)
}

// ---------- .binary ----------
export async function binary(client, message) {
    const text = getArgsText(message)
    if (!text) return reply(client, message, '💻 Usage: .binary <texte>')
    const result = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ')
    await reply(client, message, `💻 ${result}`)
}

// ---------- .morse ----------
const MORSE_MAP = {
    a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
    i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
    q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
    y: '-.--', z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
    '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    ' ': '/'
}

export async function morse(client, message) {
    const text = getArgsText(message).toLowerCase()
    if (!text) return reply(client, message, '📡 Usage: .morse <texte>')
    const result = text.split('').map(c => MORSE_MAP[c] ?? c).join(' ')
    await reply(client, message, `📡 ${result}`)
}

// ---------- .reverse ----------
export async function reverseText(client, message) {
    const text = getArgsText(message)
    if (!text) return reply(client, message, '🔄 Usage: .reverse <texte>')
    await reply(client, message, `🔄 ${text.split('').reverse().join('')}`)
}

// ---------- .case ----------
export async function textCase(client, message) {
    const args = getArgsText(message)
    const [mode, ...rest] = args.split(/\s+/)
    const text = rest.join(' ')
    if (!mode || !text) return reply(client, message, '🔡 Usage: .case upper|lower|title <texte>')

    let result
    if (mode.toLowerCase() === 'upper') result = text.toUpperCase()
    else if (mode.toLowerCase() === 'lower') result = text.toLowerCase()
    else if (mode.toLowerCase() === 'title') result = text.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    else return reply(client, message, '❌ Modes: upper, lower, title')

    await reply(client, message, result)
}

// ---------- .count ----------
export async function countText(client, message) {
    const text = getArgsText(message)
    if (!text) return reply(client, message, '🔢 Usage: .count <texte>')
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const chars = text.length
    const vowels = (text.match(/[aeiouyAEIOUY]/g) || []).length
    await reply(client, message, `🔢 *Statistiques*\n📝 Mots: ${words}\n🔤 Caractères: ${chars}\n🔉 Voyelles: ${vowels}`)
}

// ---------- .palindrome ----------
export async function palindrome(client, message) {
    const text = getArgsText(message).toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!text) return reply(client, message, '🔁 Usage: .palindrome <texte>')
    const isPalin = text === text.split('').reverse().join('')
    await reply(client, message, isPalin ? '✅ C\'est un palindrome !' : '❌ Ce n\'est pas un palindrome.')
}

// ---------- .password ----------
export async function password(client, message) {
    const args = getArgsText(message)
    let length = parseInt(args, 10)
    if (!length || length < 4) length = 12
    if (length > 64) length = 64

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars[crypto.randomInt(0, chars.length)]
    }
    await reply(client, message, `🔑 *Mot de passe (${length} car.)*\n\`\`\`${result}\`\`\``)
}

// ---------- .dice ----------
export async function dice(client, message) {
    const result = crypto.randomInt(1, 7)
    await reply(client, message, `🎲 Tu as fait *${result}* !`)
}

// ---------- .coinflip ----------
export async function coinflip(client, message) {
    const result = crypto.randomInt(0, 2) === 0 ? 'Pile 🪙' : 'Face 🪙'
    await reply(client, message, result)
}

// ---------- .rps ----------
export async function rps(client, message) {
    const choice = getArgsText(message).toLowerCase()
    const options = { pierre: '🪨', feuille: '📄', ciseaux: '✂️' }
    const keys = Object.keys(options)

    if (!keys.includes(choice)) {
        return reply(client, message, `✊ Usage: .rps pierre|feuille|ciseaux`)
    }

    const botChoice = keys[crypto.randomInt(0, keys.length)]
    let result
    if (choice === botChoice) result = '🤝 Égalité !'
    else if (
        (choice === 'pierre' && botChoice === 'ciseaux') ||
        (choice === 'feuille' && botChoice === 'pierre') ||
        (choice === 'ciseaux' && botChoice === 'feuille')
    ) result = '🎉 Tu as gagné !'
    else result = '😢 Tu as perdu !'

    await reply(client, message, `Toi: ${options[choice]} vs SORA MD: ${options[botChoice]}\n\n${result}`)
}

// ---------- .8ball ----------
const EIGHTBALL_ANSWERS = [
    "Oui, c'est certain.", "C'est décidé.", "Sans aucun doute.", "Oui, définitivement.",
    "Tu peux compter dessus.", "D'après moi, oui.", "Probablement.", "Bonnes perspectives.",
    "Signe indique oui.", "Réponse floue, réessaie.", "Redemande plus tard.",
    "Je préfère ne pas te le dire.", "Impossible de prédire maintenant.", "Concentre-toi et redemande.",
    "N'y compte pas.", "Ma réponse est non.", "Mes sources disent non.", "Perspectives pas terribles.",
    "Très douteux."
]

export async function eightball(client, message) {
    const question = getArgsText(message)
    if (!question) return reply(client, message, '🎱 Usage: .8ball <question>')
    const answer = EIGHTBALL_ANSWERS[crypto.randomInt(0, EIGHTBALL_ANSWERS.length)]
    await reply(client, message, `🎱 ${answer}`)
}

// ---------- .choose ----------
export async function choose(client, message) {
    const text = getArgsText(message)
    const options = text.split(',').map(o => o.trim()).filter(Boolean)
    if (options.length < 2) return reply(client, message, '🤔 Usage: .choose option1, option2, option3...')
    const picked = options[crypto.randomInt(0, options.length)]
    await reply(client, message, `🤔 Je choisis: *${picked}*`)
}

// ---------- .time ----------
export async function currentTime(client, message) {
    const now = new Date()
    const formatted = now.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' })
    await reply(client, message, `🕐 ${formatted}\n(heure du serveur du bot)`)
}

export default {
    calc, base64, hash, binary, morse, reverseText, textCase, countText,
    palindrome, password, dice, coinflip, rps, eightball, choose, currentTime
}
