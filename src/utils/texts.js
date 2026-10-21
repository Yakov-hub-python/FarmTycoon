// ИМПОРТЫ
const logic = require('../service/logic')
const { CROPS, CROP_ORDER, MUTATIONS, MUTATION_RANK } = require('../service/config')



/**
 * Текст сообщения "Cтарт", использует HTML-разметку
 */
const WELCOME = '🌾 <b>FARM TYCOON</b>\n\nСажай семена, собирай урожай, расширяй поле. \
Иногда урожай мутирует\n\nЖми «Открыть ферму»'


/**
 * Текст сообщения "ПОМОЩЬ", использует HTML-разметку
 */
const HELP = 'ℹ️ <b>ПОМОЩЬ</b>\n\
<b>Петля игры</b>\n\n\
Посадил → выросло → собрал → монеты → купил семена → ...\n\n\
<b>Культуры</b>\n\n\
🌾 Пшеница — 15 сек · семя 100 · продажа 120\n\
🥕 Морковь — 1.5 мин · семя 500 · продажа 600\n\
🎃 Тыква — 7.5 мин · семя 3.000 · продажа 3.600\n\
🍉 Арбуз — 30 мин · семя 20.000 · продажа 24.000\n\n\
<b>Мутации</b>\n\n\
Обычная — 85% (×1)\n\
✨ Серебряная — 12% (×2)\n\
🌟 Золотая — 3% (×6)\n\n\
<b>Расширение</b>\n\n\
Слот 9 — 5.000, каждый следующий ×3 дороже.\n\n\
<b>Команды</b>\n\n\
/start — регистрация\n\
/menu — главное меню\n\
/farm — ферма\n\
/help — справка'

const PLANT_ERRORS = {
    unknown_crop:     '❓ Такой культуры нет',
    no_free_slots:    '🌱 Все слоты заняты. Расширь поле!',
    not_enough_coins: '💰 Не хватает монет',
    no_seeds:         '🎒 Нет семян. Купи на рынке!',
    slot_occupied:    '🌱 Этот слот уже занят',
    bad_slot:         '❌ Неверный слот',
}

/** 
 * @param {Object} user Игрок
 * @returns {string} Сообщение меню
 */
function menuText(user) {
    return `🌾 <b>FARM TYCOON</b>\n\n\
Канал по боту: @dedayson_news\n\n\
💰 Монеты: ${logic.format.formatNumber(user.coin)}\n\
🌱 Слоты: ${user.slots.length}`
}

/**
 * Шапка экрана фермы. Используется HTML-разметка. Клавиатура рисуется отдельно (keyboards.farmKb).
 * @param {Object} user
 * @returns {string}
 */
function farmText(user) {
    const total = user.slots.length
    let busy = 0
    let ready = 0
    for (let i = 0; i < user.slots.length; i++) {
        if (user.slots[i] !== null) busy++
        if (logic.time.isReady(user.slots[i])) ready++
    }
    const head = `🌾 <b>ТВОЯ ФЕРМА</b>
💰 ${logic.format.formatNumber(user.coin)} монет
Слоты: ${busy}/${total} занято`
    const tail = ready > 0 ? ` · ✅ готово: ${ready}` : ''
    return head + tail
}

/**
 * Текст экрана «✅ СОБРАНО!». Показывается после сбора одного слота
 * или после «Собрать всё».
 *
 * @param {[{ crop: string, mutation: string, reward: number }]} items массив { crop, mutation, reward }
 * @param {number} balance текущий coin юзера
 * @returns {string}
 */
function harvestText(items, balance) {
    // 1. Группируем items по ключу "crop:mutation"
    const groups = {}

    for (const item of items) {
        const key = `${item.crop}:${item.mutation}`
        if (!groups[key]) {
            groups[key] = { crop: item.crop, mutation: item.mutation, count: 0, sum: 0 }
        }
        groups[key].count++
        groups[key].sum += item.reward
    }

    // 2. Сортируем: сначала по редкости (MUTATION_RANK), потом по порядку культур (CROP_ORDER)
    const sorted = Object.values(groups).sort((a, b) => {
        const rankDiff = MUTATION_RANK[a.mutation] - MUTATION_RANK[b.mutation]
        if (rankDiff !== 0) return rankDiff
        return CROP_ORDER.indexOf(a.crop) - CROP_ORDER.indexOf(b.crop)
    })

    // 3. Собираем строки для каждой группы
    const lines = sorted.map(g => {
        const crop = CROPS[g.crop]
        const mut = MUTATIONS[g.mutation]

        if (g.mutation === 'common') {
            return `${crop.emoji} ${crop.name} ×${g.count}`
        }
        return `${mut.emoji} ${mut.name} ${crop.emoji} ×${g.count} (+${logic.format.formatNumber(g.sum)})`
    })

    // 4. Считаем общую сумму
    const total = items.reduce((sum, it) => sum + it.reward, 0)

    // 5. Финальный текст
    const parts = ['✅ <b>СОБРАНО!</b>']

    if (lines.length > 0) {
        parts.push('')
        parts.push(...lines)
    }

    parts.push('')
    parts.push(`💰 Получено: ${logic.format.formatNumber(total)} монет`)
    parts.push(`💼 Баланс: ${logic.format.formatNumber(balance)}`)

    return parts.join('\n')
}

function topCoinsText(users) {
    if (users.length === 0) return '💰 <b>ТОП БОГАЧЕЙ</b>\n\nПока пусто.'

    const lines = users.map((user, i) => {
        const name = user.username || user.firstName || 'Игрок'
        return `${i + 1}. <b>${name}</b> — ${logic.format.formatNumber(user.coin)} монет`
    })

    return `💰 <b>ТОП БОГАЧЕЙ</b>\n(Текущий баланс)\n\n${lines.join('\n')}`
}

function topHarvestText(users) {
    if (users.length === 0) return '🏆 <b>ТОП УРОЖАЕВ</b>\n\nПока никто не собрал урожай.'

    const lines = users.map((user, i) => {
        const name = user.username || user.firstName || 'Игрок'
        const crop = CROPS[user.stats.bestCrop]
        const mutation = MUTATIONS[user.stats.bestMutation]
        
        if (!crop || !mutation) return `${i + 1}. <b>${name}</b> — ${logic.format.formatNumber(user.stats.bestHarvest)}`
        
        const mutText = mutation.emoji ? `${mutation.emoji} ` : ''
        const cropText = `${mutText}${crop.emoji}`
        
        return `${i + 1}. <b>${name}</b> — ${logic.format.formatNumber(user.stats.bestHarvest)} (${cropText})`
    })

    return `🏆 <b>ТОП УРОЖАЕВ</b>\n(Лучший сбор за раз)\n\n${lines.join('\n')}`
}

// ===== ЭКСПОРТ =====
module.exports = {
    WELCOME, HELP, PLANT_ERRORS,
    menuText, farmText, harvestText,
    topCoinsText, topHarvestText
}