// ИМПОРТЫ
const logic = require('../service/logic')
const { CROPS, CROP_ORDER, MUTATIONS, MUTATION_RANK } = require('../service/config')
const events = require('../service/logic/events')

// ===== ЭКРАНИРОВАНИЕ HTML =====
function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function displayName(user) {
    if (user.nickname && user.username !== 'Игрок'){
        return escapeHtml(`${user.nickname}` + (logic.vip.isVipActive(user) ? ' 💎' : ''));
    }
    if (user.username && user.username !== 'unknown' && user.username !== 'uncknown') {
        return escapeHtml(`${user.username}` + (logic.vip.isVipActive(user) ? ' 💎' : ''));
    }
    return 'Игрок' + (logic.vip.isVipActive(user) ? ' 💎' : '');
}

// ===== КОНСТАНТЫ =====
const WELCOME = '🌾 <b>FARM TYCOON</b>\n\n' +
    'Добро пожаловать на твою ферму!\n' +
    'Сажай семена, собирай урожай, лови золотые мутации и богатей.\n\n' +
    '👇 Жми кнопку ниже, чтобы начать:'

const HELP = 'ℹ️ <b>СПРАВКА</b>\n\n' +
    '<b>Культуры</b>\n' +
    '🌾 Пшеница — 15 сек (100)\n' +
    '🥒 Огурец — 30 сек (250)\n' +
    '🥕 Морковь — 1.5 мин (500)\n' +
    '🍓 Клубника — 5 мин (1.500)\n' +
    '🎃 Тыква — 7.5 мин (3.000)\n' +
    '🍅 Помидор — 15 мин (8.000)\n' +
    '🍉 Арбуз — 30 мин (20.000)\n' +
    '🍇 Виноград — 2 часа (100.000)\n' +
    '🍍 Ананас — 4 часа (500.000)\n\n' +
    '<b>Мутации</b>\n' +
    'Обычная — 85% (×1)\n' +
    '✨ Серебряная — 12% (×2)\n' +
    '🌟 Золотая — 3% (×6)\n\n' +
    '<b>Вес</b>\n' +
    'Чем тяжелее плод, тем больше монет ты получишь!\n\n' +
    '<b>VIP</b>\n' +
    'VIP-статус дает +20% к продаже урожая и значок в профиле. Выдается за промокоды.\n\n' +
    '<b>Погода</b>\n' +
    'Каждый день на ферме меняется погода. Она влияет на время роста урожая и на его стоимость.\n\n' +
    '<b>Команды</b>\n' +
    '/start — запуск бота\n' +
    '/menu — главное меню\n' +
    '/help — справка'

const PLANT_ERRORS = {
    unknown_crop:     '❓ Такой культуры нет',
    no_free_slots:    '🌱 Все слоты заняты. Расширь поле!',
    not_enough_coins: '💰 Не хватает монет',
    no_seeds:         '🎒 Нет семян. Купи на рынке!',
    slot_occupied:    '🌱 Этот слот уже занят',
    bad_slot:         '❌ Неверный слот',
}

// ===== ЭКРАНЫ =====

/**
 * Текст главного меню
 */
function menuText(user) {
    return `🌾 <b>FARM TYCOON</b>\n\n` +
        `👤 Ник: <b>${displayName(user)}</b>\n` +
        `💰 Баланс: <b>${logic.format.formatNumber(user.coin)}</b> монет\n` +
        `🌱 Слотов: ${user.slots.length}\n\n` +
        `👇 Выбери действие:`
}

/**
 * Текст экрана фермы
 */
function farmText(user) {
    const total = user.slots.length
    let busy = 0
    let ready = 0
    for (let i = 0; i < user.slots.length; i++) {
        if (user.slots[i] !== null) {
            busy++
            if (logic.time.isReady(user.slots[i])) ready++
        }
    }
    
    let status = `🌱 Занято: ${busy}/${total}`
    if (ready > 0) status += ` · ✅ Готово: ${ready}`
    
    return `🚜 <b>ТВОЯ ФЕРМА</b>\n\n` +
        `💰 Баланс: <b>${logic.format.formatNumber(user.coin)}</b> монет\n` +
        `${logic.events.getCurrentEvent().emoji} ${logic.events.getCurrentEvent().name}\n${logic.events.getCurrentEvent().desc}\n\n` +
        `${status}\n\n` +
        `👇 Выбери слот или купи семена:`
}

/**
 * Текст экрана магазина
 */
function shopText(user) {
    return `🛒 <b>МАГАЗИН СЕМЯН</b>\n\n` +
        `💰 Баланс: <b>${logic.format.formatNumber(user.coin)}</b> монет\n\n` +
        `Выбери количество (сверху) и нажми на семя:`
}

