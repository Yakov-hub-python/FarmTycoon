const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')


async function farmHandler(ctx) {
    const user = await db.getUser(ctx.from.id)
    await ctx.reply(texts.farmText(user), {
        parse_mode: 'HTML',
        ...kb.farmKb(user),
    })
}


module.exports = { farmHandler }