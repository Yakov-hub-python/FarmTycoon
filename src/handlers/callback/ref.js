const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const { safeEdit } = require('../../utils/safeEdit')

async function showFriends(ctx){
    const user = await db.getUser(ctx.from.id)
    await ctx.answerCbQuery()
    return await safeEdit(ctx, texts.friendsText(user), {
        parse_mode: 'HTML',
        ...kb.friendsKb(user)
    })
}

module.exports = {
    showFriends
}