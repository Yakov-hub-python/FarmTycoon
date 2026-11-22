const fs = require('fs')
const path = require('path')
const config = require('../service/config')
const logic = require('../service/logic')
const db = require('../service/db')
const texts = require('../utils/texts')
const kb = require('../utils/keyboards')

const HOUR = 60 * 60 * 1000
const DAY  = 24 * HOUR
const FIRST_RUN_DELAY = 60 * 1000
const MAX_BACKUP_SIZE = 45 * 1024 * 1024   // лимит Telegram — 50 MB, берём 45 с запасом
const BACKUPS_TO_KEEP = 7

const { DB_PATH, ADMIN_ID } = config

// ---------- БЭКАП ----------
async function backupCron(bot) {
    console.log(`📦 [BACKUP] Запуск ежедневного бэкапа`)

    if (!DB_PATH) { console.error(`❌ [BACKUP] DB_PATH не задан в config`); return }
    if (!ADMIN_ID) { console.error(`❌ [BACKUP] ADMIN_ID не задан в config`); return }

    let stats
    try {
        stats = await fs.promises.stat(DB_PATH)
    } catch (e) {
        console.error(`❌ [BACKUP] Не читается ${DB_PATH}:`, e.message)
        return
    }

    // Защита от слишком большого файла
    if (stats.size > MAX_BACKUP_SIZE) {
        console.error(`❌ [BACKUP] Файл слишком большой: ${(stats.size / 1024 / 1024).toFixed(1)} MB`)
        try {
            await bot.telegram.sendMessage(
                ADMIN_ID,
                `⚠️ Бэкап не отправлен: файл ${(stats.size / 1024 / 1024).toFixed(1)} MB превышает лимит 45 MB`
            )
        } catch {}
        return
    }

    // Читаем и проверяем JSON до отправки
    let raw
    try {
        raw = await fs.promises.readFile(DB_PATH, 'utf-8')
    } catch (e) {
        console.error(`❌ [BACKUP] Не читается ${DB_PATH}:`, e.message)
        return
    }

    let parsed
    try {
        parsed = JSON.parse(raw)
    } catch (e) {
        console.error(`❌ [BACKUP] Битый JSON:`, e.message)
        return
    }

    const userCount = Object.keys(parsed.users || {}).length
    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`
    const filename = `backup_${stamp}.json`

    // Копия на диск + ротация (страховка от потери в чате)
    try {
        const backupsDir = path.join(path.dirname(DB_PATH), 'backups')
        await fs.promises.mkdir(backupsDir, { recursive: true })
        await fs.promises.writeFile(path.join(backupsDir, filename), raw, 'utf-8')

        const files = (await fs.promises.readdir(backupsDir))
            .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
            .sort()
        while (files.length > BACKUPS_TO_KEEP) {
            await fs.promises.unlink(path.join(backupsDir, files.shift())).catch(() => {})
        }
    } catch (e) {
        console.warn(`⚠️ [BACKUP] Не удалось сохранить на диск:`, e.message)
    }

    // Отправка в ЛС админу
    try {
        await bot.telegram.sendDocument(
            ADMIN_ID,
            { source: fs.createReadStream(DB_PATH), filename },
            {
                caption:
                    `📦 <b>Автобэкап Farm Tycoon</b>\n\n` +
                    `👥 Юзеров: ${userCount}\n` +
                    `📅 ${now.toLocaleString('ru-RU')}\n` +
                    `📁 ${filename}\n` +
                    `💾 ${(stats.size / 1024).toFixed(1)} KB`,
                parse_mode: 'HTML',
            }
        )
        console.log(`✅ [BACKUP] Отправлен: ${filename} (${userCount} юзеров)`)
    } catch (e) {
        console.error(`❌ [BACKUP] Ошибка отправки:`, e.message)
        try {
            await bot.telegram.sendMessage(ADMIN_ID, `❌ Бэкап не отправлен: ${e.message}`)
        } catch {}
    }
}

async function reminderTick(telegram){
    const now = logic.time.now()
    if(logic.reminder.isQuietHours(now)) return 

    const users = await db.getAllUsers()

    for(const cashedUser of users){
        const user = await db.getUser(cashedUser.id)
        if(!user) continue
        if(!user.remindEnabled) continue

        const readySlots = logic.reminder.getReadySlots(user)
        if(readySlots.length === 0){
            if(user.remindCount > 0 || user.remindNextAt !== 0){
                logic.reminder.resetBatch(user) 
                await db.saveUser(user.id, user)
            }
            continue
        }
        const verdict = logic.reminder.canRemind(user, now)
        if(!verdict.ok) {
            console.log(`[REMIND] ${user.id}: skip → ${verdict.error}`)
            continue
        }
        try{
            new Promise(r => setTimeout(r, 50))
            await telegram.sendMessage(
                user.id,
                texts.remindText(user, readySlots),
                { parse_mode: 'HTML', ...kb.remindKb() }
            )
        } catch (e){
            if(e.response && e.response.error_code === 403){
                user.remindEnabled = false
                await db.saveUser(user.id, user)
                continue
            }
            console.log(`[REMIND] ${user.id}: send error ${e.response?.error_code || '?'} ${e.description || e.message}`);
            continue
        }
        logic.reminder.markSent(user, now)
        await db.saveUser(user.id, user)
    }
}

// ---------- ЗАПУСК ----------
function runCron(bot) {
    setTimeout(() => {
        backupCron(bot).catch(e => console.error('[BACKUP] Unhandled:', e))
    }, FIRST_RUN_DELAY)

    setInterval(async () => {
        await backupCron(bot).catch(e => console.error('[BACKUP] Unhandled:', e))
    }, DAY / 2)

    setInterval(() => {
        reminderTick(bot.telegram).catch(e => console.error('[REMIND]', e.message))
    }, config.REMINDER.CHECK_INTERVAL_SEC * 1000)
}

module.exports = runCron