const env = require('../service/config')

/**
 * Проверка игрока на админа
 * @param {Object} ctx Контекст Telegraf
 * @returns {boolean} Админ или нет
 */
function isAdmin(ctx){
    if(String(ctx.from.id) === env.ADMIN_ID){
        return true
    } else {
        return false
    }
}

module.exports = {
    isAdmin
}