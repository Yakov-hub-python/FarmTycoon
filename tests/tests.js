// ============================================================
// ТЕСТЫ ДЛЯ src/js
// Запуск: node test.js
// ============================================================

const { formatNumber, formatTime,
    now, readyAt, timeLeft, isReady,
    rollMutation, rewardForMutation,
    plant, harvestSlot, harvestAll,
    nextSlotNumber, nextSlotPrice, expand} = require('../src/service/logic')
const { CROPS, MUTATIONS } = require('../src/service/config')

// ===== МИНИ-ФРЕЙМВОРК ДЛЯ ТЕСТОВ =====
let passed = 0
let failed = 0
const failures = []

function eq(actual, expected, name) {
    const a = JSON.stringify(actual)
    const e = JSON.stringify(expected)
    if (a === e) {
        console.log(`  ✅ ${name}`)
        passed++
    } else {
        console.log(`  ❌ ${name}`)
        console.log(`     ожидал: ${e}`)
        console.log(`     получил: ${a}`)
        failed++
        failures.push(name)
    }
}

function ok(value, name) {
    if (value) {
        console.log(`  ✅ ${name}`)
        passed++
    } else {
        console.log(`  ❌ ${name} — получил: ${value}`)
        failed++
        failures.push(name)
    }
}

function section(title) {
    console.log('')
    console.log('━'.repeat(60))
    console.log(`  ${title}`)
    console.log('━'.repeat(60))
}

// ============================================================
// 1. ФОРМАТИРОВАНИЕ
// ============================================================
section('1. ФОРМАТИРОВАНИЕ — formatNumber')

eq(formatNumber(0),        '0',         'formatNumber(0)')
eq(formatNumber(100),      '100',       'formatNumber(100)')
eq(formatNumber(1000),     '1.000',     'formatNumber(1000)')
eq(formatNumber(5000),     '5.000',     'formatNumber(5000)')
eq(formatNumber(24000),    '24.000',    'formatNumber(24000)')
eq(formatNumber(144000),   '144.000',   'formatNumber(144000)')
eq(formatNumber(1000000),  '1.000.000', 'formatNumber(1.000.000)')

section('2. ФОРМАТИРОВАНИЕ — formatTime')

eq(formatTime(0),     '0 сек.',            'formatTime(0)')
eq(formatTime(15),    '15 сек.',           'formatTime(15)')
eq(formatTime(59),    '59 сек.',           'formatTime(59)')
eq(formatTime(60),    '1 мин.',            'formatTime(60)')
eq(formatTime(90),    '1 мин. 30 сек.',    'formatTime(90)')
eq(formatTime(120),   '2 мин.',            'formatTime(120)')
eq(formatTime(450),   '7 мин. 30 сек.',    'formatTime(450)')
eq(formatTime(3600),  '1 ч.',              'formatTime(3600)')
eq(formatTime(3660),  '1 ч. 1 мин.',       'formatTime(3660)')
eq(formatTime(7200),  '2 ч.',              'formatTime(7200)')
eq(formatTime(-5),    '0 сек.',            'formatTime(-5) — отрицательное')
eq(formatTime('90'),  '1 мин. 30 сек.',    'formatTime("90") — строка')

// ============================================================
// 2. ВРЕМЯ
// ============================================================
section('3. ВРЕМЯ — now()')

const t1 = now()
ok(typeof t1 === 'number', 'now() возвращает число')
ok(t1 > 1700000000,        'now() похоже на unix-секунды (> 1.7млрд)')
ok(t1 < 2000000000,        'now() меньше 2млрд (не миллисекунды)')

section('4. ВРЕМЯ — readyAt(slot)')

eq(readyAt(null), null, 'readyAt(null) → null')

const wheat0 = { crop: 'wheat', plantedAt: 0 }
eq(readyAt(wheat0), 15, 'readyAt(wheat, t=0) → 15')

const carrot100 = { crop: 'carrot', plantedAt: 100 }
eq(readyAt(carrot100), 190, 'readyAt(carrot, t=100) → 190')

const water1000 = { crop: 'watermelon', plantedAt: 1000 }
eq(readyAt(water1000), 2800, 'readyAt(watermelon, t=1000) → 2800')

const broken = { crop: 'banana', plantedAt: 0 }
eq(readyAt(broken), null, 'readyAt(битый crop) → null')

