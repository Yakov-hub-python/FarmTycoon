const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')

async function startHandler(ctx) {
    const user = await db.getUser(ctx.from.id)
    user.username = ctx.from.username
    await db.saveUser(ctx.from.id, user)
    await ctx.reply(texts.WELCOME, {
        parse_mode: 'HTML',
        ...kb.mainMenuKb(),
    })
}

module.exports = { startHandler}