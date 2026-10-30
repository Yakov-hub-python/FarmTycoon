// db.js
const fs = require('fs/promises')
const { DB_PATH, START_COINS, START_SLOTS, CROPS } = require('./config')


/**
 * Свежий юзер со стартовыми значениями.
 * Вызывается только при первом заходе игрока.
 *
 * @param {string} userId
 * @returns {Object}
 */
function _newUser(userId) {
    return {
        id: userId,
        username: 'unknown',
        firstName: 'Игрок',
        nickname: null,
        createdAt: Math.floor(Date.now() / 1000),
        coin: START_COINS,
        slots: Array(START_SLOTS).fill(null),
        stats: {
            bestHarvest: 0,
            bestCrop: null,
            bestMutation: null,
            bestWeight: 0,
        },
    }
}


/**
 * Читает базу. Нет файла — пустая. Битый — в .corrupt, пустая.
 * Никогда не бросает исключение наружу.
 *
 * @returns {Promise<{users: Object}>}
 */
async function _readDb() {
    let raw
    try {
        raw = await fs.readFile(DB_PATH, 'utf-8')
    } catch (e) {
        if (e.code === 'ENOENT') return { users: {} }
        console.error(`⚠️  Ошибка чтения ${DB_PATH}: ${e.message}`)
        return { users: {} }
    }

    if (!raw.trim()) return { users: {} }

    try {
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object' || !parsed.users) {
            throw new Error('bad structure')
        }
        return parsed
    } catch (e) {
        console.error(`⚠️  Битый ${DB_PATH}: ${e.message}`)
        try {
            await fs.rename(DB_PATH, DB_PATH + '.corrupt')
            console.error(`   Отложен в ${DB_PATH}.corrupt`)
        } catch (_) {
            // уже переименован или нет прав — не падаем
        }
        return { users: {} }
    }
}


/**
 * Атомарная запись через .tmp + rename.
 *
 * @param {{users: Object}} data
 * @returns {Promise<void>}
 */
async function _writeDb(data) {
    const tmp = DB_PATH + '.tmp'
    const json = JSON.stringify(data, null, 2)
    await fs.writeFile(tmp, json, 'utf-8')
    await fs.rename(tmp, DB_PATH)
}


// ===== ОЧЕРЕДЬ ЗАПИСИ (мьютекс) =====
// get/save = read -> modify -> write. Без очереди два параллельных вызова
// (например, /setnick и сбор урожая) затирают изменения друг друга.
let _queue = Promise.resolve()
function _withLock(fn) {
    const run = _queue.then(fn, fn)
    _queue = run.catch(() => {})
    return run
}


/**
 * Чинит поля юзера, если они побились. Меняет user in-place.
 *
 * @param {Object} user
 * @param {string} userId
 * @returns {boolean} true — если что-то менял
 */
function normalizeUser(user, userId) {
    let changed = false

    if (user.id !== userId) {
        user.id = userId
        changed = true
    }

    if (typeof user.username !== 'string' || !user.username) {
        user.username = 'unknown'
        changed = true
    }

    if (typeof user.firstName !== 'string' || !user.firstName) {
        user.firstName = 'Игрок'
        changed = true
    }

    // nickname: либо null, либо непустая строка. null — валидное состояние.
    if (user.nickname !== null && (typeof user.nickname !== 'string' || !user.nickname)) {
        user.nickname = null
        changed = true
    }

    if (!Number.isInteger(user.createdAt)) {
        user.createdAt = Math.floor(Date.now() / 1000)
        changed = true
    }

    if (!Number.isInteger(user.coin) || user.coin < 0) {
        user.coin = START_COINS
        changed = true
    }

    if (!Array.isArray(user.slots)) {
        user.slots = Array(START_SLOTS).fill(null)
        changed = true
    }

    // Дотянуть до стартового размера. Не обрезаем — слоты покупаются.
    if (user.slots.length < START_SLOTS) {
        const need = START_SLOTS - user.slots.length
        user.slots.push(...Array(need).fill(null))
        changed = true
    }

    for (let i = 0; i < user.slots.length; i++) {
        const slot = user.slots[i]
        if (slot === null) continue

        // Не объект, массив или что-то странное — обнуляем
        if (typeof slot !== 'object' || Array.isArray(slot)) {
            user.slots[i] = null
            changed = true
            continue
        }

        // Нет обязательных полей — обнуляем
        if (!slot.crop || !Number.isInteger(slot.plantedAt)) {
            user.slots[i] = null
            changed = true
            continue
        }

        // Неизвестная культура — обнуляем
        if (!CROPS[slot.crop]) {
            user.slots[i] = null
            changed = true
        }
    }

    // stats — ВНЕ цикла по слотам (иначе для пустых слотов не проверяется)
    if (!user.stats || typeof user.stats !== 'object' || Array.isArray(user.stats)) {
        user.stats = { bestHarvest: 0, bestCrop: null, bestMutation: null, bestWeight: 0 }
        changed = true
    }
    if (!Number.isInteger(user.stats.bestHarvest) || user.stats.bestHarvest < 0) {
        user.stats.bestHarvest = 0
        changed = true
    }
    // bestWeight — дробный (кг), Number.isInteger тут НЕЛЬЗЯ, иначе вес обнуляется
    if (typeof user.stats.bestWeight !== 'number' || !isFinite(user.stats.bestWeight) || user.stats.bestWeight < 0) {
        user.stats.bestWeight = 0
        changed = true
    }

    return changed
}


/**
 * Возвращает объект юзера. Создаёт при первом заходе.
 *
 * @param {string|number} userId
 * @returns {Promise<Object>}
 */
async function getUser(userId) {
    userId = String(userId)
    return _withLock(async () => {
        const db = await _readDb()
        let user = db.users[userId]

        if (!user) {
            user = _newUser(userId)
            db.users[userId] = user
            await _writeDb(db)
            return user
        }

        if (normalizeUser(user, userId)) {
            await _writeDb(db)
        }
        return user
    })
}


/**
 * Сохраняет юзера в файл. Нормализует перед записью.
 *
 * @param {string|number} userId
 * @param {Object} user
 * @returns {Promise<void>}
 */
async function saveUser(userId, user) {
    userId = String(userId)
    return _withLock(async () => {
        normalizeUser(user, userId)
        const db = await _readDb()
        db.users[userId] = user
        await _writeDb(db)
    })
}

/**
 * Возвращает массив всех юзеров. Не нормализует.
 * @returns {Promise<Array<Object>>}
 */
async function getAllUsers() {
    const db = await _readDb()
    return Object.values(db.users)
}

module.exports = { getUser, saveUser, normalizeUser, getAllUsers }