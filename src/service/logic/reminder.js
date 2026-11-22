const config = require('../config')
const time = require('./time')

/**
 * Собирает список созревших и несобранных слотов игрока.
 * Единственное место, где напоминалка решает «что готово»:
 * делегирует проверку time.isReady (агрономия, погода, шляпа).
 * @param {object} user - игрок с заполненным массивом slots
 * @returns {Array} слоты, у которых time.isReady === true
 */
function getReadySlots(user){
    return user.slots.filter(slot => time.isReady(slot, user))
}

/**
 * Определяет, идёт ли сейчас тихий час (напоминания не шлются).
 * Считает час от переданного unix-времени по UTC + смещение из конфига —
 * таймзона хостинга (Render) не гарантирована, UTC надёжен.
 * @param {number} nowSec - текущее время в unix-секундах
 * @returns {boolean} true, если час >= QUIET_START или < QUIET_END
 */
function isQuietHours(nowSec){
    const hour = (new Date(nowSec * 1000).getUTCHours() + config.REMINDER.TZ_OFFSET_HOURS) % 24
    return hour >= config.REMINDER.QUIET_START || hour < config.REMINDER.QUIET_END
}

/**
 * Генерирует случайный интервал до следующего напоминания, минут.
 * Случайность — чтобы «пульс» бота не совпадал у всех игроков.
 * @returns {number} целое число от REPEAT_MIN_MIN до REPEAT_MAX_MIN включительно
 */
function rollRepeatMin(){
    const span = config.REMINDER.REPEAT_MAX_MIN - config.REMINDER.REPEAT_MIN_MIN + 1
    return config.REMINDER.REPEAT_MIN_MIN + Math.floor(Math.random() * span)
}

/**
 * Главный фильтр тика: решает, можно ли слать напоминание этому игроку.
 * Проверки идут от дешёвых к дорогим; первая же неудача — короткий ответ.
 * Ничего не мутирует и ничего не сохраняет — только решение.
 * @param {object} user - игрок с полями remindEnabled, remindCount, remindNextAt
 * @param {number} nowSec - текущее время в unix-секундах
 * @returns {{ok: boolean, error?: string}} ok:true — можно слать;
 *          иначе error: 'disabled' | 'limit' | 'cooldown' | 'quiet'
 */
function canRemind(user, nowSec){
    if(user.remindEnabled !== true) return { ok: false, error: 'disabled' }
    if(user.remindCount >= config.REMINDER.MAX_PER_BATCH) return {ok: false, error: 'limit'}
    if(nowSec < user.remindNextAt) return { ok: false, error: 'cooldown' }
    if(isQuietHours(nowSec)) return { ok: false, error: 'quiet' }
    return { ok: true }
}

/**
 * Отмечает отправку напоминания: планирует следующий повтор
 * (текущее время + случайные 60–120 минут) и наращивает счётчик партии.
 * Сохранение в БД здесь НЕ делает — это дело хендлера.
 * @param {object} user - игрок, мутируется in-place
 * @param {number} nowSec - время отправки в unix-секундах
 */
function markSent(user, nowSec){
    user.remindNextAt = nowSec + rollRepeatMin() * 60
    user.remindCount = user.remindCount + 1
}

/**
 * Сбрасывает счётчик «партии» напоминаний.
 * Вызывается при сборе урожая и когда готовых слотов нет.
 * @param {object} user - игрок, мутируется in-place (remindNextAt = 0, remindCount = 0)
 */
function resetBatch(user){
    user.remindNextAt = 0
    user.remindCount = 0
}

module.exports = {getReadySlots, isQuietHours, rollRepeatMin, canRemind, markSent, resetBatch}