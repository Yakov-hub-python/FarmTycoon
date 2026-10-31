// ИМПОРТЫ
const { Markup } = require('telegraf')
const logic = require('../service/logic')
const { CROPS, CROP_ORDER } = require('../service/config')


/**
 * Текст одной кнопки слота.
 * @param {number} i — индекс слота (0-based)
 * @param {Object|null} slot
 * @returns {string}
 */
function _slotLabel(i, slot) {
    if (slot === null) return `🌱 Слот ${i + 1}: пусто`

    const crop = CROPS[slot.crop]
    if (!crop) return `🌱 Слот ${i + 1}: пусто`

    const left = logic.time.timeLeft(slot)
    if (left > 0) return `${crop.emoji} ${logic.format.formatTime(left)}`
    return `✅ Собрать ${crop.emoji}`
}


/**
 * Клавиатура главного меню.
 * @returns {Object} Telegraf Markup
 */
function mainMenuKb() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🌾 Открыть ферму', 'farm')],
        [Markup.button.callback('🏆 ТОП', 'top'), Markup.button.callback('ℹ️ Помощь', 'help')],
        [Markup.button.callback('📅 Ежедневная награда', 'daily')],
    ])
}


/**
 * Клавиатура «назад в меню». Для экрана /help.
 * @returns {Object} Telegraf Markup
 */
function backKb() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ В меню', 'menu')],
    ])
}


/**
 * Клавиатура после сбора урожая. Для экрана «✅ СОБРАНО!».
 * @returns {Object} Telegraf Markup
 */
function afterHarvestKb() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🌾 К ферме', 'farm')],
        [Markup.button.callback('⬅️ В меню', 'menu')],
    ])
}


/**
 * Главная клавиатура экрана фермы.
 * @param {Object} user
 * @returns {Object} Telegraf Markup
 */
function farmKb(user) {
    const rows = []

    // 1. «Собрать всё» — только если есть готовые слоты
    if (user.slots.some(slot => logic.time.isReady(slot))) {
        rows.push([
            Markup.button.callback('🧺 Собрать всё', 'harvest_all'),
        ])
    }

    // 2. Слоты — по 2 в ряд
    const slotBtns = user.slots.map((slot, i) =>
        Markup.button.callback(_slotLabel(i, slot), `slot:${i}`)
    )
    for (let i = 0; i < slotBtns.length; i += 2) {
        rows.push(slotBtns.slice(i, i + 2))
    }

    // 3. Семена — по 2 в ряд, порядок из CROP_ORDER
    const seedBtns = CROP_ORDER.map(key => {
        const crop = CROPS[key]
        return Markup.button.callback(
            `${crop.emoji} ${logic.format.formatNumber(crop.seed)}`,
            `plant:${key}`
        )
    })
    for (let i = 0; i < seedBtns.length; i += 2) {
        rows.push(seedBtns.slice(i, i + 2))
    }

    // 4. Расширение
    rows.push([
        Markup.button.callback(
            `🟫 Расширить — ${logic.format.formatNumber(logic.expansion.nextSlotPrice(user))}`,
            'expand'
        ),
    ])

    // 5. Обновить
    rows.push([
        Markup.button.callback('🔄 Обновить', 'farm'),
    ])

    // 6. В меню
    rows.push([
        Markup.button.callback('⬅️ В меню', 'menu'),
    ])

    return Markup.inlineKeyboard(rows)
}

/**
 * Клавиатура экрана ТОП.
 * @returns {Object} Telegraf Markup
 */
function topsKb(){
    return Markup.inlineKeyboard([
        [Markup.button.callback('💰 По монетам', 'top_coins')],
        [Markup.button.callback('🏆 Лучший урожай', 'top_harvest')],
        [Markup.button.callback('⬅️ В меню', 'menu')],
    ])
}

// ===== ЭКСПОРТ =====
module.exports = {
    mainMenuKb,
    backKb,
    afterHarvestKb,
    farmKb,
    topsKb
}