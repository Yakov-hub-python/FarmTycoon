const config = require('../config')
const vip = require('./vip')
const random = require('../../utils/random')
const plant = require('./plant')
const format = require('./formatting')


/**
 * Возвращает конфиг кейса по ключу.
 * @param {string|number} lootboxKey
 * @returns {Object|null}
 */
function getLootbox(lootboxKey) {
    const key = String(lootboxKey)
    if (!config.LOOTBOX[key]) return null
    return config.LOOTBOX[key]
}

/**
 * Взвешенный ролл дропа по шансам.
 * @param {Array<{chance: number}>} drops
 * @returns {Object|null} Выпавший дроп или null, если массив пуст/невалиден
 */
function rollChance(drops) {
    if (!Array.isArray(drops) || drops.length === 0) return null

    const total = drops.reduce((sum, d) => sum + d.chance, 0)
    let roll = random.randomFloat(0, total, 2)

    for (const drop of drops) {
        roll -= drop.chance
        if (roll < 0) return drop
    }

    // Страховка от погрешности плавающей точки
    return drops[drops.length - 1]
}

/**
 * Ролл дропа из кейса.
 * @param {Object|null} lootbox - Объект кейса из config (НЕ ключ!)
 * @returns {Object|null}
 */
function rollLootboxDrop(lootbox) {
    if (!lootbox) return null
    return rollChance(lootbox.drops)
}

/**
 * Считает компенсацию за семя при отсутствии свободных слотов.
 * 66% от максимальной стоимости растения (maxWeight × pricePerKG).
 * @param {Object} crop - Объект растения из config.CROPS
 * @returns {number} Сумма в монетах (0, если данных не хватает)
 */
function getSeedFallback(crop) {
    if (!crop) return 0
    if (!Number.isFinite(crop.maxWeightKG) || !Number.isFinite(crop.pricePerKG)) {
        return 0
    }
    const maxValue = crop.maxWeightKG * crop.pricePerKG
    return Math.round(maxValue * config.SEED_FALLBACK_MULT)
}

/**
 * Правильная форма слова «день» в русском.
 * @param {number} days
 * @returns {'день'|'дня'|'дней'}
 */
function pluralDays(days) {
    const mod10 = days % 10
    const mod100 = days % 100
    if (mod10 === 1 && mod100 !== 11) return 'день'
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'дня'
    return 'дней'
}

/**
 * Открывает кейс: списывает монеты, роллит дроп, выдаёт награду.
 * ⚠️ НЕ сохраняет пользователя — сохранение в хендлере.
 *
 * @param {Object} user - Данные игрока (мутируется).
 * @param {string} lootboxKey - Ключ кейса.
 * @returns {{ok: true, price: number, text: string, drop: Object}
 *         | {ok: false, error: string, price?: number}}
 */
function openLootbox(user, lootboxKey) {
    const lootbox = getLootbox(lootboxKey)
    if (!lootbox) return { ok: false, error: 'invalid_lootbox' }

    if (user.coin < lootbox.price) {
        return { ok: false, error: 'not_enough_coins', price: lootbox.price }
    }

    const drop = rollLootboxDrop(lootbox)
    if (!drop) return { ok: false, error: 'empty_drops' }

    // Списываем монеты за кейс
    user.coin -= lootbox.price

    let rewardText

    // ===== МОНЕТЫ =====
    if (drop.type === 'coins') {
        user.coin += drop.amount
        rewardText = `💰 ${format.formatShortNumber(drop.amount)} монет`
    }

    // ===== VIP =====
    else if (drop.type === 'vip') {
        vip.addVipDays(user, drop.days, 'lootbox_' + String(lootboxKey))
        rewardText = `💎 VIP на ${drop.days} ${pluralDays(drop.days)}`
    }

    // ===== СЕМЯ =====
    else if (drop.type === 'seed') {
        if (!Array.isArray(drop.pool) || drop.pool.length === 0) {
            // Плохой конфиг — возвращаем деньги
            user.coin += lootbox.price
            return { ok: false, error: 'empty_seed_pool' }
        }

        const cropKey = drop.pool[Math.floor(Math.random() * drop.pool.length)]
        const crop = config.CROPS[cropKey]
        if (!crop) {
            user.coin += lootbox.price
            return { ok: false, error: 'unknown_crop' }
        }

        const plantResult = plant.plant(user, cropKey)
        if (plantResult.ok) {
            rewardText = `${crop.emoji} Семя «${crop.name}» посажено!\n📍 Смотри на ферме`

        } else if (plantResult.error === 'no_free_slots') {
            const fallback = getSeedFallback(crop)
            user.coin += fallback
            rewardText =
                `${crop.emoji}→💰 Нет грядок, выдано ` +
                `${format.formatShortNumber(fallback)} монет`

        } else {
            user.coin += lootbox.price
            return { ok: false, error: plantResult.error }
        }
    }

    // ===== НЕИЗВЕСТНЫЙ ТИП =====
    else {
        rewardText = '✅ Награда'
    }

    return {
        ok: true,
        price: lootbox.price,
        text: rewardText,
        drop: drop,
    }
}

module.exports = {
    getLootbox,
    rollChance,
    rollLootboxDrop,
    getSeedFallback,
    openLootbox,
}