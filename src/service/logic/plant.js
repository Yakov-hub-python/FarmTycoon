const { CROPS } = require('../config')
const time = require('./time')
const mutations = require('./mutations')

// ===== ПОСАДКА =====

/**
 * Покупка и посадка растения в первый свободный слот.
 * @param {Object} user
 * @param {string} cropKey
 * @returns {{ok: boolean, error?: string, slot?: number, crop?: string}}
 */
function plant(user, cropKey) {
    if (!CROPS[cropKey]) return { ok: false, error: 'unknown_crop' }

    const index = user.slots.indexOf(null)
    if (index === -1) return { ok: false, error: 'no_free_slots' }

    const seed = CROPS[cropKey].seed
    if (user.coin < seed) return { ok: false, error: 'not_enough_coins' }

    user.coin -= seed
    user.slots[index] = { crop: cropKey, plantedAt: time.now() }
    return { ok: true, slot: index, crop: cropKey }
}

// ===== СБОР =====

/**
 * Сбор урожая с одного слота.
 * @param {Object} user
 * @param {number} index
 * @returns {{ok: boolean, error?: string, left?: number, item?: {crop: string, mutation: string, reward: number}}}
 */
function harvestSlot(user, index) {
    if (index < 0 || index >= user.slots.length) {
        return { ok: false, error: 'bad_slot' }
    }

    const slot = user.slots[index]
    if (slot === null) return { ok: false, error: 'empty' }

    const left = time.timeLeft(slot)
    if (left > 0) return { ok: false, error: 'not_ready', left }

    const mutation = mutations.rollMutation()
    const reward = mutations.rewardForMutation(slot.crop, mutation)
    if(!user.stats) user.stats = { bestHarvest: 0, bestCrop: null, bestMutation: null }
    if (reward > user.stats.bestHarvest || 0) {
        user.stats.bestHarvest = reward
        user.stats.bestCrop = slot.crop
        user.stats.bestMutation = mutation
    }
    user.coin += reward
    user.slots[index] = null

    return {
        ok: true,
        item: { crop: slot.crop, mutation, reward },
    }
}

/**
 * Сбор со всех готовых слотов.
 * @param {Object} user
 * @returns {Array<{crop: string, mutation: string, reward: number}>}
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