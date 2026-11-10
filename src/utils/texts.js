// ИМПОРТЫ
const logic = require('../service/logic')
const { CROPS, CROP_ORDER, MUTATIONS, MUTATION_RANK, TITLES } = require('../service/config')

// ===== ЭКРАНИРОВАНИЕ HTML =====
function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
}

function displayName(user) {
    let prefix = '';
    // Проверяем надетый титул
    if (user.activeTitle && TITLES[user.activeTitle]) {
        prefix += TITLES[user.activeTitle].emoji + ' ';
    }
    // Проверяем VIP (если нет титула или даже если есть, можно добавить VIP)
    if (logic.vip.isVipActive(user)) {
        prefix += '💎 ';
    }

    // Проверяем ник (именно nickname, а не username!)
    if (user.nickname && user.nickname !== 'Игрок') {
        return escapeHtml(prefix + user.nickname);
    }
    if (user.username && user.username !== 'unknown') {
        return escapeHtml(prefix + user.username);
    }
    return prefix + 'Игрок';
}

// ===== КОНСТАНТЫ =====
const WELCOME = '🌾 <b>FARM TYCOON</b>\n\n' +
    'Добро пожаловать на твою ферму!\n' +
    'Сажай семена, собирай урожай, лови золотые мутации и богатей.\n\n' +
    '👇 Жми кнопку ниже, чтобы начать:'

const HELP = 'ℹ️ <b>СПРАВКА ПО ИГРЕ</b>\n\n' +
    'Добро пожаловать на ферму! Твоя цель — сажать культуры, собирать их и богатеть.\n\n' +
    
    '<b>🌦 Погода</b>\n' +
    'Меняется каждые 2 часа. <b>Дождь</b> ускоряет рост, <b>Засуха</b> повышает цены на продажу, <b>Ясно</b> — стандарт. Погода запоминается в момент посадки!\n\n' +
    
    '<b>💎 VIP и Рефералы</b>\n' +
    '• VIP дает <b>+20%</b> к прибыли за каждый сбор.\n' +
    '• За друга вы получаете 5.000 монет, а друг — 1.500.\n' +
    '• За каждые <b>3 приглашенных</b> друга вы получаете <b>7 дней VIP</b>!\n' +
    'Ссылка: в меню «🤝 Друзья».\n\n' +
    
    '<b>🎟 Промокоды</b>\n' +
    'Вводи коды командой <code>/promo КОД</code>. Ищи их в канале @dedayson_news!\n\n' +
    
    '<b>🌱 Культуры (время / цена семян)</b>\n' +
    '🌾 Пшеница — 15с / 100\n' +
    '🥒 Огурец — 30с / 250\n' +
    '🥕 Морковь — 1.5м / 500\n' +
    '🍓 Клубника — 5м / 1.500\n' +
    '🌶 Перец — 6м / 2.000\n' +
    '🎃 Тыква — 7.5м / 3.000\n' +
    '🍅 Помидор — 15м / 8.000\n' +
    '🌽 Кукуруза — 20м / 12.000\n' +
    '🍉 Арбуз — 30м / 20.000\n' +
    '🍑 Персик — 1ч / 40.000\n' +
    '🍇 Виноград — 2ч / 100.000\n' +
    '🍍 Ананас — 4ч / 500.000\n\n' +
    
    '<b>🧬 Мутации</b>\n' +
    'Обычная — 85% (×1)\n' +
    '✨ Серебряная — 12% (×2)\n' +
    '🌟 Золотая — 3% (×6)\n\n' +
    
    '<b>⚖️ Вес</b>\n' +
    'Каждый плод имеет свой вес. Чем тяжелее — тем больше монет!\n\n' +
    
    '<b>🕹 Команды</b>\n' +
    '/start — запуск бота\n' +
    '/menu — главное меню\n' +
    '/me — профиль\n' +
    '/promo — активировать код\n' +
    '/help — эта справка';

const PLANT_ERRORS = {
    unknown_crop:     '❓ Такой культуры нет. Выбери из списка!',
    no_free_slots:    '🌱 Все грядки заняты. Собери урожай или расширь поле!',
    not_enough_coins: '💰 Монет не хватает. Собери урожай или подожди немного!',
    no_seeds:         '🎒 Нет семян. Купи на рынке — /farm → 🌱 Культуры',
    slot_occupied:    '🌱 Тут уже что-то растёт. Собери урожай сначала',
    bad_slot:         '❌ Неверный слот. Попробуй ещё раз',
}

