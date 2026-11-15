const vip = require('./vip')
const time = require('./time')

/**
 * Формирует реферальную ссылку для приглашения друзей.
 *
 * @param {number|string} userId - Telegram ID приглашающего.
 * @param {string} [botUsername='FarmTycoonGameBot'] - Юзернейм бота без `@`.
 * @returns {string} Ссылка вида `https://t.me/<bot>?start=ref_<userId>`.
 *
 * @example
 * getReferralLink(123456789)
 * // → 'https://t.me/FarmTycoonGameBot?start=ref_123456789'
 */
function getReferralLink(userId, botUsername='FarmTycoonGameBot' ) {
    return `https://t.me/${botUsername}?start=ref_${userId}`
}

/**
 * Обрабатывает переход по реферальной ссылке и начисляет награды обоим игрокам.
 *
 * Отклоняет: самореферал, повторный реферал, если новый игрок уже играет > 60 сек,
 * и если приглашающий зарегистрировался позже приглашённого.
 * Каждый 3-й успешный реферал даёт приглашающему 7 дней VIP.
 *
 * @param {Object} newUser - Данные нового игрока (мутируется).
 * @param {Object} inviter - Данные приглашающего (мутируется).
 * @param {number} [inviterReward=5000] - Монеты приглашающему.
 * @param {number} [newUserReward=1500] - Монеты новому игроку.
 * @returns {{ok: true, inviterReward: number, newUserReward: number} | {ok: false, error: 'self_referral'|'already_referred'|'already_playing'|'invalid_timing'}}
 *
 * @example
 * processReferral(newUser, inviter)
 * // → { ok: true, inviterReward: 5000, newUserReward: 1500 }
 */
function processReferral(newUser, inviter, inviterReward = 5000, newUserReward = 1500) {
    if (newUser.id === inviter.id) return { ok: false, error: 'self_referral' }
    if (newUser.referredBy) return { ok: false, error: 'already_referred' }
    if(time.now() - newUser.createdAt > 60) return { ok: false, error: 'already_playing'}
    if(newUser.createdAt > inviter.createdAt) return {ok: false, error: 'invalid_timing'}
    newUser.referredBy = inviter.id
    inviter.coin += inviterReward
    inviter.referralCount += 1
    if(inviter.referralCount % 3 === 0) {
        vip.addVipDays(inviter, 7, 'referral_bonus')
    }
    newUser.coin += newUserReward
    return { ok: true, inviterReward, newUserReward }
}

module.exports = { getReferralLink, processReferral }