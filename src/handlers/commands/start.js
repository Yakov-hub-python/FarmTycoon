const db = require('../../service/db')
const logic = require('../../service/logic')
const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')

async function startHandler(ctx) {
    let user = await db.getUser(ctx.from.id, ctx.from) 
    
    const text = ctx.message.text;

    if (text.includes('ref_')) {
        // Получаем именно КОД (например, 'X8B2M1')
        const refCode = text.split('ref_')[1].split(' ')[0]
        
        // Проверяем, не свой ли это код
        if (refCode === user.refCode) {
            console.log(`[REF] Отклонено: self-referral`)
        } else {
            // Ищем пригласившего по коду!
            const inviter = await db.getUserByRefCode(refCode)
            
            if (inviter) {
                const res = logic.ref.processReferral(user, inviter, 5000, 1500)
                
                if (res.ok) {
                    await db.saveUser(inviter.id, inviter) // Сохраняем по ID!
                    await db.saveUser(ctx.from.id, user)  
                    
                    ctx.telegram.sendMessage(
                        inviter.id, 
                        `🎉 По вашей ссылке зашел новый игрок!\nВам начислено <b>${logic.format.formatNumber(res.inviterReward)}</b> монет.`,
                        { parse_mode: 'HTML' }
                    ).catch(() => {})
                    
                    console.log(`[REF] Успех! ${inviter.id} пригласил ${ctx.from.id}`)
                }
            } else {
                console.log(`[REF] Ошибка: Код ${refCode} не найден`)
            }
        }
    }
    
    await ctx.reply(texts.WELCOME, { parse_mode: 'HTML', ...kb.mainMenuKb() })
}

module.exports = { startHandler }