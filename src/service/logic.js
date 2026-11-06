const expansion = require('./logic/expansion')
const plant = require('./logic/plant')
const mutations = require('./logic/mutations')
const time = require('./logic/time')
const format = require('./logic/formatting')
const top = require('./logic/top')
const daily = require('./logic/daily')
const vip = require('./logic/vip')
const ref = require('./logic/ref')
const events = require('./logic/events')
const promo = require('./logic/promo')
const event = require('./logic/event')

// ===== ЭКСПОРТ =====
module.exports = {
    expansion,
    plant,
    mutations,
    time,
    format, 
    top,
    daily,
    ref,
    vip,
    events,
    promo,
    event,
}