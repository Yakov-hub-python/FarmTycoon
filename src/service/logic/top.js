
/**
 * Сортирует массив юзеров по количеству монет и возвращает топ N.
 * @param {Array<Object>} users Объект юзеров
 * @param {number} limit Количество пользователей для возврата. Стандарт 10
 * @returns {Array<Object>} Отсортированный массив юзеров по количеству монет
 */
function getTopCoins(users, limit = 10) {
    return users
        .slice()
        .sort((a, b) => b.coin - a.coin)
        .slice(0, limit)
}

/**
 * Сортирует массив юзеров по лучшему урожаю и возвращает топ N.
 * @param {Array<Object>} users Объект юзеров
 * @param {number} limit Количество пользователей для возврата. Стандарт 10
 * @returns {Array<Object>} Отсортированный массив юзеров по лучшему урожаю
 */
function getTopHarvest(users, limit = 10) {
    return users
        .filter(user => user.stats && user.stats.bestHarvest > 0)
        .sort((a, b) => b.stats.bestHarvest - a.stats.bestHarvest)
        .slice(0, limit)
}

module.exports = {
    getTopCoins,
    getTopHarvest
}