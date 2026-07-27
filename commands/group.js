import configmanager from '../utils/configmanager.js'
import { store, save } from '../utils/groupStore.js'
import { sendGroupEventMessage } from '../utils/groupMedia.js'

const antilinkSettings = store.antilinkSettings
const warnStorage = store.warnStorage

export async function antilink(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    
    try {
        const metadata = await client.groupMetadata(groupId)
        const senderId = message.key.participant || groupId
        const sender = metadata.participants.find(p => p.id === senderId)
        
        if (!sender?.admin) {
            return await client.sendMessage(groupId, { 
                text: '🔒 *Admins uniquement !*' 
            })
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
        const args = text.split(/\s+/).slice(1)
        const action = args[0]?.toLowerCase()

        if (!action) {
            const usage = `🔒 *SORA MD - Antilink*\n\n.antilink on\n.antilink off\n.antilink set delete | kick | warn\n.antilink status`
            return await client.sendMessage(groupId, { text: usage })
        }

        switch (action) {
            case 'on':
                antilinkSettings[groupId] = { enabled: true, action: 'delete' }
                save()
                await client.sendMessage(groupId, { 
                    text: '✅ *Antilink activé*' 
                })
                break

            case 'off':
                delete antilinkSettings[groupId]
                save()
                await client.sendMessage(groupId, { 
                    text: '❌ *Antilink désactivé*' 
                })
                break

            case 'set':
                if (args.length < 2) {
                    return await client.sendMessage(groupId, { 
                        text: '❌ Usage: .antilink set delete | kick | warn' 
                    })
                }
                const setAction = args[1].toLowerCase()
                if (!['delete', 'kick', 'warn'].includes(setAction)) {
                    return await client.sendMessage(groupId, { 
                        text: '❌ Actions: delete, kick, warn' 
                    })
                }
                if (!antilinkSettings[groupId]) {
                    antilinkSettings[groupId] = { enabled: true, action: setAction }
                } else {
                    antilinkSettings[groupId].action = setAction
                }
                save()
                await client.sendMessage(groupId, { 
                    text: `✅ *Action:* ${setAction}` 
                })
                break

            case 'status':
                const status = antilinkSettings[groupId]
                await client.sendMessage(groupId, { 
                    text: `📊 *Statut*\n\nActivé: ${status?.enabled ? '✅' : '❌'}\nAction: ${status?.action || 'Aucune'}` 
                })
                break

            default:
                await client.sendMessage(groupId, { 
                    text: '❌ Usage: .antilink on/off/set/status' 
                })
        }
    } catch (error) {
        console.error('Antilink error:', error)
    }
}

export async function linkDetection(client, message) {
    console.log('🔍 LINK DETECTION CALLED')
    
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) {
        console.log('🟡 Not a group')
        return
    }
    
    const setting = antilinkSettings[groupId]
    if (!setting?.enabled) {
        console.log('🟡 Antilink disabled for group')
        return
    }
    
    const senderId = message.key.participant || groupId
    const messageText = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    
    console.log('Checking text:', messageText.substring(0, 50))
    
    const linkPatterns = [
        /https?:\/\//i,
        /www\./i,
        /\.com\b/i,
        /\.net\b/i,
        /\.org\b/i,
        /tiktok\.com/i,
        /instagram\.com/i,
        /facebook\.com/i,
        /whatsapp\.com/i,
        /chat\.whatsapp\.com/i,
        /t\.me/i,
        /telegram/i,
        /discord/i,
        /youtube\.com/i,
        /youtu\.be/i
    ]
    
    const hasLink = linkPatterns.some(pattern => pattern.test(messageText))
    if (!hasLink) {
        console.log('🟡 No link found')
        return
    }
    
    console.log('🟢 Link detected!')
    
    try {
        const metadata = await client.groupMetadata(groupId)
        const sender = metadata.participants.find(p => p.id === senderId)
        const bot = metadata.participants.find(p => p.id.includes(client.user.id.split(':')[0]))
        
        if (sender?.admin) {
            console.log('🟡 Sender is admin, skipping')
            return
        }
        
        if (!bot?.admin) {
            console.log('🟡 Bot not admin, skipping')
            return
        }
        
        console.log('🟢 Taking action:', setting.action)
        
        if (setting.action === 'delete' || setting.action === 'kick' || setting.action === 'warn') {
            try {
                await client.sendMessage(groupId, {
                    delete: message.key
                })
                console.log('✅ Message deleted')
            } catch (deleteError) {
                console.log('❌ Delete failed:', deleteError.message)
            }
        }
        
        const platforms = []
        if (/tiktok\.com/i.test(messageText)) platforms.push('TikTok')
        if (/instagram\.com/i.test(messageText)) platforms.push('Instagram')
        if (/facebook\.com/i.test(messageText)) platforms.push('Facebook')
        if (/whatsapp\.com/i.test(messageText)) platforms.push('WhatsApp')
        if (/t\.me|telegram/i.test(messageText)) platforms.push('Telegram')
        if (/discord/i.test(messageText)) platforms.push('Discord')
        if (/youtube\.com|youtu\.be/i.test(messageText)) platforms.push('YouTube')
        if (platforms.length === 0) platforms.push('Site Web')
        
        if (setting.action === 'warn') {
            const warnKey = `${groupId}_${senderId}`
            warnStorage[warnKey] = (warnStorage[warnKey] || 0) + 1
            save()
            const warns = warnStorage[warnKey]
            
            await sendGroupEventMessage(client, groupId, 'antilink.jpg', {
                caption: `🚫 *Lien ${platforms.join('/')}*\nWarn ${warns}/3\n@${senderId.split('@')[0]}`,
                mentions: [senderId]
            })
            
            if (warns >= 3) {
                await client.groupParticipantsUpdate(groupId, [senderId], 'remove')
                await sendGroupEventMessage(client, groupId, 'antilink.jpg', {
                    caption: `⚡ *Expulsé*\n@${senderId.split('@')[0]}\n3 warns atteints`,
                    mentions: [senderId]
                })
                delete warnStorage[warnKey]
                save()
            }
            
        } else if (setting.action === 'kick') {
            await client.groupParticipantsUpdate(groupId, [senderId], 'remove')
            await sendGroupEventMessage(client, groupId, 'antilink.jpg', {
                caption: `⚡ *Expulsé*\n@${senderId.split('@')[0]}\nRaison: Lien ${platforms.join('/')}`,
                mentions: [senderId]
            })
            
        } else if (setting.action === 'delete') {
            await sendGroupEventMessage(client, groupId, 'antilink.jpg', {
                caption: `🚫 *Lien supprimé*\n@${senderId.split('@')[0]} - ${platforms.join('/')}`,
                mentions: [senderId]
            })
        }
        
    } catch (error) {
        console.error('LinkDetection error:', error.message)
    }
}

