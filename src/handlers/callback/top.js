const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const logic = require('../../service/logic')
const db = require('../../service/db')
const { safeEdit } = require('../../utils/safeEdit')

/**
 * Обработчик колбэка "ТОП".
 * @param {Object} ctx - Контекст Telegraf
 * @returns {Promise<void>}
 */
async function topCallback(ctx) {
    const user = await db.getUser(ctx.from.id, ctx.from)
    await ctx.answerCbQuery()
    await safeEdit(ctx, '👇 Выберите категорию 👇', {
        parse_mode: 'HTML',
        ...kb.topsKb(),
    })
}

/**
 * Обработчик колбэка "ТОП по монетам".
 * @param {Object} ctx - Контекст Telegraf
 * @returns {Promise<void>}
 */
async function topCoinsCallback(ctx) {
    const users = await db.getAllUsers()
    const topUsers = await logic.top.getTopCoins(users)
    await ctx.answerCbQuery()
    await safeEdit(ctx, texts.topCoinsText(topUsers), {
        parse_mode: 'HTML',
        ...kb.topsKb(),
    })
}

/**
 * Обработчик колбэка "ТОП по урожаю".
 * @param {Object} ctx - Контекст Telegraf
 * @returns {Promise<void>}
 */
async function topHarvestCallback(ctx) {
    const users = await db.getAllUsers()
    const topUsers = await logic.top.getTopHarvest(users)
    await ctx.answerCbQuery()
    await safeEdit(ctx, texts.topHarvestText(topUsers), {
        parse_mode: 'HTML',
        ...kb.topsKb(),
    })
}

module.exports = {
    topCallback,
    topCoinsCallback,
    topHarvestCallback
}