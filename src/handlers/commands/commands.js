/**
 * Регистрирует все команды на боте.
 * @param {Object} bot
 */
function registerCommands(bot) {
    bot.command('start',async(ctx) => await require('./start').startHandler(ctx))
    bot.command('menu', async(ctx) => await require('./menu').menuHandler(ctx))
    bot.command('help', async(ctx) => await require('./help').helpHandler(ctx))
    bot.command('farm', async(ctx) => await require('./farm').farmHandler(ctx))
    bot.command('restore', async(ctx) => require('./restore').restoreHandler(ctx))
    bot.command('backup', async(ctx) => await require('./backup').backupHandler(ctx)) 
    bot.command('top', async(ctx) => await require('./top').topHandler(ctx))
}


module.exports = registerCommands