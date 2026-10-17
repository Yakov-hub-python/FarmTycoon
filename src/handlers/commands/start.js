const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')

async function startHandler(ctx) {
    await db.getUser(ctx.from.id)
    await ctx.reply(texts.WELCOME, {
        parse_mode: 'HTML',
        ...kb.mainMenuKb(),
    })
}

module.exports = { startHandler}