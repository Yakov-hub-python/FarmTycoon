const kb = require('../../utils/keyboards')

/**
 * Обработчик команды "/top".
 * @param {Object} ctx - Контекст Telegraf
 * @returns {Promise<void>}
 */
async function topHandler(ctx) {
    await ctx.answerCbQuery()
    await safeEdit(ctx, '👇 Выберите категорию 👇', {
        parse_mode: 'HTML',
        ...kb.topsKb(),
    })
}

module.exports = { topHandler }