export async function resetwarns(client, message) {
    const groupId = message.key.remoteJid
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.split(/\s+/).slice(1)
    
    let target
    if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = message.message.extendedTextMessage.contextInfo.participant
    } else if (args[0]) {
        target = args[0].replace('@', '') + '@s.whatsapp.net'
    } else {
        const warnKeys = Object.keys(warnStorage).filter(key => key.startsWith(groupId + '_'))
        const count = warnKeys.length
        
        return await client.sendMessage(groupId, {
            text: `📊 *Warns:* ${count} utilisateur(s)\n\nUsage: .resetwarns @user`
        })
    }
    
    const warnKey = `${groupId}_${target}`
    if (warnStorage[warnKey]) {
        delete warnStorage[warnKey]
        save()
        await client.sendMessage(groupId, {
            text: `✅ Warns réinitialisés pour @${target.split('@')[0]}`
        })
    } else {
        await client.sendMessage(groupId, {
            text: `ℹ️ Aucun warn pour @${target.split('@')[0]}`
        })
    }
}

export async function checkwarns(client, message) {
    const groupId = message.key.remoteJid
    const warnKeys = Object.keys(warnStorage).filter(key => key.startsWith(groupId + '_'))
    
    if (warnKeys.length === 0) {
        return await client.sendMessage(groupId, {
            text: '✅ Aucun warn dans ce groupe.'
        })
    }
    
    let report = '📊 *Liste des Warns*\n\n'
    
    for (const key of warnKeys) {
        const userId = key.split('_')[1]
        const warnCount = warnStorage[key]
        report += `@${userId.split('@')[0]} : ${warnCount}/3 warns\n`
    }
    
    await client.sendMessage(groupId, { text: report })
}

