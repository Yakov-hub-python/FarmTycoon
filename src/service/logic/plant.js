const { CROPS, MARKET_CRISIS } = require('../config')
const time = require('./time')
const mutations = require('./mutations')
const events = require('./events')
const vip = require('./vip')
const event = require('./event')
// ===== ПОСАДКА =====

/**
 * Сажает семя в указанный слот (или в первый свободный).
 * Списывает деньги за семя и фиксирует текущую погоду.
 * 
 * @param {Object} user - Данные игрока (мутируется).
 * @param {string} cropKey - Ключ культуры из CROPS.
 * @param {number|null} [index=null] - Индекс слота. Если null, ищет первый свободный.
 * @returns {{ok: true, slot: number, crop: string} | {ok: false, error: string}}
 */
function plant(user, cropKey, index = null) {
    if (!CROPS[cropKey]) return { ok: false, error: 'unknown_crop' }

    let target;
    if (index === null) {
        target = user.slots.indexOf(null)
        if (target === -1) return { ok: false, error: 'no_free_slots' }
    } else {
        if (index < 0 || index >= user.slots.length) return { ok: false, error: 'bad_slot' }
        if (user.slots[index] !== null) return { ok: false, error: 'slot_occupied' }
        target = index
    }

    const seedPrice = CROPS[cropKey].seed
    if (user.coin < seedPrice) {
        return { ok: false, error: 'not_enough_coins' }
    }

    const weather = events.getCurrentEvent()

    user.coin -= seedPrice
    user.slots[target] = { 
        crop: cropKey, 
        plantedAt: time.now(),
        weatherGrowth: weather.growthMult,
        weatherSell: weather.sellMult
    }
    return { ok: true, slot: target, crop: cropKey }
}

// ===== СЛУЧАЙНЫЙ ВЕС =====
/**
 * Роллит случайный вес урожая для указанной культуры в пределах min/max.
 * 
 * @param {string} cropKey - Ключ культуры.
 * @returns {number} Вес в кг (округлен до 2 знаков).
 */
function rollWeight(cropKey){
    const crop = CROPS[cropKey]
    return +(Math.random() * (crop.maxWeightKG - crop.minWeightKG) + crop.minWeightKG).toFixed(2);
}

// ===== СБОР =====
/**
 * Собирает урожай из указанного слота.
 * Рассчитывает вес, мутацию, погоду, VIP-бонус. 
 * Особые растения из кейсов (fromCase) не получают мутации и погоду.
 * 
 * @param {Object} user - Данные игрока (мутируется: монеты, статы, слот).
 * @param {number} index - Индекс слота.
 * @returns {{ok: true, item: Object} | {ok: false, error: string, left?: number}}
 */
function harvestSlot(user, index) {
    if (index < 0 || index >= user.slots.length) {
        return { ok: false, error: 'bad_slot' }
    }

    const slot = user.slots[index]
    if (slot === null) return { ok: false, error: 'empty' }
    const crop = CROPS[slot.crop]
    if (!crop) return { ok: false, error: 'unknown_crop' }
    
    const left = time.timeLeft(slot, user)
    if (left > 0) return { ok: false, error: 'not_ready', left }

    const weight = rollWeight(slot.crop) * (1 + user.upgrades.selection * 0.05)

    const mutation = mutations.rollMutation(user)
    const sellMult = slot.weatherSell || 1.0 

    // Передаем множитель в функцию подсчета
    let reward
    if(crop.fromCase){
        reward = mutations.rewardForMutation(slot.crop, 'common', weight, 1.0)
    } else {
        reward = mutations.rewardForMutation(slot.crop, mutation, weight, sellMult)
    }
    
    // VIP-бонус (+20%)
    reward = vip.applyVipBonus(reward, user)

    // Рыночный ажиотаж (+10%)
    if (event.isMarketCrisisActive()) {
        reward = Math.floor(reward * MARKET_CRISIS.multiplier)
    }

    // Обновляем статистику
    if(!user.stats) {
        user.stats = { bestHarvest: 0, bestCrop: null, bestMutation: null, bestWeight: 0 }
    }
    if (reward > (user.stats.bestHarvest || 0)) {
        user.stats.bestHarvest = reward
        user.stats.bestCrop = slot.crop
        user.stats.bestWeight = weight
        user.stats.bestMutation = mutation
    }
    
    user.coin += reward
    user.slots[index] = null

    return {
        ok: true,
        item: { crop: slot.crop, mutation, reward, weight},
    }
}

/**
 * Собирает урожай со всех готовых слотов.
 * 
 * @param {Object} user - Данные игрока (мутируется).
 * @returns {Array<Object>} Массив собранных предметов.
 */
function harvestAll(user) {
    const items = []
    for (let i = 0; i < user.slots.length; i++) {
        const res = harvestSlot(user, i)
        if (res.ok) items.push(res.item)
    }
    return items
}

module.exports = {
    plant, harvestSlot, harvestAll
}