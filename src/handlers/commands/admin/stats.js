const { isAdmin } = require('../../../utils/isAdmin')
const db = require('../../../service/db')
const logic = require('../../../service/logic')
const texts = require('../../../utils/texts')

const DAY = 24 * 60 * 60

async function statsHandler(ctx) {
    if (!isAdmin(ctx)) return

    const users = await db.getAllUsers()
    const countUsers = users.length
    const now = logic.time.now()

    if (countUsers === 0) {
        return ctx.reply('📊 База данных пуста.')
    }

    // ===== ИГРОКИ =====
    let activeUsers = 0
    let newUsers = 0
    for (const user of users) {
        if (now - user.last_collection < DAY) activeUsers++
        if (now - user.createdAt < DAY) newUsers++
    }

    // ===== ЭКОНОМИКА =====
    let totalBalance = 0
    let totalCountSlots = 0
    let userMaxBalance = { name: 'Нет', coin: 0 }

    for (const user of users) {
        totalBalance += user.coin
        totalCountSlots += user.slots.length
        
        if (user.coin > userMaxBalance.coin) {
            userMaxBalance = { name: texts.displayName(user), coin: user.coin }
        }
    }

    const averageBalance = Math.round(totalBalance / countUsers)
    const averageCountSlots = Math.round(totalCountSlots / countUsers)

    // ===== VIP =====
    let countVIPUsers = 0
    let totalTimeVIP = 0

    for (const user of users) {
        if (now < user.vipUntil) {
            countVIPUsers++
            totalTimeVIP += (user.vipUntil - now)
        }
    }

    // Защита от деления на ноль
    const averageLeftTimeVIP = countVIPUsers > 0 ? (totalTimeVIP / countVIPUsers) : 0

    // ===== ФОРМИРОВАНИЕ ТЕКСТА =====
    const text = `<b>📊 Статистика бота</b>\n\n` +
        `<i>Игроки</i>\n` +
        `├ Всего: <b>${countUsers}</b>\n` +
        `├ Активных за 24ч: <b>${activeUsers}</b>\n` +
        `└ Новых за 24ч: <b>${newUsers}</b>\n\n` +
        
        `<i>Экономика</i>\n` +
        `├ Суммарный баланс: <b>${logic.format.formatNumber(totalBalance)}</b>\n` +
        `├ Средний баланс: <b>${logic.format.formatNumber(averageBalance)}</b>\n` +
        `├ Макс. баланс: <b>${logic.format.formatNumber(userMaxBalance.coin)}</b> (${userMaxBalance.name})\n` +
        `└ Среднее число слотов: <b>${averageCountSlots}</b>\n\n` +
        
        `<i>VIP</i>\n` +
        `├ Активных VIP: <b>${countVIPUsers}</b>\n` +
        `└ Средний остаток: <b>${logic.format.formatTime(averageLeftTimeVIP)}</b>`

    return ctx.reply(text, { parse_mode: 'HTML' })
}

module.exports = { statsHandler }