import fs from 'fs'

const BASE = './database'

/**
 * Envoie une image du dossier database/ pour accompagner un évènement de groupe
 * (welcome, bye, kick, promote, demote, antilink). Si le fichier n'existe pas,
 * envoie juste le texte pour ne jamais planter la commande.
 */
export async function sendGroupEventMessage(client, groupId, imageName, options) {
    const { caption, mentions } = options
    const imagePath = `${BASE}/${imageName}`

    try {
        if (fs.existsSync(imagePath)) {
            await client.sendMessage(groupId, {
                image: { url: imagePath },
                caption,
                mentions
            })
            return
        }
    } catch (error) {
        console.error(`⚠️ sendGroupEventMessage: erreur avec ${imagePath}:`, error.message)
    }

    // Fallback texte si l'image est absente ou a échoué
    await client.sendMessage(groupId, { text: caption, mentions })
}

export default { sendGroupEventMessage }
