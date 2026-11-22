const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const { safeEdit } = require('../../utils/safeEdit')

async function remindCallback(ctx){
    const user = await db.getUser(ctx.from.id)
    user.remindEnabled = false
    await db.saveUser(ctx.from.id, user)
    await ctx.answerCbQuery()
    return await safeEdit(ctx, texts.remindOffText(), kb.backKb())
}

module.exports = { remindCallback }