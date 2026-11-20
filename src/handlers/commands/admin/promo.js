const fs = require('fs/promises')
const { DB_PATH } = require('../../../service/config')
const { isAdmin } = require('../../../utils/isAdmin')

async function newPromoHandler(ctx) {
    if (!isAdmin(ctx)) return

    // Формат: /newpromo <код> <тип> <кол-во> <лимит>
    // Пример: /newpromo XMAS vip 3 50
    const args = ctx.message.text.split(' ').slice(1)
    
    if (args.length < 3) {
        return ctx.reply('❌ Использование: <code>/newpromo КОД ТИП КОЛВО [ЛИМИТ]</code>\nТипы: vip, coins', { parse_mode: 'HTML' })
    }

    const code = args[0].toUpperCase()
    const type = args[1].toLowerCase()
    const amount = parseInt(args[2], 10)
    const limit = args[3] ? parseInt(args[3], 10) : 0 // 0 = безлимит

    if (!['vip', 'coins'].includes(type)) return ctx.reply('❌ Тип должен быть vip или coins')
    if (isNaN(amount) || amount <= 0) return ctx.reply('❌ Количество должно быть числом > 0')

    try {
        const raw = await fs.readFile(DB_PATH, 'utf-8')
        const db = JSON.parse(raw)
        
        if (!db.promos) db.promos = {}
        
        db.promos[code] = { type, amount, limit, uses: 0 }
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')

        await ctx.reply(`✅ Промокод <b>${code}</b> создан!\nТип: ${type} (${amount})\nЛимит: ${limit === 0 ? 'безлимит' : limit}`, { parse_mode: 'HTML' })
    } catch (e) {
        console.error(e)
        await ctx.reply('❌ Ошибка создания промокода')
    }
}

module.exports = {
    newPromoHandler
}