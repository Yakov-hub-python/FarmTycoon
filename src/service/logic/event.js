const config = require('../config')
const time = require('./time')

/**
 * Проверяет, активен ли сейчас рыночный ажиотаж.
 * @returns {boolean}
 */
function isMarketCrisisActive() {
    if (!config.MARKET_CRISIS.active) return false;
    return time.now() * 1000 < config.MARKET_CRISIS.endTimestamp;
}

module.exports = {isMarketCrisisActive}