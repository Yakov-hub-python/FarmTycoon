const logic = require('../../service/logic')
const db = require('../../service/db')

async function dailyHandler(ctx){
    const user = await db.getUser(ctx.from.id)
    const { canCollect, remaining } = logic.daily.checkLastCollection(user)
    if(!canCollect){
        return ctx.reply(`❌ Пока рано. Осталось ${logic.format.formatTime(remaining)} до сбора награды.`)
    }
    const reward = logic.daily.numberOfAwards(user)
    user.coin += reward
    user.last_collection = logic.time.now()
    await db.saveUser(ctx.from.id, user)
    return ctx.reply(`✅ Вы получили награду в размере ${reward} монет!`)
}

module.exports = {
    dailyHandler
}