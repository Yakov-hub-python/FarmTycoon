/**
 * Случайное целое в диапазоне [min, max] включительно.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 * @example randomInt(1, 5) // 1..5
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Случайное дробное число в диапазоне [min, max).
 * @param {number} min
 * @param {number} max
 * @param {number} [decimals=2] - Сколько знаков после запятой
 * @returns {number}
 * @example randomFloat(0.5, 2.5, 2) // 1.73
 */
function randomFloat(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

/**
 * Случайный элемент массива.
 * @template T
 * @param {T[]} arr
 * @returns {T|null} Элемент или null, если массив пуст/не массив
 * @example randomPick(['a', 'b', 'c']) // 'b'
 */
function randomPick(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    return arr[randomInt(0, arr.length - 1)];
}

/**
 * Взвешенный выбор из массива объектов с полем `chance`.
 * Сумма chance не обязана быть 100 — функция нормализует сама.
 * @template T
 * @param {Array<T & {chance: number}>} items
 * @returns {T|null} Выбранный объект или null, если массив пуст/невалиден
 * @example
 * weightedPick([
 *   { chance: 60, name: 'coins' },
 *   { chance: 40, name: 'vip' },
 * ]) // с шансом 60% → coins
 */
function weightedPick(items) {
    if (!Array.isArray(items) || items.length === 0) return null;

    const total = items.reduce((sum, item) => sum + (item.chance || 0), 0);
    if (total <= 0) return null;

    let roll = Math.random() * total;
    for (const item of items) {
        roll -= (item.chance || 0);
        if (roll < 0) return item;
    }
    return items[items.length - 1];
}

/**
 * Проверка вероятности: true с шансом `chance`.
 * @param {number} chance - Вероятность в процентах (0..100) или долях (0..1)
 * @param {'percent'|'fraction'} [mode='percent']
 * @returns {boolean}
 * @example chanceRoll(0.5) // 50% (percent)
 * @example chanceRoll(0.5, 'fraction') // 50% (0..1)
 */
function chanceRoll(chance, mode = 'percent') {
    if (!Number.isFinite(chance)) return false;
    const threshold = mode === 'fraction' ? chance : chance / 100;
    return Math.random() < threshold;
}

/**
 * Перемешивает массив (Fisher–Yates). Не мутирует исходный.
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 * @example shuffle([1, 2, 3]) // [3, 1, 2]
 */
function shuffle(arr) {
    if (!Array.isArray(arr)) return [];
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = randomInt(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

module.exports = {
    randomInt,
    randomFloat,
    randomPick,
    weightedPick,
    chanceRoll,
    shuffle,
};