const fs = require('fs/promises') // 👈 Вот он, тот самый модуль!
const { ADMIN_ID, DB_PATH } = require('../../service/config')
const { isAdmin } = require('../../utils/isAdmin')
const db = require('../../service/db')
const logic = require('../../service/logic')

const LIMITS = {
    vip:  { min: 1, max: 30,        label: 'дн.' },
    coin: { min: 1, max: 1000000, label: 'монет' },
}

/**
 * /give_admin <id или ответ на сообщение> <сумма>
 */
async function giveCoinsHandler(ctx) {
    if (!isAdmin(ctx)) return

    const args = ctx.message.text.split(' ').slice(1)
    let targetId
    let amount

    if (ctx.message.reply_to_message) {
        targetId = ctx.message.reply_to_message.from.id
        amount = parseInt(args[0], 10)
    } else if (args.length >= 2) {
        targetId = args[0]
        amount = parseInt(args[1], 10)
    } else {
        return ctx.reply(
            '❌ Использование:\n' +
            '1. Ответь на сообщение игрока и напиши <code>/give_admin 5000</code>\n' +
            '2. Или напиши <code>/give_admin 123456789 5000</code>',
            { parse_mode: 'HTML' }
        )
    }

    if (isNaN(amount) || amount === 0) {
        return ctx.reply('❌ Сумма должна быть числом (и не нулем).')
    }

    const user = await db.getUser(targetId, null) 
    user.coin += amount
    
    if (user.coin < 0) user.coin = 0 
    
    await db.saveUser(targetId, user)

    await ctx.reply(
        `✅ Игроку <code>${targetId}</code> выдано <b>${amount}</b> монет.\n` +
        `Текущий баланс: ${user.coin}`,
        { parse_mode: 'HTML' }
    )
}

async function giveallHandler(ctx) {
    // Тихая проверка админа — не палим команду
    if (!isAdmin(ctx)) return

    const args = ctx.message.text.split(/\s+/).slice(1)
    const [type, amountRaw] = args

    // ===== ВАЛИДАЦИЯ =====
    if (!type || !amountRaw) {
        return ctx.reply(
            '❌ Формат: <code>/giveall &lt;vip|coin&gt; &lt;amount&gt;</code>\n' +
            'Пример: <code>/giveall vip 3</code>',
            { parse_mode: 'HTML' }
        )
    }

    if (type !== 'vip' && type !== 'coin') {
        return ctx.reply('❌ Тип должен быть <code>vip</code> или <code>coin</code>', { parse_mode: 'HTML' })
    }

    const amount = Number(amountRaw)
    if (!Number.isInteger(amount) || amount <= 0) {
        return ctx.reply('❌ Amount должен быть целым числом > 0')
    }

    const lim = LIMITS[type]
    if (amount < lim.min || amount > lim.max) {
        return ctx.reply(
            `❌ Для <b>${type}</b> допустимо от ${lim.min} до ${logic.format.formatNumber(lim.max)} ${lim.label}`,
            { parse_mode: 'HTML' }
        )
    }

    // ===== ВЫПОЛНЕНИЕ =====
    const users = await db.getAllUsers()
    if (users.length === 0) {
        return ctx.reply('❌ В базе нет игроков')
    }

    let sent = 0
    let skipped = 0
    const errors = []

    for (const user of users) {
        try {
            if (type === 'vip') {
                logic.vip.addVipDays(user, amount, 'admin_giveall')
            } else {
                user.coin = (user.coin || 0) + amount
            }
            await db.saveUser(user.id, user)
            sent++
            console.log(`[GIVEALL] user=${user.id} type=${type} amount=${amount} by=${ctx.from.id}`)
        } catch (e) {
            skipped++
            errors.push(`${user.id}: ${e.message}`)
            console.error(`[GIVEALL] failed user=${user.id}: ${e.message}`)
        }
    }

    // ===== ОТЧЁТ =====
    const typeLabel = type === 'vip' ? '👑 VIP' : '💰 Монеты'
    const amountLabel = type === 'vip' ? `+${amount} дн.` : `+${logic.format.formatNumber(amount)} монет`

    let report =
        `✅ <b>Готово</b>\n\n` +
        `Тип: ${typeLabel}\n` +
        `Количество: <b>${amountLabel}</b>\n` +
        `Получили: <b>${sent}</b>\n` +
        `Пропущено: <b>${skipped}</b>\n` +
        `Всего: <b>${users.length}</b>`

    if (errors.length > 0 && errors.length <= 5) {
        report += `\n\n⚠️ Ошибки:\n<code>${errors.join('\n')}</code>`
    }

    await ctx.reply(report, { parse_mode: 'HTML' })
}

