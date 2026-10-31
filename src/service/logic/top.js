/**
 * Сортирует массив юзеров по количеству монет и возвращает топ N.
 * @param {Array<Object>} users
 * @param {number} [limit=10]
 * @returns {Array<Object>}
 */
function getTopCoins(users, limit = 10) {
    return users
        .sort((a, b) => b.coin - a.coin)
        .slice(0, limit)
}

/**
 * Сортирует массив юзеров по лучшему урожаю и возвращает топ N.
 * @param {Array<Object>} users
 * @param {number} [limit=10]
 * @returns {Array<Object>}
 */
function getTopHarvest(users, limit = 10) {
    return users
        .filter(user => user.stats && user.stats.bestHarvest > 0)
        .sort((a, b) => b.stats.bestHarvest - a.stats.bestHarvest)
        .slice(0, limit)
}

module.exports = {
    getTopCoins,
    getTopHarvest,
}