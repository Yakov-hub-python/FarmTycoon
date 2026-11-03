const fs = require('fs/promises')
const { DB_PATH } = require('../../service/config')
const logic = require('../../service/logic')

/**
 * Команда /promo <код> — активация промокода игроком.
 */
async function promoHandler(ctx) {
    // Получаем код из сообщения (второе слово после /promo)
    const code = ctx.message.text.split(' ')[1]
    
    if (!code) {
        return ctx.reply('❌ Использование: <code>/promo КОД</code>', { parse_mode: 'HTML' })
    }

    try {
        // 1. Читаем базу
        const raw = await fs.readFile(DB_PATH, 'utf-8')
        const db = JSON.parse(raw)
        const userId = String(ctx.from.id)

        // 2. Проверяем, есть ли игрок в базе (на всякий случай)
        if (!db.users[userId]) {
            return ctx.reply('❌ Сначала зайдите в игру командой /start')
        }

        const user = db.users[userId]

        // 3. Вызываем логику активации (она изменит и юзера, и db.promos)
        const res = logic.promo.activatePromo(user, db, code)

        // 4. Обрабатываем ошибки
        if (!res.ok) {
            const errors = {
                not_found: '❌ Такого промокода не существует',
                limit_reached: '❌ Лимит активаций этого кода исчерпан',
                already_used: '❌ Вы уже использовали этот промокод'
            }
            return ctx.reply(errors[res.error] || '❌ Ошибка активации')
        }

        // 5. Если всё успешно — сохраняем обновленную базу
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')

        // 6. Отвечаем игроку
        await ctx.reply(
            `🎉 Промокод активирован!\nВы получили: <b>${res.rewardText}</b>`, 
            { parse_mode: 'HTML' }
        )
        
        console.log(`[PROMO] Игрок ${userId} (${user.nickname}) активировал код ${code}`)

    } catch (e) {
        console.error('❌ Ошибка в promoHandler:', e)
        await ctx.reply('❌ Произошла ошибка при активации промокода. Попробуйте позже.')
    }
}

module.exports = { promoHandler }