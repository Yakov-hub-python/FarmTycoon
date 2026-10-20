const db = require('../../service/db')
const logic = require('../../service/logic')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const { safeEdit } = require('../../utils/safeEdit')
const { CROPS } = require('../../service/config')


async function renderFarm(ctx, user) {
    await safeEdit(ctx, texts.farmText(user), {
        parse_mode: 'HTML',
        ...kb.farmKb(user),
    })
}


async function farmCallback(ctx) {
    const user = await db.getUser(ctx.from.id)
    await ctx.answerCbQuery()
    await renderFarm(ctx, user)
}


async function plantCallback(ctx) {
    const cropKey = ctx.match[1]

    const user = await db.getUser(ctx.from.id)
    if( user.username === 'unknown' || user.first_name !== ctx.from.first_name) {
        user.username = ctx.from.username || 'unknown'
        user.firstName = ctx.from.first_name || 'unknown'
        await db.saveUser(ctx.from.id, user)
    }
    const res = logic.plant.plant(user, cropKey)

    if (res.ok) {
        await db.saveUser(ctx.from.id, user)
        await ctx.answerCbQuery(
            `Посажено! Созреет через ${logic.format.formatTime(CROPS[cropKey].growTime)}`
        )
    } else {
        await ctx.answerCbQuery(
            texts.PLANT_ERRORS[res.error] || 'Ошибка',
            { show_alert: true }
        )
    }

    await renderFarm(ctx, user)
}


async function slotCallback(ctx) {
    const index = parseInt(ctx.match[1], 10)

    const user = await db.getUser(ctx.from.id)
    const res = logic.plant.harvestSlot(user, index)

    if (!res.ok) {
        if (res.error === 'not_ready') {
            await ctx.answerCbQuery(`⏳ Ещё ${logic.format.formatTime(res.left)}`)
        } else if (res.error === 'empty') {
            await ctx.answerCbQuery('🌱 Слот пуст — посади что-нибудь')
        } else {
            await ctx.answerCbQuery('Ошибка')
        }
        await renderFarm(ctx, user)
        return
    }

    await db.saveUser(ctx.from.id, user)
    await ctx.answerCbQuery()
    await safeEdit(
        ctx,
        texts.harvestText([res.item], user.coin),
        { parse_mode: 'HTML', ...kb.afterHarvestKb() }
    )
}


async function harvestAllCallback(ctx) {
    const user = await db.getUser(ctx.from.id)
    const items = logic.plant.harvestAll(user)

    if (items.length === 0) {
        await ctx.answerCbQuery('⏳ Пока нечего собирать', { show_alert: true })
        return
    }

    await db.saveUser(ctx.from.id, user)
    await ctx.answerCbQuery()
    await safeEdit(
        ctx,
        texts.harvestText(items, user.coin),
        { parse_mode: 'HTML', ...kb.afterHarvestKb() }
    )
}


async function expandCallback(ctx) {
    const user = await db.getUser(ctx.from.id)
    const res = logic.expansion.expand(user)

    if (res.ok) {
        await db.saveUser(ctx.from.id, user)
        await ctx.answerCbQuery(`🟫 Куплен слот №${res.slotNumber}!`)
    } else {
        if(res.error === 'max_count_slots'){
            await ctx.answerCbQuery(
                `🌱 Достигнут максимальный объем слотов`,
                { show_alert: true }
            ) 
        } 
        if(res.error === 'not_enough_coins'){
            await ctx.answerCbQuery(
                `💰 Не хватает монет. Нужно ${logic.format.formatNumber(res.price)}`,
                { show_alert: true }
            )
        }
        
    }

    await renderFarm(ctx, user)
}


module.exports = {
    farmCallback,
    plantCallback,
    slotCallback,
    harvestAllCallback,
    expandCallback,
}