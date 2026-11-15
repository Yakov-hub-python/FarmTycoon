const time = require('./time')
const config = require('../config')

/**
 * Проверяет, активен ли у игрока VIP-статус прямо сейчас.
 *
 * @param {Object} user - Данные игрока.
 * @param {number} [user.vipUntil] - Unix-время (сек) окончания VIP.
 * @returns {boolean} `true`, если `vipUntil` в будущем.
 *
 * @example
 * isVipActive({ vipUntil: 1763308800 }) // → true
 */
function isVipActive(user) {
    if (!user.vipUntil) return false
    return user.vipUntil > time.now()
}

/**
 * Применяет VIP-множитель к награде, если у игрока активен VIP.
 *
 * @param {number} reward - Базовая награда.
 * @param {Object} user - Данные игрока.
 * @returns {number} Награда с учётом `config.VIP_BONUS_MULT` (округление вниз) или исходная.
 *
 * @example
 * applyVipBonus(1000, { vipUntil: future }) // → 1500
 */
function applyVipBonus(reward, user) {
    if (isVipActive(user)) {
        return Math.floor(reward * config.VIP_BONUS_MULT)
    }
    return reward
}

/**
 * Добавляет игроку дни VIP. Если VIP уже активен — продлевает от текущей даты окончания.
 *
 * @param {Object} user - Данные игрока (мутируется: `vipUntil`).
 * @param {number} days - Количество дней для добавления.
 * @param {string} [source='unknown'] - Метка источника (для логов: `event_lootbox`, `promo_XXX` и т.д.).
 * @returns {void}
 *
 * @example
 * addVipDays(user, 7, 'referral_bonus')
 */
function addVipDays(user, days, source = 'unknown') {
    const now = time.now()
    const startFrom = user.vipUntil > now ? user.vipUntil : now
    user.vipUntil = startFrom + (days * 24 * 60 * 60)

    const resultDate = new Date(user.vipUntil * 1000).toISOString().slice(0, 16).replace('T', ' ')
    console.log(`[VIP] user=${user.id} +${days}d source=${source} result=${resultDate}`)
}

module.exports = { isVipActive, applyVipBonus, addVipDays }