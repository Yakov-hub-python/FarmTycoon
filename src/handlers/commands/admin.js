const db = require('../../service/db')
const env = require('../../service/config')
const logic = require('../../service/logic')
const { isAdmin } = require('../../utils/isAdmin')

async function giveAdminHandler(ctx) {
    if (!isAdmin(ctx)) return

    const args = ctx.message.text.split(' ').slice(1)
    let targetId
    let amount

    // Вариант 1: Ответ на сообщение игрока (самый удобный способ)
    if (ctx.message.reply_to_message) {
        targetId = ctx.message.reply_to_message.from.id
        amount = parseInt(args[0], 10)
    } 
    // Вариант 2: Ввод ID вручную (/give_admin 5685152704 5000)
    else if (args.length >= 2) {
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

    // Загружаем юзера, меняем баланс, сохраняем
    const user = await db.getUser(targetId)
    user.coin += amount
    
    // Защита от ухода в минус
    if (user.coin < 0) user.coin = 0 
    
    await db.saveUser(targetId, user)

    await ctx.reply(
        `✅ Игроку <code>${targetId}</code> выдано <b>${logic.format.formatNumber(amount)}</b> монет.\n` +
        `Текущий баланс: ${logic.format.formatNumber(user.coin)}`,
        { parse_mode: 'HTML' }
    )
}

async function sayAdmin(ctx){
    if(!isAdmin(ctx)) return 
    const text = ctx.message.text.split(' ').slice(1).join(' ')
    if(!text){return ctx.reply('Введите по этому примеру:\n\n`/say <текст>`', {parse_mode: 'Markdown'})}
    const users = db.getAllUsers()
    for(const user of users){
        try{
            ctx.telegram.sendMessage(user.id, text, {parse_mode: 'Markdown'})
            await new Promise(resolve => setTimeout(resolve, 50))
        } catch (e) {
            failed++
        }
    }
    await ctx.reply(
        `✅ <b>Рассылка завершена!</b>\n\n` +
        `📬 Доставлено: ${success}\n` +
        `🚫 Ошибок (заблокировали): ${failed}`,
        { parse_mode: 'HTML' }
    )
}


module.exports = {
    giveAdminHandler,
    sayAdmin
}