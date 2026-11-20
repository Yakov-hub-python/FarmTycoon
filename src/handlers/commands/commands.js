/**
 * Регистрирует все команды на боте.
 * @param {Object} bot
 */
function registerCommands(bot) {
    // ===== ИГРОВЫЕ КОМАНДЫ =====
    bot.command('start',async(ctx) => await require('./start').startHandler(ctx))
    bot.command('menu', async(ctx) => await require('./menu').menuHandler(ctx))
    bot.command('help', async(ctx) => await require('./help').helpHandler(ctx))
    bot.command('farm', async(ctx) => await require('./farm').farmHandler(ctx))
    bot.command('top', async(ctx) => await require('./top').topHandler(ctx))
    bot.command('setnick', async(ctx) => await require('./setnick').setNick(ctx))
    bot.command('me', async (ctx) => await require('./me').meHandler(ctx))
    bot.command('daily', async (ctx) => await require('./daily').dailyHandler(ctx))
    bot.command('promo', async (ctx) => await require('./promo').promoHandler(ctx))

    // ===== АДМИН-КОМАНДЫ =====
    bot.command('restore', async(ctx) => require('./admin').restoreHandler(ctx))
    bot.command('backup', async(ctx) => await require('./admin').backupHandler(ctx)) 
    bot.command('give_admin', async(ctx) => await require('./admin').giveAdminHandler(ctx))
    bot.command('giveall', async(ctx) => await require('./admin').giveallHandler(ctx))
    bot.command('say', async(ctx) => await require('./admin').sayHandler(ctx))
    bot.command('reset_stats', async(ctx) => await require('./admin').resetStatsHandler(ctx))
    bot.command('delete_user', async(ctx) => await require('./admin').deleteUserHandler(ctx))
    bot.command('stats', async(ctx) => await require('./admin').statsHandler(ctx))
    bot.command('newpromo', async (ctx) => await require('./admin').newPromoHandler(ctx))
}


module.exports = registerCommands