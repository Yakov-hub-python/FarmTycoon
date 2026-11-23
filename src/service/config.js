require('dotenv').config()

// ===== ТЕХНИЧЕСКИЕ =====
const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) throw new Error('BOT_TOKEN не задан в .env')
const DB_PATH = process.env.DB_PATH || 'database.json'
const ADMIN_ID = String(process.env.ADMIN_ID || '')

const TIME_UNITS = [
    { label: 'д', sec: 24 * 60 * 60 },
    { label: 'ч', sec: 60 * 60 },
    { label: 'м', sec: 60 },
    { label: 'с', sec: 1 },
];

const NUMBER_UNITS = [
    { label: 'трлн', value: 1_000_000_000_000 },
    { label: 'млрд', value: 1_000_000_000 },
    { label: 'млн',  value: 1_000_000 },
    { label: 'тыс',  value: 1_000 },
]

// ===== СТАРТ =====
const START_COINS = 100
const START_SLOTS = 8

// ===== РАСШИРЕНИЕ =====
const SLOT_BASE_PRICE  = 5000
const SLOT_PRICE_MULT  = 3
const SLOT_PRICE_FIRST = 9
const SLOT_MAX_COUNT = 16
const SLOT_TOTAL_MAX = 20

// ===== КУЛЬТУРЫ =====
const CROPS = {
    'wheat': {
        name: 'Пшеница', emoji: '🌾', 
        growTime: 15, seed: 15,
        minWeightKG: 1.0, maxWeightKG: 3.0, pricePerKG: 18,
    },
    'cucumber': {
        name: 'Огурец', emoji: '🥒', 
        growTime: 30, seed: 40,
        minWeightKG: 1.5, maxWeightKG: 3.5, pricePerKG: 33,
    },
    'carrot': {
        name: 'Морковь', emoji: '🥕', 
        growTime: 90, seed: 100,
        minWeightKG: 2.0, maxWeightKG: 5.0, pricePerKG: 66,
    },
    'strawberry': {
        name: 'Клубника', emoji: '🍓', 
        growTime: 300, seed: 400,
        minWeightKG: 0.75, maxWeightKG: 2.5, pricePerKG: 560,
    },
    'pepper': {
        name: 'Перец', emoji: '🌶', 
        growTime: 360, seed: 500,
        minWeightKG: 0.5, maxWeightKG: 1.5, pricePerKG: 1040,
    },
    'pumpkin': {
        name: 'Тыква', emoji: '🎃', 
        growTime: 450, seed: 800,
        minWeightKG: 5.5, maxWeightKG: 15.0, pricePerKG: 148,
    },
    'tomato': {
        name: 'Помидор', emoji: '🍅', 
        growTime: 900, seed: 2000,
        minWeightKG: 2.5, maxWeightKG: 6.0, pricePerKG: 850,
    },
    'corn': {
        name: 'Кукуруза', emoji: '🌽', 
        growTime: 1200, seed: 3000,
        minWeightKG: 3.5, maxWeightKG: 8.0, pricePerKG: 890,
    },
    'watermelon': {
        name: 'Арбуз', emoji: '🍉', 
        growTime: 1800, seed: 5000,
        minWeightKG: 15.0, maxWeightKG: 25.0, pricePerKG: 395,
    },
    'peach': {
        name: 'Персик', emoji: '🍑', 
        growTime: 3600, seed: 12000,
        minWeightKG: 0.4, maxWeightKG: 0.8, pricePerKG: 30000,
    },
    'grape': {
        name: 'Виноград', emoji: '🍇', 
        growTime: 7200, seed: 30000,
        minWeightKG: 8.5, maxWeightKG: 15.0, pricePerKG: 3670,
    },
    'pineapple': {
        name: 'Ананас', emoji: '🍍', 
        growTime: 14400, seed: 70000,
        minWeightKG: 18.0, maxWeightKG: 30.0, pricePerKG: 3970,
    },

    // ===== ОСОБЫЕ РАСТЕНИЯ ИЗ КЕЙСОВ =====
    'goldenGrape': {
        name: 'Золотой виноград', emoji: '🍇', 
        growTime: 1800, seed: 0, fromCase: true,
        minWeightKG: 300, maxWeightKG: 500, pricePerKG: 1200,
    },
    'moonWheat': {
        name: 'Лунная пшеница', emoji: '🌌', 
        growTime: 600, seed: 0, fromCase: true,
        minWeightKG: 200, maxWeightKG: 300, pricePerKG: 2500,
    },
    'fireFlower': {
        name: 'Огненный цветок', emoji: '🌺', 
        growTime: 7200, seed: 0, fromCase: true,
        minWeightKG: 150, maxWeightKG: 250, pricePerKG: 6000,
    },
    'crystalFruit': {
        name: 'Кристальный плод', emoji: '🌠', 
        growTime: 21600, seed: 0, fromCase: true,
        minWeightKG: 800, maxWeightKG: 1200, pricePerKG: 2000,
    },
}

