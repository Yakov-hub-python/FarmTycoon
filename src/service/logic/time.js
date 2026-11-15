const { CROPS } = require('../config')

/**
 * Возвращает текущее Unix-время в секундах.
 *
 * @returns {number} Целое число секунд с 1970-01-01.
 *
 * @example
 * now() // → 1763222400
 */
function now() {
    return Math.floor(Date.now() / 1000)
}

/**
 * Вычисляет момент, когда урожай в слоте будет готов к сбору.
 *
 * Учитывает: базовое время роста культуры, соломенную шляпу (-2%),
 * уровень агрономии (мин. 20% от базового) и погодный множитель слота.
 *
 * @param {{crop: string, plantedAt: number, weatherGrowth?: number}|null} slot - Слот фермы.
 * @param {Object} user - Данные игрока.
 * @param {boolean} [user.strawHat] - Активна ли соломенная шляпа.
 * @param {Object} [user.upgrades] - Уровни улучшений (используется `agronomy`).
 * @returns {number|null} Unix-время в секундах готовности или `null`, если слот пуст/культура неизвестна.
 *
 * @example
 * readyAt({ crop: 'wheat', plantedAt: 1763222400 }, user) // → 1763222500
 */
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

/**
 * Сколько секунд осталось до готовности урожая в слоте.
 *
 * @param {{crop: string, plantedAt: number, weatherGrowth?: number}|null} slot - Слот фермы.
 * @param {Object} [user={}] - Данные игрока (см. {@link readyAt}).
 * @returns {number} Неотрицательное число секунд (0, если уже готово или слот пуст).
 *
 * @example
 * timeLeft(slot, user) // → 120
 */
function timeLeft(slot, user = {}) {
    const ready = readyAt(slot, user)
    if (ready === null) return 0
    return Math.max(0, ready - now())
}

/**
 * Проверяет, готов ли урожай в слоте к сбору прямо сейчас.
 *
 * @param {{crop: string, plantedAt: number, weatherGrowth?: number}|null} slot - Слот фермы.
 * @param {Object} [user={}] - Данные игрока.
 * @returns {boolean} `true`, если слот не пуст, культура известна и время вышло.
 *
 * @example
 * isReady(slot, user) // → false
 */
function isReady(slot, user = {}) {
    if (slot === null) return false
    if (!CROPS[slot.crop]) return false
    return timeLeft(slot, user) === 0
}

module.exports = { now, readyAt, timeLeft, isReady }