const missing = { plantedAt: 0 }
eq(readyAt(missing), null, 'readyAt(без crop) → null')

section('5. ВРЕМЯ — timeLeft(slot)')

eq(timeLeft(null), 0, 'timeLeft(null) → 0')

// Готовый слот (посажен давно)
const readyWheat = { crop: 'wheat', plantedAt: 0 }
eq(timeLeft(readyWheat), 0, 'timeLeft(готовый wheat) → 0')

// Только что посаженный
const justPlanted = { crop: 'wheat', plantedAt: now() }
const left1 = timeLeft(justPlanted)
ok(left1 >= 14 && left1 <= 15, `timeLeft(только что) ≈ 15 (получил ${left1})`)

// Арбуз 30 минут
const water = { crop: 'watermelon', plantedAt: now() }
const left2 = timeLeft(water)
ok(left2 >= 1799 && left2 <= 1800, `timeLeft(свежий арбуз) ≈ 1800 (получил ${left2})`)

// Посажен в будущем (аномалия)
const future = { crop: 'wheat', plantedAt: now() + 1000 }
eq(timeLeft(future), 0, 'timeLeft(посажен в будущем) → 0 (max защищает)')

// Битый crop
eq(timeLeft(broken), 0, 'timeLeft(битый crop) → 0')

section('6. ВРЕМЯ — isReady(slot)')

eq(isReady(null), false, 'isReady(null) → false')
eq(isReady(readyWheat), true, 'isReady(готовый) → true')
eq(isReady(justPlanted), false, 'isReady(только что) → false')
eq(isReady(broken), false, 'isReady(битый crop) → false')
eq(isReady({}), false, 'isReady({}) → false')

// ============================================================
// 3. МУТАЦИИ
// ============================================================
section('7. МУТАЦИИ — rollMutation()')

const rolls = {}
for (let i = 0; i < 10000; i++) {
    const m = rollMutation()
    rolls[m] = (rolls[m] || 0) + 1
}
console.log(`  Прогнали 10000 бросков:`)
console.log(`    common: ${rolls.common} (~8500 ожидалось)`)
console.log(`    silver: ${rolls.silver} (~1200 ожидалось)`)
console.log(`    gold:   ${rolls.gold} (~300 ожидалось)`)

ok(rolls.common > 8000 && rolls.common < 9000, 'common в диапазоне 80-90%')
ok(rolls.silver > 900 && rolls.silver < 1500,  'silver в диапазоне 9-15%')
ok(rolls.gold   > 150 && rolls.gold   < 500,   'gold в диапазоне 1.5-5%')

section('8. МУТАЦИИ — rewardForMutation(crop, mutation)')

eq(rewardForMutation('wheat', 'common'),      120,      'wheat × common = 120')
eq(rewardForMutation('wheat', 'silver'),      240,      'wheat × silver = 240')
eq(rewardForMutation('wheat', 'gold'),        720,      'wheat × gold = 720')
eq(rewardForMutation('carrot', 'common'),     600,      'carrot × common = 600')
eq(rewardForMutation('carrot', 'silver'),     1200,     'carrot × silver = 1200')
eq(rewardForMutation('carrot', 'gold'),       3600,     'carrot × gold = 3600')
eq(rewardForMutation('pumpkin', 'common'),    3600,     'pumpkin × common = 3600')
eq(rewardForMutation('pumpkin', 'gold'),      21600,    'pumpkin × gold = 21600')
eq(rewardForMutation('watermelon', 'common'), 24000,    'watermelon × common = 24000')
eq(rewardForMutation('watermelon', 'gold'),   144000,   'watermelon × gold = 144000')

// Должно кидать
let threw = false
try { rewardForMutation('banana', 'common') } catch (e) { threw = true }
ok(threw, 'rewardForMutation(битый crop) кидает ошибку')

threw = false
try { rewardForMutation('wheat', 'epic') } catch (e) { threw = true }
ok(threw, 'rewardForMutation(битая mutation) кидает ошибку')

// ============================================================
// 4. ПОСАДКА
// ============================================================
section('9. ПОСАДКА — plant(user, crop)')

// 9.1. Обычная посадка
let u = { coin: 1000, slots: [null, null, null, null] }
let res = plant(u, 'wheat')
eq(res, { ok: true, slot: 0, crop: 'wheat' }, 'plant wheat в пустой слот')
eq(u.coin, 900, 'coin списался: 1000 - 100 = 900')
ok(u.slots[0] !== null, 'слот 0 занят')
ok(typeof u.slots[0].plantedAt === 'number', 'plantedAt — число')
eq(u.slots[0].crop, 'wheat', 'crop записан верно')

