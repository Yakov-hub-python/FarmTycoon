const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')

async function menuHandler(ctx) {
    const user = await db.getUser(ctx.from.id, ctx.from)
    await ctx.reply(texts.menuText(user), {
        parse_mode: 'HTML',
        ...kb.mainMenuKb(),
    })
}

module.exports = {
    menuHandler
}