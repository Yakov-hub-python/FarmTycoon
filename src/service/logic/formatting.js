// ===== ИМПОРТ =====
const { TIME_UNITS, NUMBER_UNITS } = require('../config')
const time = require('./time')
// ===== ФОРМАТИРОВАНИЕ =====
/**
 * Форматирует число с разделителем тысяч (точка как разделитель).
 *
 * @param {number|string} n - Исходное число или строка, приводимая к числу.
 * @returns {string} Строка вида '1.000' или '5.000.000'.
 *
 * @example
 * formatNumber(1000)      // '1.000'
 * formatNumber('2500000') // '2.500.000'
 */
function formatNumber(n) {
    return Number(n).toLocaleString('de-DE')
}

/**
 * Сокращает число до короткой записи с суффиксом (тыс / млн / млрд / трлн).
 *
 * Округляет до `maxFractionDigits` знаков после точки, хвостовые нули убирает.
 * Работает с отрицательными числами и промоутит единицу при переполнении
 * (например, 999_999 → '1млн', а не '1000тыс').
 *
 * @param {number} n - Исходное число.
 * @param {number} [maxFractionDigits=1] - Максимум знаков после точки.
 * @returns {string} Короткая строка ('5млн', '1.5тыс') или '0' для невалидных значений.
 *
 * @example
 * formatShortNumber(999)         // '999'
 * formatShortNumber(1_500)       // '1.5тыс'
 * formatShortNumber(5_000_000)   // '5млн'
 * formatShortNumber(-5_000_000)  // '-5млн'
 * formatShortNumber(NaN)         // '0'
 */
function formatShortNumber(n, maxFractionDigits = 1){
    if(!Number.isFinite(n)) return '0'
    if(Number.isNaN(n)) return '0'
    const sign = n < 0 ? '-' : '';
    const abs = Math.abs(n);
    
    if (abs < 1000) return `${sign}${Math.round(abs)}`;

    for (let i = 0; i < NUMBER_UNITS.length; i++) {
        const { label, value } = NUMBER_UNITS[i];
        if (abs < value) continue;
        let scaled = Number((abs / value).toFixed(maxFractionDigits));
        if (scaled >= 1000 && i > 0) {
        const bigger = NUMBER_UNITS[i - 1];
        scaled = Number((abs / bigger.value).toFixed(maxFractionDigits));
        return `${sign}${scaled}${bigger.label}`;
        }
    
        return `${sign}${scaled}${label}`;
    }
}

/**
 * Форматирует секунды в длинную человекочитаемую строку с точками в сокращениях.
 *
 * Показывает до двух старших единиц, нулевые компоненты опускает:
 * '15 сек.' | '1 мин. 30 сек.' | '1 ч. 10 мин.' | '2 дн. 5 ч.'
 *
 * @param {number} seconds - Количество секунд (может быть дробным — обрезается вниз).
 * @returns {string} Читаемая строка времени.
 *
 * @example
 * formatTime(15)     // '15 сек.'
 * formatTime(90)     // '1 мин. 30 сек.'
 * formatTime(4200)   // '1 ч. 10 мин.'
 * formatTime(183600) // '2 дн. 3 ч.'
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

    if (total < 86400) {
        const hours = Math.floor(total / 3600)
        const remainingMinutes = Math.floor((total % 3600) / 60)
        const parts = []
        if (hours > 0) parts.push(`${hours} ч.`)
        if (remainingMinutes > 0) parts.push(`${remainingMinutes} мин.`)
        return parts.join(' ')
    }

    const days = Math.floor(total / 86400)
    const remainingHours = Math.floor((total % 86400) / 3600)
    const parts = []
    if (days > 0) parts.push(`${days} дн.`)
    if (remainingHours > 0) parts.push(`${remainingHours} ч.`)
    return parts.join(' ')
}

/**
 * Форматирует секунды в короткую строку времени без точек (максимум две единицы).
 *
 * Берёт старшую подходящую единицу и следующую за ней (даже если она равна нулю):
 * '1ч 52м', '1д 3ч', '45м', '5с'. Отрицательные и невалидные значения → '0с'.
 *
 * @param {number} seconds - Количество секунд.
 * @returns {string} Короткая строка времени.
 *
 * @example
 * formatShortTime(0)              // '0с'
 * formatShortTime(45 * 60)        // '45м'
 * formatShortTime((60 + 52) * 60) // '1ч 52м'
 * formatShortTime((24 + 3) * 3600)// '1д 3ч'
 * formatShortTime(-5)             // '0с'
 */
function formatShortTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
    let rest = Math.floor(seconds);

    const startIdx = TIME_UNITS.findIndex((u) => rest >= u.sec);
    if (startIdx === -1) return '0с';

    const parts = [];
    for (let i = startIdx; i < TIME_UNITS.length && parts.length < 2; i++) {
        const value = Math.floor(rest / TIME_UNITS[i].sec);
        rest -= value * TIME_UNITS[i].sec;
        parts.push(`${value}${TIME_UNITS[i].label}`);
    }
    return parts.join(' ');
}

/**
 * Форматирует Unix-timestamp (в секундах) в дату вида 'YYYY.MM.DD'.
 *
 * @param {number} timestamp - Unix-timestamp в секундах.
 * @returns {string} Строка даты '2026.11.15'.
 *
 * @example
 * formatDate(1735689600) // '2025.01.01'
 */
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}.${month}.${day}`
}

module.exports = {
    formatNumber, formatShortNumber, formatTime, formatShortTime, formatDate
}