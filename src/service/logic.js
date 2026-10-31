const expansion = require('./logic/expansion')
const plant = require('./logic/plant')
const mutations = require('./logic/mutations')
const time = require('./logic/time')
const format = require('./logic/formatting')
const top = require('./logic/top')
const daily = require('./logic/daily')

// ===== ЭКСПОРТ =====
module.exports = {
    expansion,
    plant,
    mutations,
    time,
    format, 
    top,
    daily
}