const { CROPS } = require('../config')
const time = require('./time')
const mutations = require('./mutations')
const events = require('./events')
const vip = require('./vip')
// ===== ПОСАДКА =====

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

    // 👈 Проверяем и списываем МОНЕТЫ, а не инвентарь
    const seedPrice = CROPS[cropKey].seed
    if (user.coin < seedPrice) {
        return { ok: false, error: 'not_enough_coins' }
    }

    // Запоминаем погоду В МОМЕНТ ПОСАДКИ
    const weather = events.getCurrentEvent()

    user.coin -= seedPrice // 👈 Списываем деньги
    user.slots[target] = { 
        crop: cropKey, 
        plantedAt: time.now(),
        weatherGrowth: weather.growthMult,
        weatherSell: weather.sellMult
    }
    return { ok: true, slot: target, crop: cropKey }
}

// ===== СЛУЧАЙНЫЙ ВЕС =====
function rollWeight(cropKey){
    const crop = CROPS[cropKey]
    return +(Math.random() * (crop.maxWeightKG - crop.minWeightKG) + crop.minWeightKG).toFixed(2);
}

// ===== СБОР =====

function harvestSlot(user, index) {
    if (index < 0 || index >= user.slots.length) {
        return { ok: false, error: 'bad_slot' }
    }

    const slot = user.slots[index]
    if (slot === null) return { ok: false, error: 'empty' }

    const left = time.timeLeft(slot)
    if (left > 0) return { ok: false, error: 'not_ready', left }

    const weight = rollWeight(slot.crop)
    const mutation = mutations.rollMutation()
    
    // Берем множитель цены из слота
    const sellMult = slot.weatherSell || 1.0 
    
    // Передаем множитель в функцию подсчета
    let reward = mutations.rewardForMutation(slot.crop, mutation, weight, sellMult)

    // VIP-бонус (+20%)
    reward = vip.applyVipBonus(reward, user)

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
        item: { crop: slot.crop, mutation, reward, weight },
    }
}

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