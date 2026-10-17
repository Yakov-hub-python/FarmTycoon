const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')
const { safeEdit } = require('../../utils/safeEdit')

async function helpCallback(ctx) {
    await ctx.answerCbQuery()
    await safeEdit(ctx, texts.HELP, {
        parse_mode: 'HTML',
        ...kb.backKb(),
    })
}

module.exports = { 
    helpCallback 
}