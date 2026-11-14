const db = require('../../service/db')
const { safeEdit } = require('../../utils/safeEdit')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const logic = require('../../service/logic')

async function showLab(ctx) {
    const user = await db.getUser(ctx.from.id)
    const text = texts.upgradeText(user)
    const keyboard = kb.upgradeKb(user)

    if (ctx.callbackQuery) {
        await safeEdit(ctx, text, { parse_mode: 'HTML', ...keyboard })
    } else {
        await ctx.reply(text, { parse_mode: 'HTML', ...keyboard })
    }
}

async function showUpgrade(ctx) {
    const [, action, key] = ctx.match
    const user = await db.getUser(ctx.from.id)

    if (action === 'buy') {
        const res = logic.upgrades.buyUpgrade(user, key)
        if (res.ok) {
            await db.saveUser(user.id, user)
            await ctx.answerCbQuery('✅ Куплено!')
            await safeEdit(ctx, texts.upgradeText(user), { parse_mode: 'HTML', ...kb.upgradeKb(user) })
        } else {
            const map = {
                cooldown: `⏱ Через ${logic.format.formatTime(res.leftSec)}`,
                not_enough_coins: '💰 Не хватает монет',
                max_level: '✅ Максимум',
                invalid_key: '❌ Ошибка',
            }
            await ctx.answerCbQuery(map[res.error] || '❌ Ошибка')
            await safeEdit(ctx, texts.upgradeText(user), { parse_mode: 'HTML', ...kb.upgradeKb(user) })
        }
        return
    }

    if (action === 'cd') {
        const left = logic.upgrades.getUpgradeCooldownLeft(user, key)
        await ctx.answerCbQuery(`⏱ Через ${logic.format.formatTime(left)}`)
        return
    }

    if (action === 'poor') {
        const price = logic.upgrades.getUpgradePrice(user, key)
        const need = Math.max(0, price - user.coin)
        await ctx.answerCbQuery(`💰 Не хватает ${logic.format.formatNumber(need)} монет`)
        return
    }
}

async function updateUpgrade(ctx) {
    const user = await db.getUser(ctx.from.id)
    await ctx.answerCbQuery()
    await safeEdit(ctx, texts.upgradeText(user), {parse_mode: 'HTML', ...kb.upgradeKb(user)})
}

async function maxUpgrade(ctx) {
    await ctx.answerCbQuery('Максимальный уровень')
}

module.exports = {
    showLab,
    showUpgrade,
    updateUpgrade,
    maxUpgrade,
}