const db = require('../../service/db')

async function meHandler(ctx) {
    const user = await db.getUser(ctx.from.id);
    return ctx.reply(
        `👤 nickname: <b>${user.nickname ?? 'NULL'}</b>\n` +
        `📛 username: ${user.username}\n` +
        `🆔 id: <code>${user.id}</code>\n` +
        `🏆 bestHarvest: ${user.stats.bestHarvest}\n` +
        `⚖️ bestWeight: ${user.stats.bestWeight}`,
        { parse_mode: 'HTML' }
    );
}
module.exports = { meHandler };