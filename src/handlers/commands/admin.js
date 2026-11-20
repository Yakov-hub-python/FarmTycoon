const { giveCoinsHandler, giveallHandler } = require('./admin/giveAdmin')
const { sayHandler } = require('./admin/say')
const { resetStatsHandler } = require('./admin/reset')
const { newPromoHandler } = require('./admin/promo')
const { statsHandler } = require('./admin/stats')
const { deleteUserHandler } = require('./admin/deleteUser')
const { restoreHandler } = require('./admin/restore')
const { backupHandler } = require('./admin/backup')

module.exports = { 
    restoreHandler, 
    backupHandler,
    giveCoinsHandler, 
    giveallHandler,
    sayHandler, 
    resetStatsHandler,
    newPromoHandler,
    statsHandler,
    deleteUserHandler,
}