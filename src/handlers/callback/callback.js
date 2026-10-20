/**
 * Регистрирует все callback'и на боте.
 * @param {Object} bot
 */
function registerCallbacks(bot) {
    bot.action('menu', async(ctx) => require('./menu').menuCallback(ctx))
    bot.action('help', async(ctx) => require('./help').helpCallback(ctx))
    bot.action('farm', async(ctx) => require('./farm').farmCallback(ctx))
    bot.action(/^plant:(.+)/, async(ctx) => require('./farm').plantCallback(ctx))
    bot.action(/^slot:(\d+)/, async(ctx) => require('./farm').slotCallback(ctx))
    bot.action('harvest_all', async(ctx) => require('./farm').harvestAllCallback(ctx))
    bot.action('expand', async(ctx) => require('./farm').expandCallback(ctx))
    bot.action('top', async(ctx) => require('./top').topCallback(ctx))
    bot.action('top_coins', async(ctx) => require('./top').topCoinsCallback(ctx))
    bot.action('top_harvest', async(ctx) => require('./top').topHarvestCallback(ctx))
}


module.exports = registerCallbacks