const fs = require('fs/promises')
const { ADMIN_ID, DB_PATH } = require('../../service/config')


/**
 * Проверяет, что команду вызвал админ.
 * @param {Object} ctx
 * @returns {boolean}
 */
function isAdmin(ctx) {
    return ctx.from.id.toString() === ADMIN_ID
}


/**
 * Команда /backup — отправляет database.json админу в личку.
 * Доступна только админу.
 *
 * @param {Object} ctx
 */
async function backupHandler(ctx) {
    if (!isAdmin(ctx)) {
        return ctx.reply('⛔ Доступ запрещён')
    }

    console.log(`📦 [BACKUP] Запрос от ${ctx.from.id}`)

    let raw
    try {
        raw = await fs.readFile(DB_PATH, 'utf-8')
    } catch (e) {
        console.error(`❌ [BACKUP] Не читается ${DB_PATH}:`, e.message)
        return ctx.reply('❌ Файл базы не найден или недоступен')
    }

    // Проверяем, что это валидный JSON (чтобы не отправить мусор)
    let parsed
    try {
        parsed = JSON.parse(raw)
    } catch (e) {
        console.error(`❌ [BACKUP] Битый JSON:`, e.message)
        return ctx.reply('❌ Файл базы повреждён, отправить нельзя')
    }

    const userCount = Object.keys(parsed.users || {}).length
    const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-')
    const filename = `backup_${timestamp}.json`

    try {
        await ctx.replyWithDocument(
            {
                source: Buffer.from(raw, 'utf-8'),
                filename,
            },
            {
                caption:
                    `📦 <b>Бэкап Farm Tycoon</b>\n\n` +
                    `👥 Юзеров: ${userCount}\n` +
                    `📅 ${new Date().toLocaleString('ru-RU')}\n` +
                    `📁 ${filename}`,
                parse_mode: 'HTML',
            }
        )
        console.log(`✅ [BACKUP] Отправлен: ${filename} (${userCount} юзеров, ${raw.length} байт)`)
    } catch (e) {
        console.error(`❌ [BACKUP] Ошибка отправки:`, e.message)
        await ctx.reply('❌ Не удалось отправить файл, попробуй позже')
    }
}



module.exports = { backupHandler, restoreHandler }