export async function kick(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    
    try {
        const text = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
        const args = text.split(/\s+/).slice(1)
        let target
        
        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            target = message.message.extendedTextMessage.contextInfo.participant
        } else if (args[0]) {
            target = args[0].replace('@', '') + '@s.whatsapp.net'
        } else {
            return await client.sendMessage(groupId, { text: '❌ Réponds à un message ou mentionne.' })
        }
        
        await client.groupParticipantsUpdate(groupId, [target], 'remove')
        await sendGroupEventMessage(client, groupId, 'kick.jpg', {
            caption: `🚫 @${target.split('@')[0]} exclu.`,
            mentions: [target]
        })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

export async function kickall(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    
    try {
        const metadata = await client.groupMetadata(groupId)
        const targets = metadata.participants.filter(p => !p.admin).map(p => p.id)
        
        await client.sendMessage(groupId, { text: '⚡ SORA MD - Purge...' })
        
        for (const target of targets) {
            try {
                await client.groupParticipantsUpdate(groupId, [target], 'remove')
            } catch {}
        }
        
        await sendGroupEventMessage(client, groupId, 'kick.jpg', { caption: '✅ Purge terminée.' })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

export async function kickall2(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    
    try {
        const metadata = await client.groupMetadata(groupId)
        const targets = metadata.participants.filter(p => !p.admin).map(p => p.id)
        
        await client.sendMessage(groupId, { text: '⚡ SORA MD - One Shot...' })
        await client.groupParticipantsUpdate(groupId, targets, 'remove')
        await sendGroupEventMessage(client, groupId, 'kick.jpg', { caption: '✅ Tous exclus.' })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

export async function promote(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    
    try {
        const text = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
        const args = text.split(/\s+/).slice(1)
        let target
        
        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            target = message.message.extendedTextMessage.contextInfo.participant
        } else if (args[0]) {
            target = args[0].replace('@', '') + '@s.whatsapp.net'
        } else {
            return await client.sendMessage(groupId, { text: '❌ Réponds à un message ou mentionne.' })
        }
        
        await client.groupParticipantsUpdate(groupId, [target], 'promote')
        await sendGroupEventMessage(client, groupId, 'promote.jpg', {
            caption: `👑 @${target.split('@')[0]} promu admin.`,
            mentions: [target]
        })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

export async function demote(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    
    try {
        const text = message.message?.extendedTextMessage?.text || message.message?.conversation || ''
        const args = text.split(/\s+/).slice(1)
        let target
        
        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            target = message.message.extendedTextMessage.contextInfo.participant
        } else if (args[0]) {
            target = args[0].replace('@', '') + '@s.whatsapp.net'
        } else {
            return await client.sendMessage(groupId, { text: '❌ Réponds à un message ou mentionne.' })
        }
        
        await client.groupParticipantsUpdate(groupId, [target], 'demote')
        await sendGroupEventMessage(client, groupId, 'demote.jpg', {
            caption: `📉 @${target.split('@')[0]} retiré admin.`,
            mentions: [target]
        })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

export async function gclink(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    
    try {
        const code = await client.groupInviteCode(groupId)
        await client.sendMessage(groupId, { 
            text: `🔗 Lien du groupe:\nhttps://chat.whatsapp.com/${code}` 
        })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Impossible de générer le lien.' })
    }
}

export async function join(client, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
        const match = text.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i)
        if (match) {
            await client.groupAcceptInvite(match[1])
        }
    } catch {}
}

export async function pall(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    try {
        const metadata = await client.groupMetadata(groupId)
        const targets = metadata.participants.filter(p => !p.admin).map(p => p.id)
        await client.sendMessage(groupId, { text: '👑 Promotion de tous les membres...' })
        for (const target of targets) {
            try { await client.groupParticipantsUpdate(groupId, [target], 'promote') } catch {}
        }
        await sendGroupEventMessage(client, groupId, 'promote.jpg', { caption: '✅ Tous les membres sont admins.' })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

export async function dall(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    try {
        const metadata = await client.groupMetadata(groupId)
        const botId = client.user.id.split(':')[0]
        const targets = metadata.participants.filter(p => p.admin && !p.id.includes(botId)).map(p => p.id)
        await client.sendMessage(groupId, { text: '📉 Rétrogradation de tous les admins...' })
        for (const target of targets) {
            try { await client.groupParticipantsUpdate(groupId, [target], 'demote') } catch {}
        }
        await sendGroupEventMessage(client, groupId, 'demote.jpg', { caption: '✅ Tous les admins ont été rétrogradés.' })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

export async function mute(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    try {
        await client.groupSettingUpdate(groupId, 'announcement')
        await client.sendMessage(groupId, { text: '🔇 Groupe verrouillé (admins uniquement).' })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

export async function unmute(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    try {
        await client.groupSettingUpdate(groupId, 'not_announcement')
        await client.sendMessage(groupId, { text: '🔊 Groupe déverrouillé.' })
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

export async function bye(client, message) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    try {
        await sendGroupEventMessage(client, groupId, 'bye.jpg', { caption: '👋 Le bot quitte le groupe.' })
        await client.groupLeave(groupId)
    } catch (error) {
        await client.sendMessage(groupId, { text: '❌ Erreur' })
    }
}

// --- Réglages auto (promote / demote / left), déclenchés par les évènements du groupe ---
const autoSettings = store.autoSettings

function getGroupAutoSetting(groupId, key) {
    return autoSettings[groupId]?.[key] || false
}

async function toggleAutoSetting(client, message, key, label, cmdName) {
    const groupId = message.key.remoteJid
    if (!groupId.includes('@g.us')) return
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
    const args = text.split(/\s+/).slice(1)
    const action = args[0]?.toLowerCase()
    if (!autoSettings[groupId]) autoSettings[groupId] = {}

    if (action === 'on') {
        autoSettings[groupId][key] = true
        save()
        await client.sendMessage(groupId, { text: `✅ ${label} activé.` })
    } else if (action === 'off') {
        autoSettings[groupId][key] = false
        save()
        await client.sendMessage(groupId, { text: `❌ ${label} désactivé.` })
    } else {
        await client.sendMessage(groupId, { text: `Usage: .${cmdName} on|off` })
    }
}

export async function autoPromote(client, message) {
    await toggleAutoSetting(client, message, 'autoPromote', 'Auto-promote (les nouveaux membres sont promus admin)', 'auto-promote')
}

export async function autoDemote(client, message) {
    await toggleAutoSetting(client, message, 'autoDemote', 'Auto-demote (rétrograde les promotions non autorisées)', 'auto-demote')
}

export async function autoLeft(client, message) {
    await toggleAutoSetting(client, message, 'autoLeft', "Auto-left (le bot quitte s'il est rétrogradé)", 'auto-left')
}

export async function welcome(client, message) {
    await toggleAutoSetting(client, message, 'welcome', 'Message de bienvenue pour les nouveaux membres', 'welcomegroup')
}

// Appelé depuis Sora/crew.js sur l'évènement 'group-participants.update'
export async function handleGroupUpdate(client, update) {
    try {
        const { id: groupId, participants, action } = update
        const botId = client.user.id.split(':')[0]

        if (action === 'add') {
            if (getGroupAutoSetting(groupId, 'welcome')) {
                let groupName = ''
                try {
                    const metadata = await client.groupMetadata(groupId)
                    groupName = metadata.subject
                } catch {}

                for (const p of participants) {
                    await sendGroupEventMessage(client, groupId, 'welcome.jpg', {
                        caption: `👋 *Bienvenue* @${p.split('@')[0]} !${groupName ? `\nDans *${groupName}*` : ''}\n\nSORA MD`,
                        mentions: [p]
                    })
                }
            }

            if (getGroupAutoSetting(groupId, 'autoPromote')) {
                for (const p of participants) {
                    try { await client.groupParticipantsUpdate(groupId, [p], 'promote') } catch {}
                }
            }
        }

        if (action === 'promote' && getGroupAutoSetting(groupId, 'autoDemote')) {
            for (const p of participants) {
                if (p.includes(botId)) continue
                try { await client.groupParticipantsUpdate(groupId, [p], 'demote') } catch {}
            }
        }

        if (action === 'demote' && getGroupAutoSetting(groupId, 'autoLeft') && participants.some(p => p.includes(botId))) {
            try {
                await client.sendMessage(groupId, { text: '⚠️ Le bot a été rétrogradé, il quitte le groupe.' })
                await client.groupLeave(groupId)
            } catch {}
        }
    } catch (error) {
        console.error('handleGroupUpdate error:', error.message)
    }
}

export default { 
    kick, 
    kickall, 
    kickall2,
    promote, 
    demote, 
    gclink, 
    join,
    pall,
    dall,
    mute,
    unmute,
    bye,
    antilink, 
    linkDetection,
    resetwarns,
    checkwarns,
    autoPromote,
    autoDemote,
    autoLeft,
    welcome,
    handleGroupUpdate
                }
