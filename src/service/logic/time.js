const { CROPS } = require('../config')

// ===== ВРЕМЯ =====

/**
 * Текущее время в unix-СЕКУНДАХ.
 * @returns {number}
 */
function now() {
    return Math.floor(Date.now() / 1000)
}

/**
 * Timestamp, когда слот будет готов.
 * @param {Object|null} slot
 * @returns {number|null} null — если слот пуст или crop битый
 */
function readyAt(slot) {
    if (slot === null) return null
    const crop = CROPS[slot.crop]
    if (!crop) return null
    return slot.plantedAt + crop.growTime
}

/**
 * Сколько секунд осталось до готовности слота.
 * @param {Object|null} slot
 * @returns {number} 0 — если слот пуст или уже готов
 */
function timeLeft(slot) {
    const ready = readyAt(slot)
    if (ready === null) return 0
    return Math.max(0, ready - now())
}

/**
 * Готов ли слот к сбору.
 * @param {Object|null} slot
 * @returns {boolean} false — для null и для битого crop
 */
function isReady(slot) {
    if (slot === null) return false
    if (!CROPS[slot.crop]) return false
    return timeLeft(slot) === 0
}

module.exports = {
    now, readyAt, timeLeft, isReady
}