import configmanager from '../utils/configmanager.js';
import bug from '../commands/bug.js';

function isEmoji(str) {
    const emojiRegex = /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic})$/u;
    return emojiRegex.test(str);
}

function getArgs(message) {
    const text = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
    return text.trim().split(/\s+/).slice(1);
}

export async function setprefix(message, client) {
    const number = client.user.id.split(':')[0];
    try {
        const remoteJid = message?.key?.remoteJid;
        if (!remoteJid) throw new Error('Invalid remote JID.');

        const args = getArgs(message);

        if (!configmanager.config.users[number]) configmanager.config.users[number] = {};

        if (args.length > 0) {
            configmanager.config.users[number].prefix = args[0];
        } else {
            configmanager.config.users[number].prefix = '';
        }
        configmanager.save();
        await bug(message, client, 'prefix updated', 3);
    } catch (error) {
        await client.sendMessage(message?.key?.remoteJid, { text: `⚠️ Erreur: ${error.message}` });
    }
}

export async function setreaction(message, client) {
    const number = client.user.id.split(':')[0];
    try {
        const remoteJid = message?.key?.remoteJid;
        if (!remoteJid) throw new Error('Invalid remote JID.');

        const args = getArgs(message);

        if (args.length > 0 && isEmoji(args[0])) {
            if (!configmanager.config.users[number]) configmanager.config.users[number] = {};
            configmanager.config.users[number].reaction = args[0];
            configmanager.save();
            await bug(message, client, 'reaction updated', 3);
        } else {
            await bug(message, client, 'reaction not updated', 3);
            throw new Error('Specify the emoji.');
        }
    } catch (error) {
        await client.sendMessage(message?.key?.remoteJid, {
            text: `An error occurred while trying to modify the reaction emoji: ${error.message}`
        });
        console.log('setreaction error:', error);
    }
}

export async function setwelcome(message, client) {
    const number = client.user.id.split(':')[0];
    try {
        const remoteJid = message?.key?.remoteJid;
        if (!remoteJid) throw new Error('Invalid remote JID.');

        const args = getArgs(message);
        const action = args[0]?.toLowerCase();

        if (!configmanager.config.users[number]) configmanager.config.users[number] = {};

        if (action === 'on') {
            configmanager.config.users[number].welcome = true;
            configmanager.save();
            await bug(message, client, 'Welcome has been turn on', 5);
        } else if (action === 'off') {
            configmanager.config.users[number].welcome = false;
            configmanager.save();
            await bug(message, client, 'Welcome has been turn off', 5);
        } else {
            await bug(message, client, 'Select an option on / off', 3);
        }
    } catch (error) {
        await client.sendMessage(message?.key?.remoteJid, { text: `⚠️ Erreur: ${error.message}` });
    }
}

export async function setautorecord(message, client) {
    const number = client.user.id.split(':')[0];
    try {
        const remoteJid = message?.key?.remoteJid;
        if (!remoteJid) throw new Error('Invalid remote JID.');

        const args = getArgs(message);
        const action = args[0]?.toLowerCase();

        if (!configmanager.config.users[number]) configmanager.config.users[number] = {};

        if (action === 'on') {
            configmanager.config.users[number].record = true;
            configmanager.save();
            await bug(message, client, 'autorecord has been turn on', 5);
        } else if (action === 'off') {
            configmanager.config.users[number].record = false;
            configmanager.save();
            await bug(message, client, 'autorecord has been turn off', 5);
        } else {
            await bug(message, client, 'Select an option on / off', 3);
        }
    } catch (error) {
        await client.sendMessage(message?.key?.remoteJid, { text: `⚠️ Erreur: ${error.message}` });
    }
}

export async function setautotype(message, client) {
    const number = client.user.id.split(':')[0];
    try {
        const remoteJid = message?.key?.remoteJid;
        if (!remoteJid) throw new Error('Invalid remote JID.');

        const args = getArgs(message);
        const action = args[0]?.toLowerCase();

        if (!configmanager.config.users[number]) configmanager.config.users[number] = {};

        if (action === 'on') {
            configmanager.config.users[number].type = true;
            configmanager.save();
            await bug(message, client, 'autotype has been turn on', 5);
        } else if (action === 'off') {
            configmanager.config.users[number].type = false;
            configmanager.save();
            await bug(message, client, 'autotype has been turn off', 5);
        } else {
            await bug(message, client, 'Select an option on / off', 3);
        }
    } catch (error) {
        await client.sendMessage(message?.key?.remoteJid, { text: `⚠️ Erreur: ${error.message}` });
    }
}

export async function isPublic(message, client) {
    try {
        const number = client.user.id.split(':')[0];
        const remoteJid = message?.key?.remoteJid;
        const botLid = client.user.lid.split(':')[0];
        const prefix = configmanager.config.users[number].prefix;

        if (!configmanager.config.users[number]) return;

        const text = message?.message?.extendedTextMessage?.text || message?.message?.conversation || '';
        const action = text.slice(prefix.length).trim().split(/\s+/)[1]?.toLowerCase();
        const currentPublicMode = configmanager.config.users[number].publicMode || false;

        const isOwner = message.key.fromMe || message?.key?.participant == botLid;

        if (isOwner) {
            if (action === 'on') {
                configmanager.config.users[number].publicMode = true;
                configmanager.save();
                await client.sendMessage(remoteJid, { text: '✅ Mode public activé' });
            } else if (action === 'off') {
                configmanager.config.users[number].publicMode = false;
                configmanager.save();
                await client.sendMessage(remoteJid, { text: '❌ Mode public désactivé' });
            } else {
                await client.sendMessage(remoteJid, { text: 'Usage: .public on / off' });
            }
        } else {
            await client.sendMessage(remoteJid, { text: '> *_only my owner can use this command_*' });
        }
    } catch (error) {
        await client.sendMessage(message?.key?.remoteJid, { text: `⚠️ Cannot set the bot mode because: ${error.message}` });
        console.log('❌ Error in bot mode set:', error);
    }
}

export default { setreaction, setprefix, setwelcome, setautorecord, setautotype, isPublic };
