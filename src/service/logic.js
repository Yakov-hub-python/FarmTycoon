// ИМПОРТЫ
const {
    CROPS, MUTATIONS, MUTATION_ROLL_ORDER,
    SLOT_BASE_PRICE, SLOT_PRICE_MULT, SLOT_PRICE_FIRST,
    SLOT_MAX_COUNT,
} = require('./config')
const { getUser } = require('../service/db')
// ===== ФОРМАТИРОВАНИЕ =====

/**
 * Форматирует число с разделителем тысяч.
 * @param {number|string} n - Исходное число
 * @returns {string} Строка вида '1.000'
 */
function formatNumber(n) {
    return Number(n).toLocaleString('de-DE')
}

/**
 * Форматирует секунды в человекочитаемую строку.
 * @param {number} seconds
 * @returns {string} '15 сек.' | '1 мин. 30 сек.' | '1 ч. 10 мин.'
 */
function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0))

    if (total < 60) {
        return `${total} сек.`
    }

    const minutes = Math.floor(total / 60)
    const secs = total % 60

    if (total < 3600) {
        const parts = []
        if (minutes > 0) parts.push(`${minutes} мин.`)
        if (secs > 0) parts.push(`${secs} сек.`)
        return parts.join(' ')
    }

    const hours = Math.floor(total / 3600)
    const remainingMinutes = Math.floor((total % 3600) / 60)
    const parts = []
    if (hours > 0) parts.push(`${hours} ч.`)
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} мин.`)
    return parts.join(' ')
}

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

// ===== МУТАЦИИ =====

/**
 * Рандомный выбор мутации по шансам.
 * @returns {'common'|'silver'|'gold'}
 */
function rollMutation() {
    const random = Math.random()
    let total = 0
    for (const key of MUTATION_ROLL_ORDER) {
        total += MUTATIONS[key].chance
        if (random < total) return key
    }
    return MUTATION_ROLL_ORDER[MUTATION_ROLL_ORDER.length - 1]
}

/**
 * Награда за культуру с учётом мутации.
 * @param {string} cropKey
 * @param {string} mutation
 * @returns {number}
 * @throws {Error} Если cropKey или mutation неизвестны
 */
function rewardForMutation(cropKey, mutation) {
    if (!CROPS[cropKey]) throw new Error(`Неизвестное cropKey: ${cropKey}`)
    if (!MUTATIONS[mutation]) throw new Error(`Неизвестное mutation: ${mutation}`)
    return Math.round(CROPS[cropKey].sell * MUTATIONS[mutation].mult)
}

// ===== ПОСАДКА =====

/**
 * Покупка и посадка растения в первый свободный слот.
 * @param {Object} user
 * @param {string} cropKey
 * @returns {{ok: boolean, error?: string, slot?: number, crop?: string}}
 */
function plant(user, cropKey) {
    if (!CROPS[cropKey]) return { ok: false, error: 'unknown_crop' }

    const index = user.slots.indexOf(null)
    if (index === -1) return { ok: false, error: 'no_free_slots' }

    const seed = CROPS[cropKey].seed
    if (user.coin < seed) return { ok: false, error: 'not_enough_coins' }

    user.coin -= seed
    user.slots[index] = { crop: cropKey, plantedAt: now() }
    return { ok: true, slot: index, crop: cropKey }
}

// ===== СБОР =====

/**
 * Сбор урожая с одного слота.
 * @param {Object} user
 * @param {number} index
 * @returns {{ok: boolean, error?: string, left?: number, item?: {crop: string, mutation: string, reward: number}}}
 */
function harvestSlot(user, index) {
    if (index < 0 || index >= user.slots.length) {
        return { ok: false, error: 'bad_slot' }
    }

    const slot = user.slots[index]
    if (slot === null) return { ok: false, error: 'empty' }

    const left = timeLeft(slot)
    if (left > 0) return { ok: false, error: 'not_ready', left }

    const mutation = rollMutation()
    const reward = rewardForMutation(slot.crop, mutation)

    user.coin += reward
    user.slots[index] = null

    return {
        ok: true,
        item: { crop: slot.crop, mutation, reward },
    }
}

/**
 * Сбор со всех готовых слотов.
 * @param {Object} user
 * @returns {Array<{crop: string, mutation: string, reward: number}>}
 */
function harvestAll(user) {
    const items = []
    for (let i = 0; i < user.slots.length; i++) {
        const res = harvestSlot(user, i)
        if (res.ok) items.push(res.item)
    }
    return items
}

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
    formatNumber, formatTime,
    now, readyAt, timeLeft, isReady,
    rollMutation, rewardForMutation,
    plant, harvestSlot, harvestAll,
    nextSlotNumber, nextSlotPrice, expand,
}