const config = require('../config')

const REWARDS = config.STREAK_REWARDS
const TZ_OFFSET = config.STREAK_TZ_OFFSET_HOURS

/**
 * Возвращает ключ календарного дня 'YYYY-MM-DD' по UTC + смещение из конфига.
 * toISOString всегда отдаёт UTC, поэтому время сдвигается ДО формирования строки.
 * Локальную таймзону контейнера (Render) сознательно не используем.
 *
 * @param {number} unixSec - Unix-время в секундах.
 * @returns {string} Ключ дня вида '2026-11-23'.
 *
 * @example
 * dayKey(1795478400) // '2026-11-23'
 */
function dayKey(unixSec){
    return new Date((unixSec + TZ_OFFSET * 3600) * 1000).toISOString().slice(0, 10)
}

/**
 * Считает состояние ежедневной серии входов.
 *
 * Серия живёт по календарной дате (UTC+3), а не «24 часа с последнего забора»:
 * забор в 23:50 и забор в 00:10 следующего дня — это два разных дня серии.
 * Серия продолжается, только если последний забор был «вчера» (или сегодня).
 * Пропуск полного календарного дня сбрасывает серию на 1.
 * Дни выше длины таблицы наград дают последнюю (максимальную) награду.
 *
 * @param {Object} user - Данные игрока.
 * @param {number} user.streakDays - Текущая серия.
 * @param {number} user.streakBest - Рекорд серии.
 * @param {number} user.streakLastClaim - Unix-время (сек) последнего забора, 0 = никогда.
 * @param {number} nowSec - Текущее Unix-время в секундах (time.now()).
 * @returns {{canClaim: boolean, day: number, continues: boolean, nextReward: number}}
 *   `canClaim` — доступен ли забор сегодня; `day` — день серии (1..7);
 *   `continues` — серия не оборвана; `nextReward` — награда за текущий день.
 *
 * @example
 * // Забирал вчера, серия 3:
 * getStreakState(user, time.now()) // { canClaim: true, day: 4, continues: true, nextReward: 700 }
 * // Забирал сегодня:
 * getStreakState(user, time.now()) // { canClaim: false, day: 3, continues: true, nextReward: 700 }
 */
function getStreakState(user, nowSec){
    const today = dayKey(nowSec)
    const yesterday = dayKey(nowSec - 24 * 60 * 60)
    const wasToday = user.streakLastClaim > 0 && dayKey(user.streakLastClaim) === today
    const wasYesterday = user.streakLastClaim > 0 && dayKey(user.streakLastClaim) === yesterday
    const canClaim = !wasToday
    const day = canClaim
        ? (wasYesterday ? Math.min(user.streakDays + 1, REWARDS.length) : 1)
        : Math.min(user.streakDays, REWARDS.length)
    return {
        canClaim,
        day,
        continues: wasToday || wasYesterday,
        nextReward: REWARDS[day - 1]
    }
}

/**
 * Проводит забор ежедневной награды: двигает поля серии.
 *
 * Вызывается ТОЛЬКО после проверки getStreakState().canClaim в обработчике,
 * но содержит защитный предохранитель от гонок: если забор уже был сегодня,
 * возвращает reward: 0 и не мутирует ничего.
 *
 * @param {Object} user - Данные игрока (мутируются поля streakDays / streakBest / streakLastClaim).
 * @param {number} nowSec - Текущее Unix-время в секундах.
 * @returns {{reward: number}} Начисляемая награда в монетах (0 — если забор недоступен).
 *
 * @example
 * claim(user, time.now()) // { reward: 200 }
 */
function claim(user, nowSec){
    const state = getStreakState(user, nowSec)
    if(!state.canClaim) return { reward: 0 }
    user.streakDays = state.day
    user.streakBest = Math.max(user.streakBest, state.day)
    user.streakLastClaim = nowSec
    return { reward: state.nextReward }
}

module.exports = {
    dayKey,
    getStreakState,
    claim
}
