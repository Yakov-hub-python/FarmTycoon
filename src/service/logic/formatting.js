// ===== ФОРМАТИРОВАНИЕ =====

/**
 * Форматирует число с разделителем тысяч.
 * @param {number|string} n - Исходное число
 * @returns {string} Строка вида '1.000'
 */
function formatNumber(n) {
    return Number(n).toLocaleString('de-DE')
}

/**
 * Форматирует секунды в человекочитаемую строку.
 * @param {number} seconds
 * @returns {string} '15 сек.' | '1 мин. 30 сек.' | '1 ч. 10 мин.'
 */
function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number(seconds) || 0))

    if (total < 60) {
        return `${total} сек.`
    }

    const minutes = Math.floor(total / 60)
    const secs = total % 60

    if (total < 3600) {
        const parts = []
        if (minutes > 0) parts.push(`${minutes} мин.`)
        if (secs > 0) parts.push(`${secs} сек.`)
        return parts.join(' ')
    }

    const hours = Math.floor(total / 3600)
    const remainingMinutes = Math.floor((total % 3600) / 60)
    const parts = []
    if (hours > 0) parts.push(`${hours} ч.`)
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} мин.`)
    return parts.join(' ')
}

module.exports = {
    formatNumber, formatTime
}