/**
 * /say <текст> — рассылка сообщения всем игрокам (Markdown).
 */
async function sayHandler(ctx) {
    if (!isAdmin(ctx)) return

    const text = ctx.message.text.split(' ').slice(1).join(' ')
    
    if (!text) {
        return ctx.reply('❌ Использование: <code>/say *Жирный текст* или _курсив_</code>', { parse_mode: 'HTML' })
    }

    const storage = require('../../service/db')
    const users = await db.getAllUsers()
    await ctx.reply(`🚀 Начинаю рассылку для ${users.length} игроков...`)

    let success = 0
    let failed = 0

    for (const user of users) {
        try {
            await ctx.telegram.sendMessage(user.id, text, { parse_mode: 'Markdown' })
            success++
        } catch (e) {
            if (e.message.includes('parse entities')) {
                try {
                    await ctx.telegram.sendMessage(user.id, text)
                    success++
                } catch (e2) {
                    failed++
                }
            } else {
                failed++
            }
        }
        await new Promise(resolve => setTimeout(resolve, 50))
    }

    await ctx.reply(
        `✅ <b>Рассылка завершена!</b>\n\n` +
        `📬 Доставлено: ${success}\n` +
        `🚫 Ошибок: ${failed}`,
        { parse_mode: 'HTML' }
    )
}

/**
 * /reset_stats — сбрасывает рекорды урожая у всех игроков.
 */
async function resetStatsHandler(ctx) {
    if (!isAdmin(ctx)) return

    try {
        const raw = await fs.readFile(DB_PATH, 'utf-8')
        const db = JSON.parse(raw)
        let count = 0

        for (const id in db.users) {
            db.users[id].stats = {
                bestHarvest: 0,
                bestCrop: null,
                bestMutation: null,
                bestWeight: 0
            }
            count++
        }

        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
        
        await ctx.reply(`✅ Успешно! Рекорды сброшены у <b>${count}</b> игроков.`, { parse_mode: 'HTML' })
        console.log(`[ADMIN] ${ctx.from.id} сбросил статистику у ${count} юзеров.`)
        
    } catch (e) {
        console.error('❌ Ошибка сброса stats:', e)
        await ctx.reply('❌ Ошибка при сбросе базы. Проверь логи.')
    }
}

async function newPromoHandler(ctx) {
    if (!isAdmin(ctx)) return

    // Формат: /newpromo <код> <тип> <кол-во> <лимит>
    // Пример: /newpromo XMAS vip 3 50
    const args = ctx.message.text.split(' ').slice(1)
    
    if (args.length < 3) {
        return ctx.reply('❌ Использование: <code>/newpromo КОД ТИП КОЛВО [ЛИМИТ]</code>\nТипы: vip, coins', { parse_mode: 'HTML' })
    }

    const code = args[0].toUpperCase()
    const type = args[1].toLowerCase()
    const amount = parseInt(args[2], 10)
    const limit = args[3] ? parseInt(args[3], 10) : 0 // 0 = безлимит

    if (!['vip', 'coins'].includes(type)) return ctx.reply('❌ Тип должен быть vip или coins')
    if (isNaN(amount) || amount <= 0) return ctx.reply('❌ Количество должно быть числом > 0')

    try {
        const raw = await fs.readFile(DB_PATH, 'utf-8')
        const db = JSON.parse(raw)
        
        if (!db.promos) db.promos = {}
        
        db.promos[code] = { type, amount, limit, uses: 0 }
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')

        await ctx.reply(`✅ Промокод <b>${code}</b> создан!\nТип: ${type} (${amount})\nЛимит: ${limit === 0 ? 'безлимит' : limit}`, { parse_mode: 'HTML' })
    } catch (e) {
        console.error(e)
        await ctx.reply('❌ Ошибка создания промокода')
    }
}

module.exports = { 
    giveCoinsHandler, 
    giveallHandler,
    sayHandler, 
    resetStatsHandler,
    newPromoHandler
}