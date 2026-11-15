const time = require('./time')
const config = require('../config')

/**
 * Возвращает текущее активное мировое событие (меняется каждые 2 часа).
 *
 * Индекс считается от `time.now()` и длины `config.EVENTS`, поэтому все игроки видят одно и то же событие одновременно.
 *
 * @returns {Object} Объект события из `config.EVENTS`.
 *
 * @example
 * getCurrentEvent() // → { id: 'drought', name: 'Засуха', ... }
 */
function getCurrentEvent() {
    const TWO_HOURS = 2 * 60 * 60;
    const index = Math.floor(time.now() / TWO_HOURS) % config.EVENTS.length;
    return config.EVENTS[index];
}

module.exports = { getCurrentEvent }