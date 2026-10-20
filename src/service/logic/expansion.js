const {
    SLOT_BASE_PRICE, SLOT_PRICE_MULT, SLOT_PRICE_FIRST,
    SLOT_MAX_COUNT,
} = require('../config')

// ===== РАСШИРЕНИЕ =====

/**
 * Номер следующего слота (1-based).
 * @param {Object} user
 * @returns {number}
 */
function nextSlotNumber(user) {
    return user.slots.length + 1
}

/**
 * Цена следующего слота.
 * @param {Object} user
 * @returns {number}
 */
function nextSlotPrice(user) {
    const number = nextSlotNumber(user)
    if (number < SLOT_PRICE_FIRST) return SLOT_BASE_PRICE
    return SLOT_BASE_PRICE * SLOT_PRICE_MULT ** (number - SLOT_PRICE_FIRST)
}

/**
 * Покупка нового слота.
 * @param {Object} user
 * @returns {{ok: boolean, error?: string, price?: number, slotNumber?: number}}
 */
function expand(user) {
    const price = nextSlotPrice(user)
    if (user.slots.length >= SLOT_MAX_COUNT) {
        return { ok: false, error: 'max_count_slots' }
    }
    if (user.coin < price) {
        return { ok: false, error: 'not_enough_coins', price }
    }

    user.coin -= price
    user.slots.push(null)
    return { ok: true, price, slotNumber: user.slots.length }
}

// ===== ЭКСПОРТ =====

module.exports = {
    nextSlotNumber, nextSlotPrice, expand
}