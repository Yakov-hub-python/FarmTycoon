require('dotenv').config()

const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) throw new Error('BOT_TOKEN не задан в .env')
const DB_PATH = process.env.DB_PATH || 'database.json'
const ADMIN_ID = String(process.env.ADMIN_ID || '')

// ===== СТАРТ =====
const START_COINS = 1000
const START_SLOTS = 8

// ===== РАСШИРЕНИЕ =====
const SLOT_BASE_PRICE  = 5000
const SLOT_PRICE_MULT  = 3
const SLOT_PRICE_FIRST = 9
const SLOT_MAX_COUNT = 16

// ===== КУЛЬТУРЫ =====
const CROPS = {
    'wheat': {
        name: 'Пшеница', emoji: '🌾', growTime: 15, seed: 100,
        minWeightKG: 1.0, maxWeightKG: 3.0, pricePerKG: 60
    },
    'cucumber': {
        name: 'Огурец', emoji: '🥒', growTime: 30, seed: 250,
        minWeightKG: 1.5, maxWeightKG: 3.5, pricePerKG: 120
    },
    'carrot': {
        name: 'Морковь', emoji: '🥕', growTime: 90, seed: 500,
        minWeightKG: 2.0, maxWeightKG: 5.0, pricePerKG: 170
    },
    'strawberry': {
        name: 'Клубника', emoji: '🍓', growTime: 300, seed: 1500,
        minWeightKG: 0.5, maxWeightKG: 2.5, pricePerKG: 1200
    },
    'pumpkin': {
        name: 'Тыква', emoji: '🎃', growTime: 450, seed: 3000,
        minWeightKG: 5.0, maxWeightKG: 15.0, pricePerKG: 360
    },
    'tomato': {
        name: 'Помидор', emoji: '🍅', growTime: 900, seed: 8000,
        minWeightKG: 2.0, maxWeightKG: 6.0, pricePerKG: 2400
    },
    'watermelon': {
        name: 'Арбуз', emoji: '🍉', growTime: 1800, seed: 20000,
        minWeightKG: 10.0, maxWeightKG: 25.0, pricePerKG: 1370
    },
    'grape': {
        name: 'Виноград', emoji: '🍇', growTime: 7200, seed: 100000,
        minWeightKG: 5.0, maxWeightKG: 15.0, pricePerKG: 12000
    },
    'pineapple': {
        name: 'Ананас', emoji: '🍍', growTime: 14400, seed: 500000,
        minWeightKG: 10.0, maxWeightKG: 30.0, pricePerKG: 30000
    },
    'pepper': {
        name: 'Перец', emoji: '🌶', growTime: 360, seed: 2000,
        minWeightKG: 0.5, maxWeightKG: 1.5, pricePerKG: 1600
    },
    'corn': {
        name: 'Кукуруза', emoji: '🌽', growTime: 1200, seed: 12000,
        minWeightKG: 3.0, maxWeightKG: 8.0, pricePerKG: 2500
    },
    'peach': {
        name: 'Персик', emoji: '🍑', growTime: 3600, seed: 40000,
        minWeightKG: 0.2, maxWeightKG: 0.8, pricePerKG: 100000
    },
    'mushroom': {
        name: 'Гриб', emoji: '🍄', growTime: 3600, seed: 0,
        minWeightKG: 1.0, maxWeightKG: 3.0, pricePerKG: 50000
    }
}

const CROP_ORDER = [
    'wheat', 'cucumber', 'carrot', 'strawberry', 'pepper', 
    'pumpkin', 'tomato', 'corn', 'watermelon', 'peach', 'grape', 'pineapple'
]

// ===== МУТАЦИИ =====
const MUTATIONS = {
    'common': { name: 'Обычная', emoji: '', chance: 0.85, mult: 1.0 },
    'silver': { name: 'Серебряная', emoji: '✨', chance: 0.12, mult: 2.0 },
    'gold': { name: 'Золотая', emoji: '🌟', chance: 0.03, mult: 6.0 }
}

const MUTATION_ROLL_ORDER = ['gold', 'silver', 'common']
const MUTATION_RANK = { common: 0, silver: 1, gold: 2 }

// ===== ТИТУЛЫ =====
const TITLES = {
    'autumn_magnate': { name: '🍂 Осенний Магнат', emoji: '🍂' },
    'lucky': { name: '🎰 Счастливчик', emoji: '🎰' }
}

// ===== ОСЕННИЙ ЭВЕНТ =====
const EVENT_PRICES = {
    mushroom: 50,
    strawHat: 500,
    title: 200,
    lootbox: 100
}

// ===== ЭКСПОРТ =====
module.exports = {    
    BOT_TOKEN, DB_PATH, ADMIN_ID,
    START_COINS, START_SLOTS,
    SLOT_BASE_PRICE, SLOT_PRICE_MULT, SLOT_PRICE_FIRST, SLOT_MAX_COUNT,
    CROPS, CROP_ORDER,
    MUTATIONS, MUTATION_ROLL_ORDER, MUTATION_RANK,
    TITLES, EVENT_PRICES
}