async function bug(message, client, texts, num) {
    try {
        const remoteJid = message.key?.remoteJid;

        await client.sendMessage(remoteJid, {
            text: `> ${texts}`
        });

    } catch (e) {
        console.log(e)
    }
}

export default bug;
