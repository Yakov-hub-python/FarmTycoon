const time = require('./time')

/**
 * Проверяет, прошло ли 24 часа с момента последнего получения ежедневной награды.
 *
 * @param {Object} user - Данные игрока.
 * @param {number} user.last_collection - Unix-время (сек) последнего сбора.
 * @returns {{canCollect: boolean, remaining: number}} `canCollect` — можно ли забрать награду, `remaining` — сколько секунд осталось до следующей.
 *
 * @example
 * checkLastCollection({ last_collection: now - 90000 })
 * // → { canCollect: true, remaining: 0 }
 */
function checkLastCollection(user){
    const now = time.now()
    const difference = Math.max(0, now - user.last_collection)
    const day = 24 * 60 * 60
    return {
        canCollect: difference >= day, 
        remaining: Math.max(0, day - difference) 
    }
}

/**
 * Рассчитывает размер ежедневной награды.
 *
 * Если у игрока меньше 10 000 монет — фиксированные 1 000 монет.
 * Иначе — 10% от текущего баланса (округление вниз).
 *
 * @param {Object} user - Данные игрока.
 * @param {number} user.coin - Текущий баланс монет.
 * @returns {number} Количество монет для награды.
 *
 * @example
 * numberOfAwards({ coin: 5000 })   // 1000
 * numberOfAwards({ coin: 10000 })  // 1000
 * numberOfAwards({ coin: 250000 }) // 25000
 */
function numberOfAwards(user){
    if(user.coin < 10000){
        const reward = 1000
        return reward
    } else {
        const reward = Math.floor(user.coin / 10) // 10% от баланса
        return reward
    }
}

module.exports = {
    checkLastCollection,
    numberOfAwards
}