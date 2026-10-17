const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const { safeEdit } = require('../../utils/safeEdit')

async function menuCallback(ctx) {
    const user = await db.getUser(ctx.from.id, ctx.from)
    await ctx.answerCbQuery()
    await safeEdit(ctx, texts.menuText(user), {
        parse_mode: 'HTML',
        ...kb.mainMenuKb(),
    })
}

module.exports = {
    menuCallback
}