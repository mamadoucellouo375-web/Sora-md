export async function uptime(client, message) {
    const remoteJid = message.key.remoteJid
    const uptime = process.uptime()
    
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    
    const text = `┌─ 𝕯𝖊𝖛_𝕲𝖔𝖏𝖔𝖃𝕸𝖆𝖐𝖎𝖒𝖆_𝕽𝖊𝖉 ─┐
│
│ ⏱️ Uptime: ${days}d ${hours}h ${minutes}m
│ 💾 RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB
│
│ "Beyond limits, we rise."
│     -𝕯𝖊𝖛_𝕲𝖔𝖏𝖔𝖃𝕸𝖆𝖐𝖎𝖒𝖆-
└────────────────────┘`
    
    await client.sendMessage(remoteJid, { text: text })
}

export default uptime