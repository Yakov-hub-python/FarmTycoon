const texts = require('../../utils/texts')
const kb = require('../../utils/keyboards')

async function helpHandler(ctx) {
    await ctx.reply(texts.HELP, {
        parse_mode: 'HTML',
        ...kb.backKb(),
    })
}

module.exports = {
    helpHandler
}