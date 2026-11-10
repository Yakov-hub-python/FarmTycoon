const config = require('../config')
const vip = require('./vip')
const plant = require('./plant')
const time = require('./time')

/**
 * Проверяет, можно ли купить предмет.
 * Возвращает { ok: true } или { ok: false, error: 'текст ошибки' }.
 */
function canBuy(user, itemKey) {
    if (user.leaves < config.EVENT_PRICES[itemKey]) {
        return { ok: false, error: '❌ Не хватает осенних листьев!' }
    }
    
    if (itemKey === 'strawHat' && user.strawHat) {
        return { ok: false, error: '❌ У вас уже есть эта шляпа!' }
    }
    
    if (itemKey === 'title' && user.ownedTitles.includes('autumn_magnate')) {
        return { ok: false, error: '❌ У вас уже есть этот титул!' }
    }
    
    if (itemKey === 'mushroom') {
        const freeSlots = user.slots.filter(s => s === null).length
        if (freeSlots === 0) {
            return { ok: false, error: '❌ Нет свободных слотов! Освободите место на ферме.' }
        }
    }
    
    return { ok: true }
}

/**
 * Применяет покупку (списывает листья и выдает награду).
 * Вызывать только если canBuy вернул { ok: true }.
 * Возвращает { ok: true, text: 'сообщение об успехе' }.
 */
function applyPurchase(user, itemKey) {
    user.leaves -= config.EVENT_PRICES[itemKey]
    
    if (itemKey === 'strawHat') {
        user.strawHat = true
        return { ok: true, text: '👒 Вы купили Соломенную шляпу! Рост ускорен на 2%.' }
    } 
    
    if (itemKey === 'title') {
        user.ownedTitles.push('autumn_magnate')
        user.activeTitle = 'autumn_magnate'
        return { ok: true, text: '👑 Вы получили титул "Осенний Магнат"!' }
    } 
    
    if (itemKey === 'lootbox') {
        const random = Math.random()
        if (random < 0.01) { // 1%
            vip.addVipDays(user, 10, 'event_lootbox')
            if (!user.ownedTitles.includes('lucky')) {
                user.ownedTitles.push('lucky')
            }
            return { ok: true, text: '🎰 ДЖЕКПОТ! 10 дней VIP + Титул "Счастливчик"!' }
        } else if (random < 0.10) { // 9%
            user.leaves += 150
            return { ok: true, text: '🍂 Вы нашли 150 листьев!' }
        } else if (random < 0.40) { // 30%
            vip.addVipDays(user, 1, 'event_lootbox')
            return { ok: true, text: '💎 VIP на 1 день!' }
        } else { // 60%
            user.coin += 50000
            return { ok: true, text: '💰 50.000 монет!' }
        }
    } 
    
    if (itemKey === 'mushroom') {
        plant.plant(user, 'mushroom')
        return { ok: true, text: '🍄 Гриб посажен на вашу ферму!' }
    }
    
    return { ok: true, text: '✅ Покупка успешна!' }
}

function isEventActive(){
    return time.now() < config.EVENT_END_TIMESTAMP
}


module.exports = { canBuy, applyPurchase, isEventActive}