// ===== ЭКРАНЫ =====

/**
 * Текст главного меню
 */
function menuText(user) {
    const leftTimeVip = logic.vip.isVipActive(user) ? user.vipUntil - logic.time.now() : 0;
    const leavesText = logic.event.isEventActive()?`🍂 Листья: ${user.leaves}\n`: ''
    return `🌾 <b>FARM TYCOON</b>\n\n` +
        `👤 Ник: <b>${displayName(user)}</b>\n` +
        `💰 Баланс: <b>${logic.format.formatNumber(user.coin)}</b> монет\n` +
        `💎 VIP: ${logic.vip.isVipActive(user) ? `👑 <b>VIP активен еще ${logic.format.formatTime(leftTimeVip)}</b>\n` : 
            '❌ <b>VIP не активен</b>'}\n` +
        leavesText +
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
            if (logic.time.isReady(user.slots[i], user)) ready++
        }
    }
    
    let status = `🌱 Занято: ${busy}/${total}`
    if (ready > 0) status += ` · ✅ Готово: ${ready}`
    const weather = logic.events.getCurrentEvent()
    const leavesLine = logic.event.isEventActive() ? `🍂 Листья: ${user.leaves}\n` : ''

    return `🚜 <b>ТВОЯ ФЕРМА</b>\n\n` +
        `💰 Баланс: <b>${logic.format.formatNumber(user.coin)}</b> монет\n` +
        leavesLine +
        `${weather.emoji} ${weather.name}\n${weather.desc}\n\n` +
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
/**
 * Текст экрана «✅ СОБРАНО!».
 */
