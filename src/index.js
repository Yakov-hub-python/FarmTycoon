require('dotenv').config()
const { Telegraf } = require('telegraf')
const { BOT_TOKEN } = require('./service/config')
const http = require('http');
const registerCommands  = require('./handlers/commands/commands')
const registerCallbacks = require('./handlers/callback/callback')

if (!BOT_TOKEN) throw new Error('BOT_TOKEN не задан в .env')

const bot = new Telegraf(BOT_TOKEN)

registerCommands(bot)
registerCallbacks(bot)


bot.catch((err, ctx) => {
    console.error(`Ошибка в ${ctx.updateType}:`, err)
    ctx.reply('❌ Что-то пошло не так, попробуй позже').catch(() => {})
})

// ===== HTTP СЕРВЕР =====
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Бот работает!');
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log('HTTP', `✅ Сервер на порту ${PORT}`);
});

bot.launch()
console.log('Бот запущен')

process.once('SIGINT',  () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))