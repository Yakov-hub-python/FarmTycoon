// ИМПОРТЫ
const { Markup } = require('telegraf')
const logic = require('../service/logic')
const { CROPS, CROP_ORDER, TITLES } = require('../service/config')

/**
 * Текст одной кнопки слота.
 */
function _slotLabel(i, slot, user) {
    if (slot === null) return `🌱 Слот ${i + 1}: пусто`
    const crop = CROPS[slot.crop]
    if (!crop) return `🌱 Слот ${i + 1}: пусто`
    const left = logic.time.timeLeft(slot, user)
    if (left > 0) return `${crop.emoji} ${logic.format.formatTime(left)}`
    return `✅ Собрать ${crop.emoji}`
}

/**
 * Главное меню (Дашборд).
 */
function mainMenuKb() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🌾 Моя ферма', 'farm')],
        [
            Markup.button.callback('🛒 Магазин', 'shop'),
            Markup.button.callback('🏆 Топы', 'top')
        ],
        [Markup.button.callback('👤 Профиль', 'profile')],
        [
            Markup.button.callback('📅 Бонус', 'daily'),
            Markup.button.callback('ℹ️ Помощь', 'help')
        ],
        [Markup.button.callback('🤝 Друзья', 'friends')],
        [Markup.button.callback('🍂 Праздник Урожая', 'event')]
    ])
}

/**
 * Универсальная кнопка "Назад" (в меню).
 */
function backKb() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ В меню', 'menu')],
    ])
}

/**
 * Клавиатура после сбора урожая.
 */
function afterHarvestKb() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🌾 К ферме', 'farm')],
        [Markup.button.callback('⬅️ В меню', 'menu')],
    ])
}

/**
 * Главная клавиатура экрана фермы.
 */
function farmKb(user) {
    const rows = []

    // 1. Собрать всё (если есть готовые)
    if (user.slots.some(slot => logic.time.isReady(slot, user))) {
        rows.push([
            Markup.button.callback('🧺 Собрать всё', 'harvest_all'),
        ])
    }

    // 2. Слоты (по 2 в ряд)
    const slotBtns = user.slots.map((slot, i) =>
        Markup.button.callback(_slotLabel(i, slot, user), `slot:${i}`)
    )
    for (let i = 0; i < slotBtns.length; i += 2) {
        rows.push(slotBtns.slice(i, i + 2))
    }

    // 3. Магазин и Расширение
    rows.push([
        Markup.button.callback('🛒 Магазин', 'shop'),
    ])
    rows.push([
        Markup.button.callback(`🟫 Расширить (${logic.format.formatNumber(logic.expansion.nextSlotPrice(user))})`, 'expand'),
    ])
    // 4. Обновить
    rows.push([
        Markup.button.callback('🔄 Обновить', 'farm'),
    ])

    // 5. В меню
    rows.push([
        Markup.button.callback('⬅️ В меню', 'menu'),
    ])

    return Markup.inlineKeyboard(rows)
}

/**
 * Клавиатура магазина.
 */
function shopKb(count = 1) {
    const rows = []

    // Кнопки количества (с галочкой)
    const options = [1, 2, 5, 10]
    const countBtns = options.map(opt => {
        const text = (opt === count) ? `✅ X${opt}` : `X${opt}`
        return Markup.button.callback(text, `update_count_${opt}`)
    })
    for (let i = 0; i < countBtns.length; i += 2) {
        rows.push(countBtns.slice(i, i + 2))
    }

    // Кнопки семян (по 2 в ряд)
    const seedBtns = CROP_ORDER.map(key => {
        const crop = CROPS[key]
        return Markup.button.callback(
            `${crop.emoji} ${logic.format.formatNumber(crop.seed * count)}`,
            `plant:${key}:${count}`
        )
    })
    for (let i = 0; i < seedBtns.length; i += 2) {
        rows.push(seedBtns.slice(i, i + 2))
    }

    // Кнопки навигации
    rows.push([
        Markup.button.callback('⬅️ На ферму', 'farm'),
        Markup.button.callback('⬅️ В меню', 'menu')
    ])

    return Markup.inlineKeyboard(rows)
}

/**
 * Клавиатура экрана ТОП.
 */
function topsKb() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('💰 По монетам', 'top_coins')],
        [Markup.button.callback('🏆 Лучший урожай', 'top_harvest')],
        [Markup.button.callback('⬅️ В меню', 'menu')],
    ])
}

function friendsKb(user) {
    const link = `https://t.me/FarmTycoonGameBot?start=ref_${user.refCode}`
    const shareText = encodeURIComponent('Залетай на мою ферму! Получишь 1500 монет на старт 🚜')
    
    return Markup.inlineKeyboard([
        [Markup.button.url('📤 Поделиться', `https://t.me/share/url?url=${link}&text=${shareText}`)],
        [{ text: '📋 Скопировать', copy_text: { text: link } }],
        [Markup.button.callback('⬅️ В меню', 'menu')],
    ])
}

function eventKb(user){
    return Markup.inlineKeyboard([
        [Markup.button.callback('🍄 Гриб (50 🍂)', 'event_buy_mushroom')],
        [Markup.button.callback('👒 Шляпа (500 🍂)', 'event_buy_strawHat')],
        [Markup.button.callback('👑 Титул (200 🍂)', 'event_buy_title')],
        [Markup.button.callback('🎁 Ящик (100 🍂)', 'event_buy_lootbox')],
        [Markup.button.callback('⬅️ В меню', 'menu')]
    ])
}

function titlesKb(user) {
    const rows = []
    
    if (user.ownedTitles && user.ownedTitles.length > 0) {
        // Создаем кнопки для купленных титулов
        const titleBtns = user.ownedTitles.map(id => {
            const title = TITLES[id]
            if (!title) return null
            
            // Если титул надет, ставим галочку
            const isEquipped = user.activeTitle === id
            const text = isEquipped ? `✅ ${title.name}` : title.name
            return Markup.button.callback(text, `equip_title:${id}`)
        }).filter(Boolean)

        // Разбиваем по 2 в ряд
        for (let i = 0; i < titleBtns.length; i += 2) {
            rows.push(titleBtns.slice(i, i + 2))
        }

        // Кнопка "Снять титул", если какой-то надет
        if (user.activeTitle) {
            rows.push([Markup.button.callback('❌ Снять титул', 'equip_title:none')])
        }
    }

    rows.push([Markup.button.callback('⬅️ Назад в профиль', 'profile')])
    return Markup.inlineKeyboard(rows)
}

function profileKb() {
    return Markup.inlineKeyboard([
        [Markup.button.callback('🎨 Мои титулы', 'titles_menu')],
        [Markup.button.callback('⬅️ В меню', 'menu')],
    ])
}

// ===== ЭКСПОРТ =====
module.exports = {
    mainMenuKb,
    backKb,
    afterHarvestKb,
    farmKb,
    shopKb,
    topsKb,
    friendsKb,
    eventKb,
    titlesKb,
    profileKb,
}