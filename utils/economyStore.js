import fs from 'fs'

const FILE = './database/economy.json'

function load() {
    try {
        if (fs.existsSync(FILE)) {
            return JSON.parse(fs.readFileSync(FILE, 'utf-8'))
        }
    } catch (error) {
        console.error('⚠️ economy.json invalide, réinitialisation.', error.message)
    }
    return {}
}

const economy = load()

function save() {
    try {
        fs.writeFileSync(FILE, JSON.stringify(economy, null, 2))
    } catch (error) {
        console.error('⚠️ Échec sauvegarde economy:', error.message)
    }
}

function getUser(userId) {
    if (!economy[userId]) {
        economy[userId] = { money: 0, exp: 0, totalMsg: 0, lastDaily: 0 }
    }
    return economy[userId]
}

// XP nécessaire pour atteindre un niveau donné (courbe simple, progressive)
function expForLevel(level) {
    return 100 * level * level
}

function calculateRank(exp) {
    let level = 0
    while (exp >= expForLevel(level + 1)) level++

    const currentLevelExp = expForLevel(level)
    const nextLevelExp = expForLevel(level + 1)
    const progress = Math.floor(((exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100)

    return { level, progress, nextLevelExp, currentLevelExp }
}

// Appelé sur chaque message (pas juste les commandes) pour faire progresser l'XP passivement
function gainMessageExp(userId) {
    const user = getUser(userId)
    user.totalMsg = (user.totalMsg || 0) + 1
    user.exp = (user.exp || 0) + Math.floor(Math.random() * 4) + 1 // 1-4 XP par message
    save()
}

export { economy, save, getUser, calculateRank, gainMessageExp }
export default { economy, save, getUser, calculateRank, gainMessageExp }
