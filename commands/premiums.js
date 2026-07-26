import configmanager from "../utils/configmanager.js";

export async function modifyprem(client, message, action) {
    try {
        const remoteJid = message.key?.remoteJid;
        if (!remoteJid) throw new Error("Invalid remote JID.");

        const messageBody = message.message?.extendedTextMessage?.text || message.message?.conversation || '';
        const commandAndArgs = messageBody.slice(1).trim();
        const parts = commandAndArgs.split(/\s+/);
        const args = parts.slice(1);

        let participant;
        if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            participant = message.message?.extendedTextMessage?.contextInfo?.participant || message.key.participant;
        } else if (args.length > 0) {
            const jidMatch = args[0].match(/\d+/);
            if (!jidMatch) throw new Error("Invalid participant format.");
            participant = jidMatch[0] + '@s.whatsapp.net';
        } else {
            throw new Error("No participant specified.");
        }

        const list = configmanager.premiums.premiumUser;

        if (action === "add") {
            if (!list.includes(participant)) {
                list.push(participant);
                configmanager.saveP();
                await client.sendMessage(remoteJid, { text: `✅ @${participant.split('@')[0]} est maintenant premium.`, mentions: [participant] });
            } else {
                await client.sendMessage(remoteJid, { text: `ℹ️ @${participant.split('@')[0]} est déjà premium.`, mentions: [participant] });
            }
        } else if (action === "remove") {
            const index = list.indexOf(participant);
            if (index !== -1) {
                list.splice(index, 1);
                configmanager.saveP();
                await client.sendMessage(remoteJid, { text: `✅ @${participant.split('@')[0]} n'est plus premium.`, mentions: [participant] });
            } else {
                await client.sendMessage(remoteJid, { text: `ℹ️ @${participant.split('@')[0]} n'était pas premium.`, mentions: [participant] });
            }
        }
    } catch (error) {
        console.error("Error in premium list:", error);
        await client.sendMessage(message.key.remoteJid, { text: `❌ Erreur: ${error.message}` });
    }
}

export async function addprem(client, message) {
    await modifyprem(client, message, "add");
}

export async function delprem(client, message) {
    await modifyprem(client, message, "remove");
}

export function isPremium(jid) {
    return configmanager.premiums.premiumUser.includes(jid);
}

export default { addprem, delprem, isPremium };
