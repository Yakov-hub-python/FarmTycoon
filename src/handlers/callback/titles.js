const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const { safeEdit } = require('../../utils/safeEdit')
const { TITLES } = require('../../service/config')

async function showTitles(ctx) {
    const user = await db.getUser(ctx.from.id, ctx.from)
    await ctx.answerCbQuery()
    
    // Показываем экран титулов (текст и кнопки)
    await safeEdit(ctx, texts.titlesText(user), {
        parse_mode: 'HTML',
        ...kb.titlesKb(user)
    })
}

async function equipTitle(ctx) {
    const titleId = ctx.match[1] 
    const user = await db.getUser(ctx.from.id, ctx.from)

    if (titleId === 'none') {
        user.activeTitle = null
    } else if (user.ownedTitles.includes(titleId) && TITLES[titleId]) {
        user.activeTitle = titleId
    } else {
        return ctx.answerCbQuery('❌ У вас нет этого титула', { show_alert: true })
    }

    await db.saveUser(ctx.from.id, user)
    await ctx.answerCbQuery('✅ Титул обновлен!')
    
    // Обновляем экран
    await showTitles(ctx)
}

module.exports = { showTitles, equipTitle }