const config = require('../config')
const time = require('./time')

/**
 * Считает стоимость следующего уровня улучшения лаборатории.
 *
 * Формула: `basePrice × priceMultiplier^currentLevel`, округление до целого.
 *
 * @param {Object} user - Данные игрока.
 * @param {string} key - Ключ улучшения (`genetics`, `selection`, `agronomy`, `land`).
 * @returns {number|null} Цена в монетах или `null`, если ключ неизвестен или достигнут максимум.
 *
 * @example
 * getUpgradePrice(user, 'genetics') // → 1500
 */
function getUpgradePrice(user, key) {
    const lab = config.LAB_UPGRADES
    if (!(key in lab)) return null
    const level = user.upgrades?.[key] ?? 0
    if (level >= lab[key].maxLevel) return null
    return Math.round(lab[key].basePrice * Math.pow(lab[key].priceMultiplier, level))
}

/**
 * Сколько секунд осталось до конца кулдауна на покупку конкретного улучшения.
 *
 * @param {Object} user - Данные игрока (поле `upgradeCooldowns`).
 * @param {string} key - Ключ улучшения.
 * @returns {number} Неотрицательное число секунд (0 — можно покупать).
 *
 * @example
 * getUpgradeCooldownLeft(user, 'land') // → 42
 */
function getUpgradeCooldownLeft(user, key) {
    const until = user.upgradeCooldowns?.[key] ?? 0
    return Math.max(0, until - time.now())
}

/**
 * Комплексная проверка: можно ли купить улучшение прямо сейчас.
 *
 * Проверяет: существование ключа, максимальный уровень, кулдаун и достаточность монет.
 *
 * @param {Object} user - Данные игрока.
 * @param {string} key - Ключ улучшения.
 * @returns {{ok: true, price: number} | {ok: false, error: 'invalid_key'|'max_level'|'cooldown'|'not_enough_coins', leftSec?: number, price?: number}}
 *
 * @example
 * canBuyUpgrade(user, 'genetics')
 * // → { ok: false, error: 'cooldown', leftSec: 120 }
 */
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

/**
 * Покупает улучшение: списывает монеты, повышает уровень, ставит кулдаун.
 *
 * Для `land` дополнительно проверяет лимит слотов и добавляет новый пустой слот.
 * ⚠️ Функция **не сохраняет** пользователя — это должен делать вызывающий хендлер.
 *
 * @param {Object} user - Данные игрока (мутируется).
 * @param {string} key - Ключ улучшения.
 * @returns {{ok: true, price: number, newLevel: number} | {ok: false, error?: string, reason?: string, leftSec?: number, price?: number}}
 *
 * @example
 * buyUpgrade(user, 'land')
 * // → { ok: true, price: 5000, newLevel: 3 }
 */
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