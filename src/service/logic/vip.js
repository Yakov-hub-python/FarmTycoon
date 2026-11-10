const time = require('./time')
const config = require('../config')

function isVipActive(user) {
    if (!user.vipUntil) return false
    return user.vipUntil > time.now()
}

function applyVipBonus(reward, user) {
    if (isVipActive(user)) {
        return Math.floor(reward * config.VIP_BONUS_MULT)
    }
    return reward
}

function addVipDays(user, days, source = 'unknown') {
    const now = time.now()
    const startFrom = user.vipUntil > now ? user.vipUntil : now
    user.vipUntil = startFrom + (days * 24 * 60 * 60)

    const resultDate = new Date(user.vipUntil * 1000).toISOString().slice(0, 16).replace('T', ' ')
    console.log(`[VIP] user=${user.id} +${days}d source=${source} result=${resultDate}`)
}

module.exports = { isVipActive, applyVipBonus, addVipDays }