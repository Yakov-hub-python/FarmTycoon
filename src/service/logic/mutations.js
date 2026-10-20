const { CROPS, MUTATIONS, MUTATION_ROLL_ORDER } = require('../config')


// ===== МУТАЦИИ =====

/**
 * Рандомный выбор мутации по шансам.
 * @returns {'common'|'silver'|'gold'}
 */
function rollMutation() {
    const random = Math.random()
    let total = 0
    for (const key of MUTATION_ROLL_ORDER) {
        total += MUTATIONS[key].chance
        if (random < total) return key
    }
    return MUTATION_ROLL_ORDER[MUTATION_ROLL_ORDER.length - 1]
}

/**
 * Награда за культуру с учётом мутации.
 * @param {string} cropKey
 * @param {string} mutation
 * @returns {number}
 * @throws {Error} Если cropKey или mutation неизвестны
 */
function rewardForMutation(cropKey, mutation) {
    if (!CROPS[cropKey]) throw new Error(`Неизвестное cropKey: ${cropKey}`)
    if (!MUTATIONS[mutation]) throw new Error(`Неизвестное mutation: ${mutation}`)
    return Math.round(CROPS[cropKey].sell * MUTATIONS[mutation].mult)
}

module.exports = {
    rewardForMutation, rollMutation
}