const time = require('./time')
const config = require('../config')


function getCurrentEvent() {
    const TWO_HOURS = 2 * 60 * 60;
    const index = Math.floor(time.now() / TWO_HOURS) % config.EVENTS.length;
    return config.EVENTS[index];
}

module.exports = { getCurrentEvent }