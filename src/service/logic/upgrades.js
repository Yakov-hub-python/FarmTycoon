const config = require('../config')
const time = require('./time')

function getUpgradePrice(user, key) {
    const lab = config.LAB_UPGRADES
    if (!(key in lab)) return null
    const level = user.upgrades?.[key] ?? 0
    if (level >= lab[key].maxLevel) return null
    return Math.round(lab[key].basePrice * Math.pow(lab[key].priceMultiplier, level))
}

function getUpgradeCooldownLeft(user, key) {
    const until = user.upgradeCooldowns?.[key] ?? 0
    return Math.max(0, until - time.now())
}

function canBuyUpgrade(user, key) {
    const lab = config.LAB_UPGRADES
    if (!(key in lab)) {
        return { ok: false, error: 'invalid_key' }
    }
    const cfg = lab[key]
    const level = user.upgrades?.[key] ?? 0

    if (level >= cfg.maxLevel) {
        return { ok: false, error: 'max_level' }
    }

    const leftSec = getUpgradeCooldownLeft(user, key)
    if (leftSec > 0) {
        return { ok: false, error: 'cooldown', leftSec }
    }

    const price = getUpgradePrice(user, key)
    if (user.coin < price) {
        return { ok: false, error: 'not_enough_coins', price }
    }

    return { ok: true, price }
}

function buyUpgrade(user, key) {
    const res = canBuyUpgrade(user, key)
    if (!res.ok) return res

    const lab = config.LAB_UPGRADES[key]
    const price = res.price

    if (key === 'land') {
        if (user.slots.length >= config.SLOT_TOTAL_MAX) {
            return { ok: false, reason: 'max_slots' }
        }
    }

    user.coin -= price
    user.upgrades[key] += 1
    user.upgradeCooldowns[key] = time.now() + lab.cooldownSec

    if (key === 'land') {
        user.slots.push(null)
    }

    console.log(`[LAB] user=${user.id} key=${key} lvl=${user.upgrades[key]} cost=${price} slots=${user.slots.length}`)

    return { ok: true, price, newLevel: user.upgrades[key] }
}

module.exports = { getUpgradePrice, getUpgradeCooldownLeft, canBuyUpgrade, buyUpgrade }