const db = require('../../service/db')
const kb = require('../../utils/keyboards')
const texts = require('../../utils/texts')

async function meHandler(ctx) {
    const user = await db.getUser(ctx.from.id, ctx.from);

    await ctx.reply(texts.meText(user), {
        parse_mode: 'HTML',
        ...kb.profileKb()
    });
}

module.exports = { meHandler };