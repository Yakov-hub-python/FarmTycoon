const logic = require('../../service/logic')
const db = require('../../service/db')
const { safeEdit } = require('../../utils/safeEdit')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')


/**
 * Экран бонуса (точка входа из меню, колбэк 'daily').
 */
async function dailyScreen(ctx){
    const user = await db.getUser(ctx.from.id)
    const state = logic.daily.getStreakState(user, logic.time.now())
    return safeEdit(ctx, texts.dailyText(user, state), {parse_mode: 'HTML', ...kb.dailyKb(state)})
}

/**
 * Забор награды (колбэк 'daily_claim').
 *
 * Поток: юзер → claim (внутри предохранитель от двойного забора) →
 * начисление и сохранение только при reward > 0 → экран пересчитывается
 * от обновлённого юзера.
 */
async function dailyCallback(ctx){
    await ctx.answerCbQuery().catch(() => {})
    const now = logic.time.now()

    const user = await db.getUser(ctx.from.id)
    const { reward } = logic.daily.claim(user, now)

    if(reward > 0){
        user.coin += reward
        await db.saveUser(ctx.from.id, user)
        await ctx.answerCbQuery(`+${logic.format.formatNumber(reward)} монет! 🔥 День ${user.streakDays}`).catch(() => {})
    }

    return dailyScreen(ctx)
}

module.exports = {
    dailyScreen,
    dailyCallback
}
