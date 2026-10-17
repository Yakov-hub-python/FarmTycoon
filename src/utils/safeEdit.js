/**
 * editMessageText с глотанием "message is not modified".
 */
async function safeEdit(ctx, text, extra) {
    try {
        await ctx.editMessageText(text, extra)
    } catch (e) {
        if (!e.message || !e.message.includes('message is not modified')) {
            console.error('editMessageText:', e.message)
        }
    }
}

module.exports = { safeEdit }