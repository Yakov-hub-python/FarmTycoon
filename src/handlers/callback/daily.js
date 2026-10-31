const logic = require('../../service/logic')
const db = require('../../service/db')
const { safeEdit } = require('../../utils/safeEdit')

async function dailyCallback(ctx){
    const user = await db.getUser(ctx.from.id)
    const { canCollect, remaining } = logic.daily.checkLastCollection(user)
    if(!canCollect){
        return safeEdit(ctx, `❌ Пока рано. Осталось ${logic.format.formatTime(remaining)} до сбора награды.`, 
            {
                reply_markup: 
                    {inline_keyboard: [[{text: 'Назад', callback_data: 'menu'}]]}
            }
        )
    }
    const reward = logic.daily.numberOfAwards(user)
    user.coin += reward
    user.last_collection = logic.time.now()
    await db.saveUser(ctx.from.id, user)
    return safeEdit(ctx, `✅ Вы получили награду в размере ${reward} монет!`,
        {
            reply_markup: 
                {inline_keyboard: [[{text: 'Назад', callback_data: 'menu'}]]}
        }
    )
}

module.exports = {
    dailyCallback
}