function harvestText(items, balance) {
    const groups = {}

    // 1. Группируем предметы
    for (const item of items) {
        const key = `${item.crop}:${item.mutation}`
        if (!groups[key]) {
            groups[key] = { crop: item.crop, mutation: item.mutation, count: 0, sum: 0, weight: 0 }
        }
        groups[key].count++
        groups[key].sum += Number(item.reward) || 0
        groups[key].weight += Number(item.weight) || 0
    }

    // 2. Сортируем
    const sorted = Object.values(groups).sort((a, b) => {
        const rankDiff = MUTATION_RANK[a.mutation] - MUTATION_RANK[b.mutation]
        if (rankDiff !== 0) return rankDiff
        return CROP_ORDER.indexOf(a.crop) - CROP_ORDER.indexOf(b.crop)
    })

    // 3. Формируем строки культур
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

    // 4. Считаем общую сумму и листья
    const totalReward = items.reduce((sum, it) => sum + (Number(it.reward) || 0), 0)
    const totalLeaves = items.reduce((sum, it) => sum + (Number(it.leaves) || 0), 0)

    // 5. Собираем итоговый текст
    const parts = ['✅ <b>СОБРАНО!</b>']
    
    if (lines.length > 0) {
        parts.push('')
        parts.push(...lines)
    }
    
    parts.push('')
    parts.push(`💰 Получено: <b>${logic.format.formatNumber(totalReward)}</b> монет`)
    // 👈 Выводим листья, только если они есть и идет ивент
    if (totalLeaves > 0 && logic.event.isEventActive()) {
        parts.push(`🍂 Найдено листьев: <b>+${totalLeaves}</b>`)
    }
    
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

function friendsText(user) {
    const link = `https://t.me/FarmTycoonGameBot?start=ref_${user.refCode}`
    const count = user.referralCount || 0

    const countLine = count === 0
        ? `👥 Вы пока никого не пригласили.\n🔗 Поделитесь ссылкой ниже — и получите бонус!`
        : `👥 Вы пригласили: <b>${count}</b> чел. <i>Отличная работа!</i>`

    return `🤝 <b>ДРУЗЬЯ</b>\n\n` +
        `Приглашайте друзей — и получайте бонусы!\n` +
        `Вы получите <b>5.000</b> монет, когда друг соберёт <b>5 урожаев</b>.\n` +
        `Друг получит <b>1.500</b> монет на старт сразу.\n\n` +
        `${countLine}\n\n` +
        `🔗 Ваша ссылка:\n<code>${link}</code>\n\n` +
        `Отправьте её другу или нажмите «Поделиться»!`
}

/**
 * Текст экрана осеннего ивента.
 */
function eventText(user) {
    // Проверяем, куплена ли шляпа
    const hatStatus = user.strawHat ? '✅ Куплена' : '500 🍂';

    return `🍂 <b>ПРАЗДНИК УРОЖАЯ</b>\n\n` +
        `Осень в самом разгаре! Собирай урожай любого растения, чтобы получать <b>Осенние листья</b>.\n` +
        `Чем реже мутация, тем больше листьев выпадет:\n` +
        `• Обычная — 1 🍂\n` +
        `• ✨ Серебряная — 3 🍂\n` +
        `• 🌟 Золотая — 10 🍂\n\n` +
        `🍂 Ваш баланс: <b>${logic.format.formatNumber(user.leaves || 0)}</b> листьев\n\n` +
        `<b>🎁 Награды за листья:</b>\n` +
        `🍄 Гриб — 50 🍂 (сразу сажается на ферму)\n` +
        `👒 Соломенная шляпа — ${hatStatus}\n` +
        `<i>Ускоряет рост всех культур на 2% навсегда</i>\n` +
        `👑 Титул «Осенний Магнат» — 200 🍂\n` +
        `🎰 Ящик сокровищ — 100 🍂\n` +
        `<i>Внутри: монеты, VIP или джекпот!</i>\n\n` +
        `👇 Выбери награду:`;
}

function titlesText(user) {
    let text = `🎨 <b>ВАШИ ТИТУЛЫ</b>\n\n`

    // Пустое состояние
    if (!user.ownedTitles || user.ownedTitles.length === 0) {
        return text +
            `👑 У вас пока нет титулов.\n\n` +
            `🏆 Загляните в магазин — там есть на что посмотреть!\n` +
            `🎁 А за участие в ивентах титулы даются бесплатно!`
    }

    // Активный титул
    const activeEntry = user.activeTitle ? TITLES[user.activeTitle] : null
    const activeName = activeEntry ? activeEntry.name : null

    // Защита от «мёртвого» титула: id есть, а в конфиге уже нет
    if (user.activeTitle && !activeEntry) {
        user.activeTitle = null
    }

    text += activeName
        ? `👑 Текущий титул: <b>${activeName}</b>\n\n`
        : `👑 Текущий титул: <i>не выбран</i>\n\n`

    text += `👇 Нажмите на титул ниже, чтобы надеть его:`

    return text
}

function meText(user) {
    const isVip = logic.vip.isVipActive(user);
    const leftTimeVip = isVip ? user.vipUntil - logic.time.now() : 0;
    // Форматируем лучший урожай
    let bestHarvestStr = 'Пока нет рекордов';
    if (user.stats && user.stats.bestHarvest > 0) {
        const crop = CROPS[user.stats.bestCrop];
        const mut = MUTATIONS[user.stats.bestMutation];
        const weight = user.stats.bestWeight ? `${user.stats.bestWeight.toFixed(1)} кг` : '';
        
        if (crop && mut) {
            const mutText = mut.emoji ? `${mut.emoji} ` : '';
            bestHarvestStr = `${logic.format.formatNumber(user.stats.bestHarvest)} (${mutText}${crop.emoji} ${weight})`;
        } else {
            bestHarvestStr = `${logic.format.formatNumber(user.stats.bestHarvest)} монет`;
        }
    }
    const leavesText = logic.event.isEventActive() ? `🍂 Листья: <b>${user.leaves || 0}</b>\n` : ''
    const leftDayToReg = Math.floor((logic.time.now() - user.createdAt) / 86400) || 0;
    return `👤 <b>ПРОФИЛЬ ИГРОКА</b>\n\n` +
        `🏷 Ник: <b>${displayName(user)}</b>\n` +
        `🆔 ID: <code>${user.id}</code>\n` +
        `Статус: ${isVip ? `👑 <b>VIP активен еще <i>${logic.format.formatTime(leftTimeVip)}</i></b>` : '❌ <b>VIP не активен</b>'}\n\n` +
        `💰 Баланс: <b>${logic.format.formatNumber(user.coin)}</b> монет\n` +
        `🚜 На ферме с <b>${logic.format.formatDate(user.createdAt)}(<i>${leftDayToReg} дн.</i>)</b>\n` +
        leavesText +
        `🏆 Рекорд урожая: ${bestHarvestStr}`;
}

// ===== ЭКСПОРТ =====
module.exports = {
    WELCOME, HELP, PLANT_ERRORS,
    menuText, farmText, harvestText, 
    shopText, topCoinsText, topHarvestText,
    escapeHtml, displayName, friendsText, eventText, titlesText, meText
}