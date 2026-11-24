const { isAdmin } = require('../../../utils/isAdmin')
const db = require('../../../service/db')
const logic = require('../../../service/logic')
const texts = require('../../../utils/texts')
const { CROPS } = require('../../../service/config')

const DAY = 24 * 60 * 60

async function statsHandler(ctx) {
    if (!isAdmin(ctx)) return

    const users = await db.getAllUsers()
    const countUsers = users.length
    const now = logic.time.now()

    if (countUsers === 0) {
        return ctx.reply('📊 База данных пуста.')
    }

    // ===== ИНИЦИАЛИЗАЦИЯ ПЕРЕМЕННЫХ =====
    let activeUsers = 0
    let newUsers = 0
    let inactiveUsers = 0
    let referredUsers = 0
    let totalBalance = 0
    let totalSlots = 0
    let busySlots = 0
    let totalUpgrades = 0
    let totalInGroundValue = 0
    
    let maxBalance = { name: 'Нет', value: 0 }
    let topReferrer = { name: 'Нет', count: 0 }
    
    let countVIP = 0
    let totalTimeVIP = 0

    // ===== ПРОХОД ПО БАЗЕ =====
    for (const user of users) {
        // 1. Игроки (Считаем активным, если собирал бонус ИЛИ сажал за последние 24ч ИЛИ покупал апгрейд)
        const hasRecentPlant = user.slots.some(s => s && (now - s.plantedAt < DAY))
        const hasRecentUpgrade = Object.values(user.upgradeCooldowns || {}).some(cd => cd > now)
        const isRecentlyActive = (now - user.last_collection < DAY) || hasRecentPlant || hasRecentUpgrade

        if (isRecentlyActive) activeUsers++
        if (now - user.createdAt < DAY) newUsers++
        if (!isRecentlyActive && (now - user.createdAt > DAY * 7)) inactiveUsers++

        // 2. Рефералы
        if (user.referredBy) referredUsers++
        if ((user.referralCount || 0) > topReferrer.count) {
            topReferrer = { name: texts.displayName(user), count: user.referralCount }
        }

        // 3. Экономика (Баланс)
        totalBalance += user.coin
        if (user.coin > maxBalance.value) {
            maxBalance = { name: texts.displayName(user), value: user.coin }
        }

        // 4. Экономика (Грядки)
        totalSlots += user.slots.length
        for (const slot of user.slots) {
            if (slot !== null) {
                busySlots++
                const crop = CROPS[slot.crop]
                // Защита от NaN: проверяем, что у растения есть все нужные поля
                if (crop && crop.minWeightKG && crop.maxWeightKG && crop.pricePerKG) {
                    const avgWeight = (crop.minWeightKG + crop.maxWeightKG) / 2
                    totalInGroundValue += (avgWeight * crop.pricePerKG)
                }
            }
        }

        // 5. Прогресс (Лаборатория)
        const upgs = user.upgrades || {}
        totalUpgrades += (upgs.genetics || 0) + (upgs.selection || 0) + (upgs.agronomy || 0) + (upgs.land || 0)

        // 6. VIP
        if (now < user.vipUntil) {
            countVIP++
            totalTimeVIP += (user.vipUntil - now)
        }
    }

    // ===== РАСЧЕТЫ =====
    const avgBalance = Math.round(totalBalance / countUsers)
    const avgSlots = (totalSlots / countUsers).toFixed(1)
    const avgLeftVIP = countVIP > 0 ? Math.round(totalTimeVIP / countVIP) : 0
    
    // Округляем стоимость земли, чтобы избежать бага с дробными числами в formatShortNumber
    const roundedInGroundValue = Math.round(totalInGroundValue)

    // ===== ФОРМИРОВАНИЕ ТЕКСТА =====
    const text = `<b>📊 Статистика бота</b>\n\n` +
        
        `<i>👥 Игроки</i>\n` +
        `├ Всего: <b>${countUsers}</b>\n` +
        `├ Активных за 24ч: <b>${activeUsers}</b>\n` +
        `├ Новых за 24ч: <b>${newUsers}</b>\n` +
        `└ Спящих (7+ дней): <b>${inactiveUsers}</b>\n\n` +
        
        `<i>🤝 Рефералы</i>\n` +
        `├ Пришло по ссылкам: <b>${referredUsers}</b>\n` +
        `└ Топ реферер: <b>${topReferrer.name}</b> (${topReferrer.count} чел.)\n\n` +

        `<i>💰 Экономика</i>\n` +
        `├ Суммарный баланс: <b>${logic.format.formatShortNumber(totalBalance)}</b>\n` +
        `├ Средний баланс: <b>${logic.format.formatShortNumber(avgBalance)}</b>\n` +
        `├ Макс. баланс: <b>${logic.format.formatShortNumber(maxBalance.value)}</b> (${maxBalance.name})\n` +
        `├ В земле (примерно): <b>${logic.format.formatShortNumber(roundedInGroundValue)}</b>\n` +
        `└ Слотов занято: <b>${busySlots}</b> / ${totalSlots} (в среднем ${avgSlots} на игрока)\n\n` +
        
        `<i>🧪 Прогресс</i>\n` +
        `└ Куплено апгрейдов: <b>${totalUpgrades}</b>\n\n` +

        `<i>💎 VIP</i>\n` +
        `├ Активных VIP: <b>${countVIP}</b> (ср. остаток: <b>${logic.format.formatShortTime(avgLeftVIP)}</b>)\n`

    return ctx.reply(text, { parse_mode: 'HTML' })
}

module.exports = { statsHandler }