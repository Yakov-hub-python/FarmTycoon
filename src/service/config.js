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
        name: 'Пшеница', emoji: '🌾', growTime: 15, seed: 100, minWeightKG: 5, maxWeightKG: 15, pricePerKG: 12
    },
    'carrot': { 
        name: 'Морковь', emoji: '🥕', growTime: 90, seed: 500, minWeightKG: 25, maxWeightKG: 75, pricePerKG: 12
    },
    'pumpkin': { 
        name: 'Тыква', emoji: '🎃', growTime: 450, seed: 3000, minWeightKG: 30, maxWeightKG: 90, pricePerKG: 60
    },
    'watermelon': { 
        name: 'Арбуз', emoji: '🍉', growTime: 1800, seed: 20000, minWeightKG: 1500, maxWeightKG: 4500, pricePerKG: 8
    }
}


const CROP_ORDER = ['wheat', 'carrot', 'pumpkin', 'watermelon']

// ===== МУТАЦИИ =====
const MUTATIONS = {
    'common': { name: 'Обычная',    emoji: '',   chance: 0.85, mult: 1.0 },
    'silver': { name: 'Серебряная', emoji: '✨', chance: 0.12, mult: 2.0 },
    'gold': { name: 'Золотая',    emoji: '🌟', chance: 0.03, mult: 6.0 }
}

const MUTATION_ROLL_ORDER = ['gold', 'silver', 'common']
const MUTATION_RANK = { common: 0, silver: 1, gold: 2 }

// ===== ЭКСПОРТ =====
module.exports = {    
    BOT_TOKEN, DB_PATH, ADMIN_ID,
    START_COINS, START_SLOTS,
    SLOT_BASE_PRICE, SLOT_PRICE_MULT, SLOT_PRICE_FIRST, SLOT_MAX_COUNT,
    CROPS, CROP_ORDER,
    MUTATIONS, MUTATION_ROLL_ORDER, MUTATION_RANK,
}