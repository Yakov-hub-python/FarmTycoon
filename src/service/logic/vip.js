const time = require('./time')

function isVipActive(user) {
    if (!user.vipUntil) return false
    return user.vipUntil > time.now()
}

function applyVipBonus(reward, user) {
    if (isVipActive(user)) {
        return Math.floor(reward * 1.2) // +20% к доходу
    }
    return reward
}

function addVipDays(user, days) {
    const now = time.now()
    const startFrom = user.vipUntil > now ? user.vipUntil : now
    user.vipUntil = startFrom + (days * 24 * 60 * 60)
}

module.exports = { isVipActive, applyVipBonus, addVipDays }