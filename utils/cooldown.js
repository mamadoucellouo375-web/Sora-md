const lastUsed = {}

/**
 * Returns true if the user can use `command` right now (and records the usage),
 * or false if they're still on cooldown.
 */
export function checkCooldown(userId, command, seconds) {
    const key = `${command}:${userId}`
    const now = Date.now()
    const last = lastUsed[key] || 0
    const remaining = seconds * 1000 - (now - last)

    if (remaining > 0) {
        return { allowed: false, remaining: Math.ceil(remaining / 1000) }
    }

    lastUsed[key] = now
    return { allowed: true, remaining: 0 }
}

export default { checkCooldown }
