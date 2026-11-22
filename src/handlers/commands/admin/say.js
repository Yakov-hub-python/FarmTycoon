const { isAdmin } = require('../../../utils/isAdmin')
const db = require('../../../service/db')

/**
 * /say <текст> — рассылка сообщения всем игрокам (Markdown).
 */
async function sayHandler(ctx) {
    if (!isAdmin(ctx)) return

    const text = ctx.message.text.split(' ').slice(1).join(' ')
    
    if (!text) {
        return ctx.reply('❌ Использование: <code>/say *Жирный текст* или _курсив_</code>', { parse_mode: 'HTML' })
    }

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
                    await ctx.telegram.sendMessage(user.id, `📢 ${text}`)
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


module.exports = {
    sayHandler
}