// 9.2. Посадка во второй слот
res = plant(u, 'carrot')
eq(res, { ok: true, slot: 1, crop: 'carrot' }, 'plant carrot во второй слот')
eq(u.coin, 400, 'coin после второй посадки: 900 - 500 = 400')

// 9.3. Не хватает монет
res = plant(u, 'pumpkin')
eq(res, { ok: false, error: 'not_enough_coins' }, 'plant без монет → ошибка')
eq(u.coin, 400, 'coin не изменился при ошибке')

// 9.4. Неизвестная культура
res = plant(u, 'banana')
eq(res, { ok: false, error: 'unknown_crop' }, 'plant banana → unknown_crop')

// 9.5. Нет свободных слотов
u = { coin: 100000, slots: [null, null] }
plant(u, 'wheat')  // слот 0
plant(u, 'wheat')  // слот 1
res = plant(u, 'wheat')
eq(res, { ok: false, error: 'no_free_slots' }, 'plant при заполненных слотах → no_free_slots')

// 9.6. Проверки ДО мутации — user не меняется при ошибке
u = { coin: 50, slots: [null] }
const coinBefore = u.coin
const slotsBefore = JSON.stringify(u.slots)
plant(u, 'wheat')  // не хватает
eq(u.coin, coinBefore, 'coin НЕ изменился при ошибке')
eq(JSON.stringify(u.slots), slotsBefore, 'slots НЕ изменились при ошибке')

// ============================================================
// 5. СБОР
// ============================================================
section('10. СБОР — harvestSlot(user, index)')

// 10.1. Пустой слот
u = { coin: 0, slots: [null] }
res = harvestSlot(u, 0)
eq(res, { ok: false, error: 'empty' }, 'harvestSlot(пустой) → empty')

// 10.2. Плохой индекс
u = { coin: 0, slots: [null] }
res = harvestSlot(u, 5)
eq(res, { ok: false, error: 'bad_slot' }, 'harvestSlot(индекс 5) → bad_slot')
res = harvestSlot(u, -1)
eq(res, { ok: false, error: 'bad_slot' }, 'harvestSlot(индекс -1) → bad_slot')

// 10.3. Незрелый слот
u = { coin: 0, slots: [{ crop: 'wheat', plantedAt: now() }] }
res = harvestSlot(u, 0)
eq(res.ok, false, 'harvestSlot(незрелый) → not ok')
eq(res.error, 'not_ready', 'harvestSlot(незрелый) → not_ready')
ok(res.left >= 14 && res.left <= 15, `left ≈ 15 (получил ${res.left})`)
eq(u.slots[0] !== null, true, 'слот НЕ освободился')
eq(u.coin, 0, 'coin НЕ изменился')

// 10.4. Сбор готового
u = { coin: 0, slots: [{ crop: 'wheat', plantedAt: 0 }] }
res = harvestSlot(u, 0)
eq(res.ok, true, 'harvestSlot(готовый) → ok: true')
ok(res.item !== undefined, 'вернулся item')
ok(res.item.crop === 'wheat', 'item.crop = wheat')
ok(['common', 'silver', 'gold'].includes(res.item.mutation), 'item.mutation валидный')
ok([120, 240, 720].includes(res.item.reward), `item.reward из 120/240/720 (получил ${res.item.reward})`)
eq(u.slots[0], null, 'слот освободился')
ok(u.coin === res.item.reward, 'coin = reward')

// 10.5. Несколько сборов
u = { coin: 0, slots: [
    { crop: 'wheat', plantedAt: 0 },
    { crop: 'wheat', plantedAt: 0 },
    { crop: 'wheat', plantedAt: 0 },
] }
harvestSlot(u, 0)
harvestSlot(u, 1)
harvestSlot(u, 2)
eq(u.slots, [null, null, null], 'все слоты освобождены')
ok(u.coin >= 360 && u.coin <= 2160, `coin за 3 пшеницы (получил ${u.coin})`)

section('11. СБОР — harvestAll(user)')

// 11.1. Всё пусто
u = { coin: 0, slots: [null, null, null] }
let items = harvestAll(u)
eq(items, [], 'harvestAll на пустой ферме → []')

