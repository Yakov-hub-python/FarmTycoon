const kb = require('../../utils/keyboards')
const { safeEdit } = require('../../utils/safeEdit')

/**
 * Обработчик команды "/top".
 * @param {Object} ctx - Контекст Telegraf
 * @returns {Promise<void>}
 */
async function topHandler(ctx) {
    await safeEdit(ctx, '👇 Выберите категорию 👇', {
        parse_mode: 'HTML',
        ...kb.topsKb(),
    })
}

module.exports = { topHandler }