const CROP_ORDER = [
    'wheat', 'cucumber', 'carrot', 'strawberry', 'pepper', 
    'pumpkin', 'tomato', 'corn', 'watermelon', 'peach', 'grape', 'pineapple'
]

// ===== МУТАЦИИ =====
const MUTATIONS = {
    'common': { name: 'Обычная', emoji: '', chance: 0.85, mult: 1.0 },
    'silver': { name: 'Серебряная', emoji: '✨', chance: 0.12, mult: 1.75 },
    'gold': { name: 'Золотая', emoji: '🌟', chance: 0.03, mult: 4.5 }
}

const MUTATION_ROLL_ORDER = ['gold', 'silver', 'common']
const MUTATION_RANK = { common: 0, silver: 1, gold: 2 }

// ===== ПОГОДА =====
const EVENTS = [
    {
        name: 'Ясно',
        emoji: '☀️',
        growthMult: 1.0,
        sellMult: 1.0,
        desc: 'Обычный день на ферме.'
    },
    {
        name: 'Дождь',
        emoji: '🌧',
        growthMult: 0.8,
        sellMult: 1.0,
        desc: 'Рост ускорен на 20%!'
    },
    {
        name: 'Засуха',
        emoji: '🔥',
        growthMult: 1.2,
        sellMult: 1.4,
        desc: 'Рост замедлен, но продажа +40%!'
    }
]

// ===== VIP =====
const VIP_BONUS_MULT = 1.2

// ===== ТИТУЛЫ =====
const TITLES = {
    'autumn_magnate': { name: '🍂 Осенний Магнат', emoji: '🍂' },
    'lucky': { name: '🎰 Счастливчик', emoji: '🎰' }
}

// ===== ЛАБОРАТОРИЯ =====
const LAB_UPGRADES = {
    genetics: {
        name: 'Генетика',
        emoji: '🧬',
        desc: 'Повышает шанс золотой мутации',
        effectType: 'goldChance',
        effectPerLevel: 0.005,
        basePrice: 30000,
        priceMultiplier: 2.5,
        maxLevel: 8,
        cooldownSec: 1800,
    },
    selection: {
        name: 'Селекция',
        emoji: '🌾',
        desc: 'Увеличивает вес урожая',
        effectType: 'weight',
        effectPerLevel: 0.05,
        basePrice: 20000,
        priceMultiplier: 2.5,
        maxLevel: 8,
        cooldownSec: 1800,
    },
    agronomy: {
        name: 'Агрономия',
        emoji: '⏱',
        desc: 'Ускоряет рост культур',
        effectType: 'growthSpeed',
        effectPerLevel: 0.05,
        basePrice: 700000,
        priceMultiplier: 2.5,
        maxLevel: 4,
        cooldownSec: 3600,
    },
    land: {
        name: 'Земля',
        emoji: '🟫',
        desc: 'Добавляет грядки',
        effectType: 'slots',
        effectPerLevel: 1,
        basePrice: 700000,
        priceMultiplier: 2.5,
        maxLevel: 4,
        cooldownSec: 3600,
    },
}

