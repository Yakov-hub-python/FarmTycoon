const logic = require('../../service/logic')
const db = require('../../service/db')
const { safeEdit } = require('../../utils/safeEdit')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const { CROPS } = require('../../service/config')

async function showShop(ctx, count = 1) {
    const user = await db.getUser(ctx.from.id, ctx.from)
    // Убрали ctx.answerCbQuery() отсюда!
    return await safeEdit(ctx, texts.shopText(user), {
        parse_mode: 'HTML',
        ...kb.shopKb(count)
    })
}

async function updateShop(ctx) {
    await ctx.answerCbQuery()
    const count = Number(ctx.match[1])
    return await showShop(ctx, count)
}

async function buyToShop(ctx) {
    const cropKey = ctx.match[1];
    const count = Number(ctx.match[2]);

    if (!Number.isInteger(count) || count <= 0) {
        return ctx.answerCbQuery('Некорректное количество', { show_alert: true });
    }

    const user = await db.getUser(ctx.from.id, ctx.from);

    // 1. Проверяем общую стоимость
    const totalCost = CROPS[cropKey].seed * count;
    if (user.coin < totalCost) {
        return ctx.answerCbQuery(`💰 Не хватает монет! Нужно ${logic.format.formatNumber(totalCost)}`, { show_alert: true });
    }

    // 2. Проверяем свободные слоты
    const freeSlots = user.slots.filter(s => s === null).length;
    if (freeSlots < count) {
        return ctx.answerCbQuery(`🌱 Не хватает слотов! Свободно: ${freeSlots}`, { show_alert: true });
    }

    // 3. Если всё ок — сажаем (теперь цикл не упадет на середине)
    for (let i = 0; i < count; i++) {
        logic.plant.plant(user, cropKey);
    }

    await db.saveUser(ctx.from.id, user);
    
    // Отвечаем на клик
    await ctx.answerCbQuery(`✅ Посажено ${count} шт. ${CROPS[cropKey].name}`);
    
    // Обновляем экран, сохраняя выбранный count
    await showShop(ctx, count);
}

module.exports = { showShop, updateShop, buyToShop };