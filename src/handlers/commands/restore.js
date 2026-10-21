const fs = require('fs/promises')
const axios = require('axios')
const { ADMIN_ID, DB_PATH } = require('../../service/config')
const { isAdmin } = require('../../utils/isAdmin')

async function restoreHandler(ctx) {
    if (!isAdmin(ctx)) {
        return ctx.reply('⛔ Доступ запрещён')
    }

    // 1. Проверяем, что команда вызвана ответом на сообщение
    const replied = ctx.message.reply_to_message
    if (!replied) {
        return ctx.reply(
            '❌ Ответь на сообщение с файлом бэкапа командой /restore.\n\n' +
            'Как это делается:\n' +
            '1. Найди в чате сообщение с бэкапом (файл .json)\n' +
            '2. Свайпни по нему влево (или правая кнопка мыши)\n' +
            '3. Выбери «Ответить»\n' +
            '4. Напиши /restore'
        )
    }

    // 2. Проверяем, что в replied есть документ
    if (!replied.document) {
        return ctx.reply('❌ В сообщении, на которое ты ответил, нет файла')
    }

    const doc = replied.document

    // 3. Проверяем расширение
    if (!doc.file_name || !doc.file_name.toLowerCase().endsWith('.json')) {
        return ctx.reply('❌ Файл должен быть .json')
    }

    // 4. Проверяем размер (Telegram Bot API даёт скачать до 20 МБ)
    if (doc.file_size && doc.file_size > 20 * 1024 * 1024) {
        return ctx.reply('❌ Файл больше 20 МБ, Telegram не даст его скачать')
    }

    console.log(`📥 [RESTORE] Запрос от ${ctx.from.id}, файл ${doc.file_name}`)

    // 5. Скачиваем файл через axios (fetch часто падает на хостингах)
    let raw
    try {
        const link = await ctx.telegram.getFileLink(doc.file_id)
        // Скачиваем как буфер, чтобы не повредить UTF-8
        const response = await axios.get(link.href, { responseType: 'arraybuffer' })
        raw = Buffer.from(response.data).toString('utf-8')
    } catch (e) {
        console.error(`❌ [RESTORE] Не удалось скачать файл:`, e.message)
        return ctx.reply('❌ Не удалось скачать файл с сервера Telegram. Попробуй ещё раз.')
    }

    // 6. Проверяем, что это валидный JSON
    let parsed
    try {
        parsed = JSON.parse(raw)
    } catch (e) {
        console.error(`❌ [RESTORE] Битый JSON:`, e.message)
        return ctx.reply('❌ Файл не является валидным JSON')
    }

    // 7. Проверяем структуру
    if (!parsed || typeof parsed !== 'object' || !parsed.users) {
        return ctx.reply('❌ Неверный формат бэкапа: нет поля users')
    }

    const userCount = Object.keys(parsed.users).length

    // 8. Резервная копия текущей базы
    try {
        await fs.copyFile(DB_PATH, DB_PATH + '.before_restore')
        console.log(`📀 [RESTORE] Резервная копия: ${DB_PATH}.before_restore`)
    } catch (e) {
        if (e.code !== 'ENOENT') {
            console.error(`⚠️ [RESTORE] Не удалось создать резервную копию:`, e.message)
        }
        // ENOENT — файла ещё нет, ничего страшного
    }

    // 9. Записываем восстановленные данные
    try {
        await fs.writeFile(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8')
    } catch (e) {
        console.error(`❌ [RESTORE] Ошибка записи:`, e.message)
        return ctx.reply('❌ Не удалось записать файл базы')
    }

    console.log(`✅ [RESTORE] Готово: ${userCount} юзеров из ${doc.file_name}`)

    await ctx.reply(
        `✅ <b>База восстановлена!</b>\n\n` +
        `📁 Файл: <code>${doc.file_name}</code>\n` +
        `👥 Юзеров: ${userCount}\n` +
        `📀 Старая база сохранена как <code>${DB_PATH}.before_restore</code>`,
        { parse_mode: 'HTML' }
    )
}

module.exports = {
    restoreHandler
}