const fs = require('fs/promises') // 👈 Вот он, тот самый модуль!
const { ADMIN_ID, DB_PATH } = require('../../service/config')

/**
 * Проверка на админа
 */
function isAdmin(ctx) {
    return ctx.from.id.toString() === ADMIN_ID
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

    // Здесь мы используем db, но так как в admin.js нет импорта db, 
    // мы делаем это через fs (читаем и пишем файл напрямую) или 
    // импортируем storage. Предположим, ты импортировал db/storage.
    // Если нет, лучше использовать storage.
    const storage = require('../../service/db') 
    const user = await storage.getUser(targetId, null) 
    user.coin += amount
    
    if (user.coin < 0) user.coin = 0 
    
    await storage.saveUser(targetId, user)

    await ctx.reply(
        `✅ Игроку <code>${targetId}</code> выдано <b>${amount}</b> монет.\n` +
        `Текущий баланс: ${user.coin}`,
        { parse_mode: 'HTML' }
    )
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
    const users = await storage.getAllUsers()
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

module.exports = { 
    giveCoinsHandler, 
    sayHandler, 
    resetStatsHandler 
}