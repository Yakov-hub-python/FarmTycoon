const fs = require('fs/promises')
const { DB_PATH } = require('../../../service/config')
const { isAdmin } = require('../../../utils/isAdmin')

/**
 * /reset_stats — сбрасывает рекорды урожая у всех игроков.
 */
async function resetStatsHandler(ctx) {
    if (!isAdmin(ctx)) return

    try {
        const raw = await fs.readFile(DB_PATH, 'utf-8')
        const db = JSON.parse(raw)
        let count = 0

        for (const id in db.users) {
            db.users[id].stats = {
                bestHarvest: 0,
                bestCrop: null,
                bestMutation: null,
                bestWeight: 0
            }
            count++
        }

        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
        
        await ctx.reply(`✅ Успешно! Рекорды сброшены у <b>${count}</b> игроков.`, { parse_mode: 'HTML' })
        console.log(`[ADMIN] ${ctx.from.id} сбросил статистику у ${count} юзеров.`)
        
    } catch (e) {
        console.error('❌ Ошибка сброса stats:', e)
        await ctx.reply('❌ Ошибка при сбросе базы. Проверь логи.')
    }
}

module.exports = {
    resetStatsHandler
}