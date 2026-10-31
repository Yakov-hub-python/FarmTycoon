const time = require('./time')

/**
 * Проверка: прошло ли 24 часа от получения награды
 * @param {Object} user Данные игрока
 * @returns {{canCollect: boolean, remaining: number}} Можно ли выдавать и сколько осталось
 */
function checkLastCollection(user){
    const now = time.now()
    const difference = Math.max(0, now - user.last_collection)
    const day = 24 * 60 * 60
    return {
        canCollect: difference > day, 
        remaining: Math.max(0, day - difference) 
    }
}

/**
 * Кол-во монет для награды, если у игрока кол-во монет 10000>, тогда выдается 1000 монет, иначе 10% от кол-ва монет
 * @param {*} user Данные игрока
 * @returns {number} Кол-во монет для награды
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