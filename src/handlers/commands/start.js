const db = require('../../service/db')
const logic = require('../../service/logic')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')

async function handleReferral(ctx, user, text) {
    if (!text.includes('ref_')) return;

    const refCode = text.split('ref_')[1].split(' ')[0];
    if (refCode === user.refCode) {
        console.log(`[REF] Отклонено: self-referral`);
        return;
    }

    const inviter = await db.getUserByRefCode(refCode);
    if (!inviter) {
        console.log(`[REF] Ошибка: Код ${refCode} не найден`);
        return;
    }

    const res = logic.ref.processReferral(user, inviter, 5000, 1500);
    if (!res.ok) {
        console.log(`[REF] Ошибка: ${res.error}`);
        return;
    }

    // Если всё ок — сохраняем и уведомляем
    await db.saveUser(inviter.id, inviter);
    await db.saveUser(ctx.from.id, user);

    // Уведомление пригласившему
    if (inviter.referralCount % 3 === 0) {
        ctx.telegram.sendMessage(inviter.id, '🔥 Вы пригласили <b>3-х друзей</b> и получаете бонус — <b>7 дней VIP!</b>', 
            { parse_mode: 'HTML' }
        ).catch(() => {});
    } else {
        ctx.telegram.sendMessage(inviter.id, `🎉 По вашей ссылке зашел новый игрок!\n\
            Вам начислено <b>${logic.format.formatNumber(res.inviterReward)}</b> монет.`, 
            { parse_mode: 'HTML' }
        ).catch(() => {});
    }

    await ctx.reply(`🎉 Вы успешно зарегистрировались по реферальной ссылке!\n\
        Вам начислено <b>${logic.format.formatNumber(res.newUserReward)}</b> монет.`, 
        { parse_mode: 'HTML' }
    );
}

async function startHandler(ctx) {
    const user = await db.getUser(ctx.from.id, ctx.from);
    const text = ctx.message?.text || '';

    await handleReferral(ctx, user, text);

    await ctx.reply(texts.WELCOME, { 
        parse_mode: 'HTML', 
        ...kb.mainMenuKb() 
    });
}

module.exports = { startHandler }