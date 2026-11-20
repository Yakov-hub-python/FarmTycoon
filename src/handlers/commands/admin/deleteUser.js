const db = require('../../../service/db')
const logic = require('../../../service/logic')
const { isAdmin } = require('../../../utils/isAdmin')

const DEFAULT_NICKS = ['Игрок', 'unknown']

async function deleteUserHandler(ctx) {
    if (!isAdmin(ctx)) return console.log(`[ADMIN] ${ctx.from.id} попытался использовать /delete_user без прав.`)

    // ===== ПАРСИНГ АРГУМЕНТОВ =====
    const parts = (ctx.message.text || '').trim().split(/\s+/)
    const arg = parts[1] || ''
    const confirm = parts.includes('confirm')

    if (!arg) {
        return ctx.reply('👤 Использование: /delete_user <ID | @username | ник> [confirm]')
    }

    const users = await db.getAllUsers()
    if (users.length === 0) return ctx.reply('📊 База данных пуста.')

    // ===== ПОИСК =====
    let found

    if (/^\d+$/.test(arg)) {
        found = users.filter(u => String(u.id) === arg)
    } else {
        const q = arg.replace(/^@/, '').toLowerCase()
        found = users.filter(u =>
            (u.username || '').toLowerCase() === q ||
            (u.nickname || '').toLowerCase() === q && !DEFAULT_NICKS.includes(u.nickname)
        )
    }

    // ===== РЕЗУЛЬТАТЫ ПОИСКА =====
    if (found.length === 0) {
        return ctx.reply(`❌ Игрок «${arg}» не найден.`)
    }

    if (found.length > 1) {
        let list = `⚠️ Найдено несколько игроков, уточните ID:\n\n`
        for (const u of found) {
            list += `├ <b>${u.nickname}</b> — ID: <code>${u.id}</code>, баланс: <b>${logic.format.formatShortNumber(u.coin)}</b>\n`
        }
        list += `└ Чтобы уточнить: /delete_user <code>ID</code>`
        return ctx.reply(list, { parse_mode: 'HTML' })
    }

    const user = found[0]
    const now = logic.time.now()

    // ===== КАРТОЧКА И ПОДТВЕРЖДЕНИЕ =====
    if (!confirm) {
        const text =
            `📋 <b>Карточка игрока</b>\n\n` +
            `├ Ник: <b>${user.nickname}</b>\n` +
            `├ Username: <b>${user.username}</b>\n` +
            `├ ID: <code>${user.id}</code>\n` +
            `├ Баланс: <b>${logic.format.formatShortNumber(user.coin)}</b>\n` +
            `├ Слотов: <b>${user.slots.length}</b>\n` +
            `└ VIP: <b>${logic.format.formatShortTime(Math.max(0, user.vipUntil - now))}</b>\n\n` +
            `⚠️ Удаление необратимо. Для подтверждения:\n<code>/delete_user ${user.id} confirm</code>`

        return ctx.reply(text, { parse_mode: 'HTML' })
    }

    const deleted = await db.deleteUser(user.id)
    if (!deleted) {
        return ctx.reply('❌ Игрок уже не существует (возможно, удалён только что).')
    }

    return ctx.reply(`✅ Игрок <b>${user.nickname}</b> (ID: <code>${user.id}</code>) удалён навсегда.`, { parse_mode: 'HTML' })
}

module.exports = { deleteUserHandler }
