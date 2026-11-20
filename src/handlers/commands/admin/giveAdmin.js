const { isAdmin } = require('../../../utils/isAdmin')
const db = require('../../../service/db')
const logic = require('../../../service/logic')

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

module.exports = {
    giveCoinsHandler,
    giveallHandler
}