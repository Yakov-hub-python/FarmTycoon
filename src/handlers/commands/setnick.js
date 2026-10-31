const db = require('../../service/db')
const { escapeHtml } = require('../../utils/texts')

async function setNick(ctx) {
    const raw = ctx.payload ?? '';
    const nickname = raw.trim().replace(/\s+/g, ' ');

    if (!nickname) {
        return ctx.reply('Использование: /setnick Новый Ник');
    }
    if (nickname.length < 2 || nickname.length > 32) {
        return ctx.reply('Ник должен быть от 2 до 32 символов');
    }
    if (nickname.split(' ').length > 3) {
        return ctx.reply('Не больше 3 слов в нике');
    }
    if (['uncknown', 'unknown'].includes(nickname)) {
        return ctx.reply('Этот ник зарезервирован');
    }

    const user = await db.getUser(ctx.from.id);
    if (!user) {
        return ctx.reply('Пользователь не найден');
    }

    user.nickname = nickname;
    await db.saveUser(ctx.from.id, user);

    // проверяем, что db.normalizeUser не сбросил ник
    const saved = await db.getUser(ctx.from.id);
    if (saved.nickname !== nickname) {
        return ctx.reply('Ник не сохранился, попробуйте другой');
    }

    return ctx.reply(`Ник изменён: ${escapeHtml(nickname)}`, { parse_mode: 'HTML' });
}


module.exports = { setNick }