const texts = require('../../utils/texts')
const db = require('../../service/db')

async function remindCommand(ctx){
    const args = ctx.message.text.trim().split(' ')
    const user = await db.getUser(ctx.from.id)
    if(!args[1]) return ctx.reply(texts.remindStatusText(user))
    if(args[1] === 'off'){
        user.remindEnabled = false
        await db.saveUser(ctx.from.id, user)
        return ctx.reply(texts.remindStatusText(user))
    } 
    if(args[1] === 'off') {
        user.remindEnabled = true
        await db.saveUser(ctx.from.id, user)
        return ctx.reply(texts.remindStatusText(user))
    }
    return ctx.reply(texts.remindStatusText(user))
}

module.exports = { remindCommand }