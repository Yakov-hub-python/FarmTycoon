const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const logic = require('../../service/logic')
const { safeEdit } = require('../../utils/safeEdit')

async function showLootbox(ctx) {
    const user = await db.getUser(ctx.from.id, ctx.from)
    await safeEdit(ctx, texts.lootboxText(user), {
        parse_mode: 'HTML',
        ...kb.lootboxKb()
    })
}

async function openLootbox(ctx) {
    const lootboxType = ctx.match[1]
    const user = await db.getUser(ctx.from.id, ctx.from)
    const result = logic.lootbox.openLootbox(user, lootboxType)
    if (!result.ok) {
        if(result.error === 'not_enough_coins') {
            return ctx.answerCbQuery(`❌ Недостаточно монет. Нужно ${logic.format.formatShortNumber(result.price)} монет.`, { show_alert: true })
        } else if(result.error === 'invalid_lootbox') {
            return ctx.answerCbQuery('❌ Неверный кейс.', { show_alert: true })
        } else if(result.error === 'empty_drops') {
            return ctx.answerCbQuery('❌ Ошибка в конфиге, попробуйте позже', { show_alert: true })
        } else if(result.error === 'empty_seed_pool') {
            return ctx.answerCbQuery('❌ Ошибка в конфиге, попробуйте позже', { show_alert: true })
        }
        console.log('Unknown lootbox error:', result.error)
        return ctx.answerCbQuery('❌ Неизвестная ошибка, попробуйте позже', { show_alert: true })
    }
    await db.saveUser(user.id, user)
    await ctx.answerCbQuery(`${result.text}`, { show_alert: true })
    return await showLootbox(ctx)
}

module.exports = { showLootbox, openLootbox }