const db = require('../../service/db')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const { safeEdit } = require('../../utils/safeEdit')

async function meCallback(ctx) {
    const user = await db.getUser(ctx.from.id, ctx.from);
    return safeEdit(ctx,
        texts.meText(user),
        { 
            parse_mode: 'HTML',
            ...kb.profileKb() // 👈 Добавили кнопку
        }
    );
}

module.exports = { meCallback }