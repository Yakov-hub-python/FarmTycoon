const { CROPS, MUTATIONS, MUTATION_ROLL_ORDER } = require('../config')


// ===== МУТАЦИИ =====

/**
 * Рандомный выбор мутации по шансам.
 * @param {Object} user Пользователь
 * @returns {'common'|'silver'|'gold'}
 */
function rollMutation(user) {
    const genetics = user?.upgrades?.genetics ?? 0
    const goldBonus = genetics * 0.005
    const goldChance = Math.min(0.5, 0.03 + goldBonus)

    const chances = {
        gold: goldChance,
        silver: MUTATIONS.silver.chance,
        common: Math.max(0, 1 - goldChance - MUTATIONS.silver.chance),
    }

    const random = Math.random()
    let total = 0
    for (const key of MUTATION_ROLL_ORDER) {
        total += chances[key]
        if (random < total) return key
    }
    return MUTATION_ROLL_ORDER[MUTATION_ROLL_ORDER.length - 1]
}

/**
 * Награда за культуру с учётом мутации.
 * @param {number} cropKey Ключ культуры (например, 'wheat')
 * @param {string} mutation Тип мутации ('common', 'silver', 'gold')
 * @param {number} weight Вес в килограммах
 * @param {number} weatherSell Множитель цены из погоды (например, 1.0, 1.6)
 * @returns {number} Награда в монетах
 * @throws {Error} Если cropKey или mutation неизвестны
 */
function rewardForMutation(cropKey, mutation, weight, weatherSell) {
    if (!CROPS[cropKey]) throw new Error(`Unknown crop: ${cropKey}`)
    if (!MUTATIONS[mutation]) throw new Error(`Unknown mutation: ${mutation}`)
    const mult = MUTATIONS[mutation].mult
    const crop = CROPS[cropKey]
    return Math.round((crop.pricePerKG * weight) * mult * weatherSell)
}

module.exports = {
    rewardForMutation, rollMutation
}