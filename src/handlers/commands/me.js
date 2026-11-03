const db = require('../../service/db')
const logic = require('../../service/logic')
const { CROPS, MUTATIONS } = require('../../service/config') // 👈 Добавили для инфы об урожае
const kb = require('../../utils/keyboards')
const { safeEdit } = require('../../utils/safeEdit')

async function meHandler(ctx) {
    // Обязательно await, чтобы не было бага со сбросом
    const user = await db.getUser(ctx.from.id, ctx.from);
    
    const isVip = logic.vip.isVipActive(user);

    // Форматируем лучший урожай
    let bestHarvestStr = 'Пока нет рекордов';
    if (user.stats && user.stats.bestHarvest > 0) {
        const crop = CROPS[user.stats.bestCrop];
        const mut = MUTATIONS[user.stats.bestMutation];
        const weight = user.stats.bestWeight ? `${user.stats.bestWeight.toFixed(1)} кг` : '';
        
        if (crop && mut) {
            const mutText = mut.emoji ? `${mut.emoji} ` : '';
            bestHarvestStr = `${logic.format.formatNumber(user.stats.bestHarvest)} (${mutText}${crop.emoji} ${weight})`;
        } else {
            bestHarvestStr = `${logic.format.formatNumber(user.stats.bestHarvest)} монет`;
        }
    }

    const text = `👤 <b>ПРОФИЛЬ ИГРОКА</b>\n\n` +
        `🏷 Ник: <b>${user.nickname ?? 'Игрок'}</b> ${isVip ? '💎' : ''}\n` +
        `📛 Юзернейм: @${user.username || 'нет'}\n` +
        `🆔 ID: <code>${user.id}</code>\n` +
        `Статус: ${isVip ? '👑 <b>VIP активен</b>' : '❌ <b>VIP не активен</b>'}\n\n` +
        `💰 Баланс: <b>${logic.format.formatNumber(user.coin)}</b> монет\n` +
        `🏆 Рекорд урожая: ${bestHarvestStr}`;

    // Если это ответ на кнопку (callback), убираем спиннер и редактируем сообщение
    if (ctx.callbackQuery) {
        await ctx.answerCbQuery();
        await safeEdit(ctx, text, {
            parse_mode: 'HTML',
            ...kb.backKb() // Кнопка "⬅️ В меню"
        });
    } else {
        // Если это команда /me, просто отправляем новое сообщение
        await ctx.reply(text, {
            parse_mode: 'HTML',
            ...kb.backKb()
        });
    }
}

module.exports = { meHandler };