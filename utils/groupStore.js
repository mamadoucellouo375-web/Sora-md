import fs from 'fs'

const FILE = './database/groupSettings.json'

function load() {
    try {
        if (fs.existsSync(FILE)) {
            const raw = fs.readFileSync(FILE, 'utf-8')
            const parsed = JSON.parse(raw)
            return {
                antilinkSettings: parsed.antilinkSettings || {},
                warnStorage: parsed.warnStorage || {},
                autoSettings: parsed.autoSettings || {}
            }
        }
    } catch (error) {
        console.error('⚠️ groupStore: erreur de lecture, réinitialisation.', error.message)
    }
    return { antilinkSettings: {}, warnStorage: {}, autoSettings: {} }
}

export const store = load()

export function save() {
    try {
        fs.writeFileSync(FILE, JSON.stringify(store, null, 2))
    } catch (error) {
        console.error('⚠️ groupStore: échec de sauvegarde.', error.message)
    }
}

export default { store, save }
