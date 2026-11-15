const time = require('./time')
const vip = require('./vip')

/**
 * Активирует промокод для игрока: проверяет существование, лимит и повторное использование.
 *
 * При успехе сразу начисляет награду (`vip` или `coins`), добавляет код в `user.usedPromos`
 * и увеличивает счётчик использований промокода в `db.promos`.
 *
 * @param {Object} user - Данные игрока (мутируется).
 * @param {Object} db - Вся база данных (для проверки лимитов).
 * @param {string} code - Промокод (регистр не важен — приводится к верхнему).
 * @returns {{ok: true, rewardText: string} | {ok: false, error: 'not_found'|'limit_reached'|'already_used'}}
 *
 * @example
 * activatePromo(user, db, 'autumn2025')
 * // → { ok: true, rewardText: '💎 VIP на 3 дн.' }
 */
function activatePromo(user, db, code) {
    code = code.toUpperCase() // Приводим к верхнему регистру
    
    if (!db.promos) db.promos = {}

    const promo = db.promos[code]
    if (!promo) return { ok: false, error: 'not_found' }
    
    // Проверяем лимит
    if (promo.limit > 0 && promo.uses >= promo.limit) {
        return { ok: false, error: 'limit_reached' }
    }

    // Проверяем, не использовал ли уже
    if (!user.usedPromos) user.usedPromos = []
    if (user.usedPromos.includes(code)) {
        return { ok: false, error: 'already_used' }
    }

    // Выдаем награду
    let rewardText = ''
    if (promo.type === 'vip') {
        vip.addVipDays(user, promo.amount, 'promo_' + code)
        rewardText = `💎 VIP на ${promo.amount} дн.`
    } else if (promo.type === 'coins') {
        user.coin += promo.amount
        rewardText = `💰 ${promo.amount} монет`
    }

    // Записываем использование
    user.usedPromos.push(code)
    promo.uses += 1

    return { ok: true, rewardText }
}

module.exports = { activatePromo }