// 11.2. Смешанные слоты
u = { coin: 0, slots: [
    { crop: 'wheat', plantedAt: 0 },      // готов
    { crop: 'wheat', plantedAt: now() },  // растёт
    { crop: 'carrot', plantedAt: 0 },     // готов
    null,
] }
items = harvestAll(u)
eq(items.length, 2, 'harvestAll собрал 2 готовых')
eq(u.slots[0], null, 'слот 0 освобождён')
ok(u.slots[1] !== null, 'слот 1 (растущий) не тронут')
eq(u.slots[2], null, 'слот 2 освобождён')
eq(u.slots[3], null, 'слот 3 остался null')

// 11.3. harvestAll должен использовать harvestSlot, не дублировать
// Проверяем что после 10 сборов coin вырос ровно на сумму rewards
u = { coin: 0, slots: Array(10).fill(null).map(() => ({ crop: 'wheat', plantedAt: 0 })) }
items = harvestAll(u)
const totalReward = items.reduce((s, it) => s + it.reward, 0)
eq(u.coin, totalReward, 'coin = сумма rewards из items (значит harvestSlot используется)')

// ============================================================
// 6. РАСШИРЕНИЕ
// ============================================================
section('12. РАСШИРЕНИЕ — nextSlotNumber / nextSlotPrice')

u = { coin: 0, slots: Array(8).fill(null) }
eq(nextSlotNumber(u), 9, 'следующий слот после 8 → 9')
eq(nextSlotPrice(u), 5000, 'цена слота 9 → 5000')

u.slots.push(null)
eq(nextSlotNumber(u), 10, 'следующий слот после 9 → 10')
eq(nextSlotPrice(u), 15000, 'цена слота 10 → 15000')

u.slots.push(null)
eq(nextSlotPrice(u), 45000, 'цена слота 11 → 45000')

u.slots.push(null)
eq(nextSlotPrice(u), 135000, 'цена слота 12 → 135000')

u.slots.push(null)
eq(nextSlotPrice(u), 405000, 'цена слота 13 → 405000')

section('13. РАСШИРЕНИЕ — expand(user)')

// 13.1. Хватает монет
u = { coin: 10000, slots: Array(8).fill(null) }
res = expand(u)
eq(res, { ok: true, price: 5000, slotNumber: 9 }, 'expand с 10000 монет')
eq(u.coin, 5000, 'coin: 10000 - 5000 = 5000')
eq(u.slots.length, 9, 'slots.length = 9')

// 13.2. Не хватает
res = expand(u)
eq(res, { ok: false, error: 'not_enough_coins', price: 15000 }, 'expand без монет')
eq(u.coin, 5000, 'coin не изменился')
eq(u.slots.length, 9, 'slots не изменились')

// 13.3. Ровно хватает
u = { coin: 5000, slots: Array(8).fill(null) }
res = expand(u)
eq(res.ok, true, 'expand ровно на 5000 → ok')

// 13.4. Проверки ДО мутации
u = { coin: 100, slots: Array(8).fill(null) }
const before = u.slots.length
expand(u)
eq(u.slots.length, before, 'slots НЕ изменились при ошибке')
eq(u.coin, 100, 'coin НЕ изменился при ошибке')

const t = require('./src/texts')
console.log(t.WELCOME)
console.log(t.menuText({ coin: 1000, slots: Array(8).fill(null) }))
console.log(t.farmText({ coin: 500, slots: [{ crop: 'wheat', plantedAt: 0 }, ...Array(7).fill(null)] }))
console.log(t.harvestText([
    { crop: 'wheat', mutation: 'common', reward: 120 },
    { crop: 'wheat', mutation: 'common', reward: 120 },
    { crop: 'wheat', mutation: 'silver', reward: 240 },
], 1480))
// ============================================================
// ИТОГИ
// ============================================================
console.log('')
console.log('═'.repeat(60))
console.log(`  РЕЗУЛЬТАТ: ✅ ${passed} прошло   ❌ ${failed} упало`)
console.log('═'.repeat(60))

if (failed > 0) {
    console.log('')
    console.log('  Провалившиеся тесты:')
    failures.forEach(f => console.log(`    • ${f}`))
    console.log('')
    process.exit(1)
} else {
    console.log('')
    console.log('  🎉 Всё работает!')
    console.log('')
}