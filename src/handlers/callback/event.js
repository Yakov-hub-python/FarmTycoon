const texts = require('../../utils/texts')
const db = require('../../service/db')
const kb = require('../../utils/keyboards')
const logic = require('../../service/logic')
const { safeEdit } = require('../../utils/safeEdit')

// Вспомогательная функция: только РИСУЕТ экран, без ответа на кнопку
async function renderEvent(ctx, user) {
    await safeEdit(ctx, texts.eventText(user), {
        parse_mode: 'HTML',
        ...kb.eventKb(user)
    })
}

async function showEvent(ctx) {
    const user = await db.getUser(ctx.from.id, ctx.from)
    await ctx.answerCbQuery() // Отвечаем на клик, чтобы убрать спиннер
    await renderEvent(ctx, user)
}

async function buyEventItem(ctx) {
    const itemKey = ctx.match[1]
    const user = await db.getUser(ctx.from.id, ctx.from)
    
    // 1. Проверяем возможность покупки
    const check = logic.event.canBuy(user, itemKey)
    if (!check.ok) {
        // Если нельзя купить — показываем ошибку и выходим
        return ctx.answerCbQuery(check.error, { show_alert: true })
    }
    
    // 2. Если можно — покупаем и сохраняем
    const result = logic.event.applyPurchase(user, itemKey)
    await db.saveUser(ctx.from.id, user)
    
    // 3. Отвечаем результатом покупки (например, "ДЖЕКПОТ!")
    await ctx.answerCbQuery(result.text, { show_alert: true })
    
    // 4. Перерисовываем экран
    await renderEvent(ctx, user)
}

module.exports = { showEvent, buyEventItem }