/**
 * Текст экрана «✅ СОБРАНО!».
 */
function harvestText(items, balance) {
    const groups = {}

    for (const item of items) {
        const key = `${item.crop}:${item.mutation}`
        if (!groups[key]) {
            groups[key] = { crop: item.crop, mutation: item.mutation, count: 0, sum: 0, weight: 0 }
        }
        groups[key].count++
        groups[key].sum += Number(item.reward) || 0
        groups[key].weight += Number(item.weight) || 0
    }

    const sorted = Object.values(groups).sort((a, b) => {
        const rankDiff = MUTATION_RANK[a.mutation] - MUTATION_RANK[b.mutation]
        if (rankDiff !== 0) return rankDiff
        return CROP_ORDER.indexOf(a.crop) - CROP_ORDER.indexOf(b.crop)
    })

    const lines = sorted.map(g => {
        const crop = CROPS[g.crop]
        const mut = MUTATIONS[g.mutation]
        if (!crop || !mut) return null

        const weightStr = g.weight.toFixed(1)

        if (g.mutation === 'common') {
            return `${crop.emoji} ${crop.name} ×${g.count} (${weightStr} кг)`
        }
        return `${mut.emoji} ${mut.name} ${crop.emoji} ×${g.count} (${weightStr} кг) (+${logic.format.formatNumber(g.sum)})`
    }).filter(Boolean)

    const total = items.reduce((sum, it) => sum + (Number(it.reward) || 0), 0)

    const parts = ['✅ <b>СОБРАНО!</b>']
    if (lines.length > 0) {
        parts.push('')
        parts.push(...lines)
    }
    parts.push('')
    parts.push(`💰 Получено: <b>${logic.format.formatNumber(total)}</b> монет`)
    parts.push(`💼 Баланс: <b>${logic.format.formatNumber(balance)}</b>`)

    return parts.join('\n')
}

/**
 * Текст экрана «ТОП БОГАЧЕЙ».
 */
function topCoinsText(users) {
    if (users.length === 0) return '💰 <b>ТОП БОГАЧЕЙ</b>\n\nПока пусто.'

    const lines = users.map((user, i) =>
        `${i + 1}. <b>${displayName(user)}</b> — ${logic.format.formatNumber(user.coin)} монет`
    )

    return `💰 <b>ТОП БОГАЧЕЙ</b>\n(Текущий баланс)\n\n${lines.join('\n')}`
}

/**
 * Текст экрана «ТОП УРОЖАЕВ».
 */
function topHarvestText(users) {
    if (users.length === 0) return '🏆 <b>ТОП УРОЖАЕВ</b>\n\nПока никто не собрал урожай.'

    const lines = users.map((user, i) => {
        const name = displayName(user)
        const crop = CROPS[user.stats.bestCrop]
        const mutation = MUTATIONS[user.stats.bestMutation]

        if (!crop || !mutation) {
            return `${i + 1}. <b>${name}</b> — ${logic.format.formatNumber(user.stats.bestHarvest)}`
        }

        const mutText = mutation.emoji ? `${mutation.emoji} ` : ''
        const cropText = `${mutText}${crop.emoji}`
        const weight = Number(user.stats.bestWeight) || 0
        const weightText = weight > 0 ? ` ${weight.toFixed(1)} кг` : ''

        return `${i + 1}. <b>${name}</b> — ${logic.format.formatNumber(user.stats.bestHarvest)} (${cropText}${weightText})`
    })

    return `🏆 <b>ТОП УРОЖАЕВ</b>\n(Лучший сбор за раз)\n\n${lines.join('\n')}`
}

function friendsText(user, botUsername='FarmTycoonGameBot') {
    const link = `https://t.me/FarmTycoonGameBot?start=ref_${user.refCode}`
    return `🤝 <b>ДРУЗЬЯ</b>\n\n` +
        `Приглашай друзей и получай бонусы!\n` +
        `Вы получаете <b>5.000</b> монет, а ваш друг — <b>1.500</b> монет на старт.\n\n` +
        `👥 Вы пригласили: <b>${user.referralCount || 0}</b> чел.\n\n` +
        `🔗 Ваша ссылка:\n<code>${link}</code>\n\n` +
        `Отправь её другу или нажми «Поделиться»!`
}

// ===== ЭКСПОРТ =====
module.exports = {
    WELCOME, HELP, PLANT_ERRORS,
    menuText, farmText, harvestText, 
    shopText, topCoinsText, topHarvestText,
    escapeHtml, displayName, friendsText
}