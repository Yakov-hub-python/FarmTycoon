const { CROPS } = require('../config')

/**
 * Получение текущего времени в сек.
 * @returns Unix-время в сек.
 */
function now() {
    return Math.floor(Date.now() / 1000)
}

function readyAt(slot, user) {
    if (slot === null) return null
    const crop = CROPS[slot.crop]
    if (!crop) return null

    let growTime = crop.growTime
    if (user.strawHat === true) growTime *= 0.98

    const agronomy = user.upgrades?.agronomy ?? 0        // 🔑 фикс + защита
    const agronomyMult = Math.max(0.2, 1 - agronomy * 0.05)   // минимум 20%

    return slot.plantedAt + (growTime * (slot.weatherGrowth || 1.0) * agronomyMult)
}

function timeLeft(slot, user = {}) {
    const ready = readyAt(slot, user)
    if (ready === null) return 0
    return Math.max(0, ready - now())
}

function isReady(slot, user = {}) {
    if (slot === null) return false
    if (!CROPS[slot.crop]) return false
    return timeLeft(slot, user) === 0
}

module.exports = { now, readyAt, timeLeft, isReady }