// ===== КЕЙСЫ =====
const LOOTBOX = {
    common: {
        name: 'Обычный кейс',
        emoji: '📦',
        price: 10_000,
        tagline: '💰 до 50 тыс.',
        drops: [
            { chance: 33,   type: 'coins', amount: 7_000 },
            { chance: 38,   type: 'coins', amount: 11_000 },
            { chance: 20,   type: 'coins', amount: 12_000 },
            { chance: 8,    type: 'coins', amount: 15_000 },
            { chance: 1,    type: 'coins', amount: 50_000 },
        ],
    },
    silver: {
        name: 'Серебряный кейс',
        emoji: '🥈',
        price: 100_000,
        tagline: '💰 до 150 тыс. · 💎 VIP 2 дня\n🌱 0.5% — виноград или лунная пшеница',
        drops: [
            { chance: 33,   type: 'coins', amount: 70_000 },
            { chance: 35,   type: 'coins', amount: 110_000 },
            { chance: 20,   type: 'coins', amount: 120_000 },
            { chance: 10,   type: 'coins', amount: 150_000 },
            { chance: 1.5,  type: 'vip', days: 2 },
            { chance: 0.5,  type: 'seed', pool: ['goldenGrape', 'moonWheat'] },
        ],
    },
    gold: {
        name: 'Золотой кейс',
        emoji: '🥇',
        price: 500_000,
        tagline: '💰 до 3.5 млн · 💎 VIP 3 дня\n🌱 1% — огненный цветок',
        drops: [
            { chance: 33,   type: 'coins', amount: 350_000 },
            { chance: 33,   type: 'coins', amount: 550_000 },
            { chance: 20,   type: 'coins', amount: 600_000 },
            { chance: 11,   type: 'coins', amount: 750_000 },
            { chance: 1,    type: 'vip', days: 3 },
            { chance: 1,    type: 'seed', pool: ['fireFlower'] },
            { chance: 1,    type: 'coins', amount: 3_500_000 },
        ],
    },
    legendary: {
        name: 'Легендарный кейс',
        emoji: '💎',
        price: 2_000_000,
        tagline: '💰 до 20 млн · 💎 VIP 7 дней\n🌱 2% — кристальный плод',
        drops: [
            { chance: 33,   type: 'coins', amount: 1_400_000 },
            { chance: 33,   type: 'coins', amount: 2_200_000 },
            { chance: 20,   type: 'coins', amount: 2_400_000 },
            { chance: 9,    type: 'coins', amount: 3_000_000 },
            { chance: 1.5,  type: 'vip', days: 7 },
            { chance: 2,    type: 'seed', pool: ['crystalFruit'] },
            { chance: 1.5,  type: 'coins', amount: 20_000_000 },
        ],
    },
}
const LOOTBOX_ORDER = ['common', 'silver', 'gold', 'legendary']

// Доля максимальной стоимости растения при компенсации за отсутствие слотов
const SEED_FALLBACK_MULT = 0.66

// ===== НАПОМИНАЛКА =====
const REMINDER = {
    CHECK_INTERVAL_SEC: 900,
    REPEAT_MIN_MIN: 60,
    REPEAT_MAX_MIN: 120,
    QUIET_START: 22,
    QUIET_END: 9,
    TZ_OFFSET_HOURS: 3,
    MAX_PER_BATCH: 3,
}

// ===== СТРИКИ =====
const STREAK_REWARDS = [200, 300, 500, 700, 1000, 1500, 3000]
const STREAK_TZ_OFFSET_HOURS = 3



// ===== ИВЕНТЫ =====
const MARKET_CRISIS = {
    active: true, 
    multiplier: 1.10, // +10% к доходу
    endTimestamp: new Date('2026-12-01T00:00:00+03:00').getTime(),
    name: '📈 Рыночный ажиотаж',
    desc: 'Цены взлетели! +10% к прибыли.'
}
// ===== ЭКСПОРТ =====
module.exports = {    
    BOT_TOKEN, DB_PATH, ADMIN_ID, TIME_UNITS, NUMBER_UNITS,
    START_COINS, START_SLOTS,
    SLOT_BASE_PRICE, SLOT_PRICE_MULT, SLOT_PRICE_FIRST, SLOT_MAX_COUNT, SLOT_TOTAL_MAX,
    CROPS, CROP_ORDER,
    MUTATIONS, MUTATION_ROLL_ORDER, MUTATION_RANK,
    VIP_BONUS_MULT, EVENTS,
    TITLES, LAB_UPGRADES, LOOTBOX, SEED_FALLBACK_MULT, LOOTBOX_ORDER,
    REMINDER, STREAK_REWARDS, STREAK_TZ_OFFSET_HOURS,
    MARKET_CRISIS
}