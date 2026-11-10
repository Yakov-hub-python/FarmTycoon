const fs = require('fs')
const path = require('path')
const config = require('../service/config')
const logic = require('../service/logic')
const db = require('../service/db')

const HOUR = 60 * 60 * 1000
const DAY  = 24 * HOUR
const FIRST_RUN_DELAY = 60 * 1000
const MAX_BACKUP_SIZE = 45 * 1024 * 1024   // лимит Telegram — 50 MB, берём 45 с запасом
const BACKUPS_TO_KEEP = 7

const { DB_PATH, ADMIN_ID } = config

// ---------- УВЕДОМЛЕНИЯ О КОНЦЕ ИВЕНТА ----------
function daysLeft() {
    const diff = config.EVENT_END_TIMESTAMP - Date.now()
    return diff > 0 ? Math.ceil(diff / DAY) : 0
}

async function sendEventWarnings(bot) {
    const d = daysLeft()
    if (d !== 3 && d !== 1) return

    const users = await db.getAllUsers()
    let sent = 0

    for (const user of users) {
        if (!user.leaves || user.leaves <= 0) continue
        if (user.notificationsEnabled === false) continue
        if (d === 3 && user.eventEndNotified3d) continue
        if (d === 1 && user.eventEndNotified1d) continue

        const text = d === 3
            ? `🍂 Ивент закончится через 3 дня!\nУ тебя ${user.leaves} листьев — потрать: /farm → 🍂 Праздник Урожая`
            : `🍂 Последний день ивента!\nУ тебя ${user.leaves} листьев — не забудь потратить: /farm → 🍂 Праздник Урожая`

        try {
            await bot.telegram.sendMessage(user.id, text, { parse_mode: 'HTML' })
            if (d === 3) user.eventEndNotified3d = true
            if (d === 1) user.eventEndNotified1d = true
            await db.saveUser(user)
            sent++
        } catch (e) {
            console.error(`[EVENT] notify failed user=${user.id}: ${e.message}`)
        }
    }
    console.log(`[EVENT] ${d}d warnings: sent=${sent}`)
}

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

// ---------- ЗАПУСК ----------
function runCron(bot) {
    setInterval(async () => {
        if (!logic.event.isEventActive()) return
        await sendEventWarnings(bot)
    }, HOUR)

    // Первый бэкап через минуту после старта — чтобы не пропустить при частых рестартах Render
    setTimeout(() => {
        backupCron(bot).catch(e => console.error('[BACKUP] Unhandled:', e))
    }, FIRST_RUN_DELAY)

    setInterval(async () => {
        await backupCron(bot).catch(e => console.error('[BACKUP] Unhandled:', e))
    }, DAY)
}

module.exports = runCron