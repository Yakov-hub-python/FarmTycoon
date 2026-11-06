/**
 * Регистрирует все callback'и на боте.
 * @param {Object} bot
 */
function registerCallbacks(bot) {
    bot.action('menu', async(ctx) => require('./menu').menuCallback(ctx))
    bot.action('help', async(ctx) => require('./help').helpCallback(ctx))
    bot.action('farm', async(ctx) => require('./farm').farmCallback(ctx))
    bot.action('shop', async(ctx) => require('./shop').showShop(ctx))
    bot.action(/^slot:(\d+)/, async(ctx) => require('./farm').slotCallback(ctx))
    bot.action('harvest_all', async(ctx) => require('./farm').harvestAllCallback(ctx))
    bot.action('expand', async(ctx) => require('./farm').expandCallback(ctx))
    bot.action('top', async(ctx) => require('./top').topCallback(ctx))
    bot.action('top_coins', async(ctx) => require('./top').topCoinsCallback(ctx))
    bot.action('top_harvest', async(ctx) => require('./top').topHarvestCallback(ctx))
    bot.action('daily', async(ctx) => require('./daily').dailyCallback(ctx))
    bot.action(/^plant:(\w+):(\d+)/, async(ctx) => require('./shop').buyToShop(ctx));
    bot.action(/^update_count_(\d+)/, async(ctx) => require('./shop').updateShop(ctx));
    bot.action('friends', async(ctx) => require('./ref').showFriends(ctx))
    bot.action('event', async(ctx) => require('./event').showEvent(ctx))
    bot.action(/^event_buy_(.+)/, async(ctx) => require('./event').buyEventItem(ctx))
    bot.action('profile', async(ctx) => require('./me').meCallback(ctx))
    bot.action('titles_menu', async(ctx) => await require('./titles').showTitles(ctx))
    bot.action(/^equip_title:(.+)/, async(ctx) => require('./titles').equipTitle(ctx))
}


module.exports = registerCallbacks