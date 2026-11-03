const time = require('./time')
const vip = require('./vip')

/**
 * Активирует промокод для игрока.
 * @param {Object} user 
 * @param {Object} db - Вся база данных (чтобы проверить лимиты и сохранить)
 * @param {string} code 
 * @returns {{ ok: boolean, error?: string, rewardText?: string }}
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
        vip.addVipDays(user, promo.amount)
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