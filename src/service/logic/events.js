const time = require('./time')

const EVENTS = [
    {
        name: 'Ясно',
        emoji: '☀️',
        growthMult: 1.0,
        sellMult: 1.0,
        desc: 'Обычный день на ферме.'
    },
    {
        name: 'Дождь',
        emoji: '🌧',
        growthMult: 0.7,
        sellMult: 1.0,
        desc: 'Рост ускорен на 30%!'
    },
    {
        name: 'Засуха',
        emoji: '🔥',
        growthMult: 1.2,
        sellMult: 1.6,
        desc: 'Рост замедлен, но продажа +60%!'
    }
]

function getCurrentEvent() {
    const TWO_HOURS = 2 * 60 * 60;
    const index = Math.floor(time.now() / TWO_HOURS) % EVENTS.length;
    return EVENTS[index];
}

module.exports = { getCurrentEvent }