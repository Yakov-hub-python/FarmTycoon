// ============================================================
// ТЕСТЫ ДЛЯ src/service/db.js
// Запуск: node testsDb.js
//
// Использует ОТДЕЛЬНЫЙ файл test_database.json,
// реальный database.json не трогается.
// ============================================================

// ВАЖНО: устанавливаем env ДО require db,
// иначе config.js подхватит дефолтный путь
process.env.DB_PATH = 'test_database.json'

const fs = require('fs/promises')
const db = require('../src/service/db')
const { START_COINS, START_SLOTS } = require('../src/service/config')

const TEST_DB      = 'test_database.json'
const TEST_DB_TMP  = 'test_database.json.tmp'
const TEST_DB_CORP = 'test_database.json.corrupt'

// ===== МИНИ-ФРЕЙМВОРК =====
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
        console.log(`  ❌ ${name} — получил: ${JSON.stringify(value)}`)
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

// ===== УТИЛИТЫ =====
async function cleanTestFiles() {
    for (const f of [TEST_DB, TEST_DB_TMP, TEST_DB_CORP]) {
        try { await fs.unlink(f) } catch (_) { /* нет файла — ок */ }
    }
}

async function readRawDb() {
    const raw = await fs.readFile(TEST_DB, 'utf-8')
    return JSON.parse(raw)
}

async function fileExists(p) {
    try { await fs.access(p); return true } catch (_) { return false }
}

// ============================================================
// ТЕСТЫ
// ============================================================
async function main() {

    // ---------- 1. getUser: создание нового ----------
    section('1. getUser — создание нового юзера')
    await cleanTestFiles()

    let u = await db.getUser('123')

    eq(u.id, '123',                     'id — строка')
    eq(u.username, 'unknown',           'username = unknown')
    eq(u.firstName, 'Игрок',            'firstName = Игрок')
    eq(u.coin, START_COINS,             `coin = ${START_COINS}`)
    eq(u.slots.length, START_SLOTS,     `slots.length = ${START_SLOTS}`)
    ok(Array.isArray(u.slots),          'slots — массив')
    ok(u.slots.every(s => s === null),  'все слоты null')
    ok(Number.isInteger(u.createdAt),   'createdAt — целое число')
    ok(await fileExists(TEST_DB),       'файл базы создан')

    // ---------- 2. getUser: повторный заход ----------
    section('2. getUser — повторный заход не пересоздаёт')
    let u2 = await db.getUser('123')
    eq(u2.id, '123',                    'id тот же')
    eq(u2.coin, START_COINS,            'coin не сброшен')
    eq(u2.createdAt, u.createdAt,       'createdAt не переписан')

    // ---------- 3. getUser: приведение id к строке ----------
    section('3. getUser — id всегда строка')
    let uNum = await db.getUser(123)      // число, не строка
    eq(uNum.id, '123',                  'id приведён к строке')
    eq(uNum.coin, START_COINS,          'coin того же юзера')

    const dbAfter = await readRawDb()
    const keys = Object.keys(dbAfter.users)
    eq(keys.length, 1,                  'в базе только один юзер (не два)')
    eq(keys[0], '123',                  'ключ — строка "123"')

    // ---------- 4. saveUser: сохранение изменений ----------
    section('4. saveUser — сохранение изменений')
    u2.coin = 500
    u2.slots[0] = { crop: 'wheat', plantedAt: 1000 }
    await db.saveUser('123', u2)

    let u3 = await db.getUser('123')
    eq(u3.coin, 500,                    'coin = 500 после save')
    eq(u3.slots[0].crop, 'wheat',       'слот 0 сохранился')
    eq(u3.slots[0].plantedAt, 1000,     'plantedAt сохранился')

    // ---------- 5. Несколько юзеров не затирают друг друга ----------
    section('5. Несколько юзеров')
    await cleanTestFiles()

    const a = await db.getUser('111')
    const b = await db.getUser('222')
    a.coin = 1111
    b.coin = 2222
    await db.saveUser('111', a)
    await db.saveUser('222', b)

    const a2 = await db.getUser('111')
    const b2 = await db.getUser('222')
    eq(a2.coin, 1111,                   'юзер 111 сохранил coin')
    eq(b2.coin, 2222,                   'юзер 222 сохранил coin')

    const db2 = await readRawDb()
    eq(Object.keys(db2.users).length, 2, 'в базе два юзера')

    // ---------- 6. normalizeUser: прямой вызов ----------
    section('6. normalizeUser — прямой вызов')

    const empty = {}
    const changed = db.normalizeUser(empty, '999')
    eq(changed, true,                   'normalizeUser({}) → true')
    eq(empty.id, '999',                 'id заполнен')
    eq(empty.username, 'unknown',       'username заполнен')
    eq(empty.firstName, 'Игрок',        'firstName заполнен')
    eq(empty.coin, START_COINS,         'coin заполнен')
    eq(empty.slots.length, START_SLOTS, 'slots заполнены')

    const valid = {
        id: '555',
        username: 'vlad',
        firstName: 'Влад',
        createdAt: 1234567890,
        coin: 999,
        slots: Array(START_SLOTS).fill(null),
    }
    eq(db.normalizeUser(valid, '555'), false, 'normalizeUser(валидный) → false')

    // ---------- 7. normalizeUser: чинит coin ----------
    section('7. normalizeUser — чинит coin')

    for (const badCoin of [-5, 100.5, 'abc', true, null, undefined, NaN]) {
        const user = { coin: badCoin }
        db.normalizeUser(user, '1')
        eq(user.coin, START_COINS, `coin "${badCoin}" → ${START_COINS}`)
    }

    // ---------- 8. normalizeUser: чинит slots ----------
    section('8. normalizeUser — чинит slots')

    // Не массив
    let bad = { slots: 'нет' }
    db.normalizeUser(bad, '1')
    ok(Array.isArray(bad.slots),        'slots не массив → создан')
    eq(bad.slots.length, START_SLOTS,   'slots нужной длины')

    // Меньше чем нужно
    bad = { slots: [null, null] }
    db.normalizeUser(bad, '1')
    eq(bad.slots.length, START_SLOTS,   'slots дотянут до START_SLOTS')

    // Больше чем нужно — не обрезается
    bad = { slots: Array(20).fill(null) }
    db.normalizeUser(bad, '1')
    eq(bad.slots.length, 20,            'slots длиннее — не обрезаны')

    // Битый слот: не объект
    bad = { slots: ['строка', 42, true, ...Array(START_SLOTS - 3).fill(null)] }
    db.normalizeUser(bad, '1')
    eq(bad.slots[0], null,              'слот "строка" → null')
    eq(bad.slots[1], null,              'слот 42 → null')
    eq(bad.slots[2], null,              'слот true → null')

    // Битый слот: нет полей
    bad = { slots: [{}, { crop: 'wheat' }, { plantedAt: 100 }, ...Array(START_SLOTS - 3).fill(null)] }
    db.normalizeUser(bad, '1')
    eq(bad.slots[0], null,              'слот {} → null')
    eq(bad.slots[1], null,              'слот без plantedAt → null')
    eq(bad.slots[2], null,              'слот без crop → null')

    // Битый слот: неизвестная культура
    bad = { slots: [{ crop: 'banana', plantedAt: 100 }, ...Array(START_SLOTS - 1).fill(null)] }
    db.normalizeUser(bad, '1')
    eq(bad.slots[0], null,              'слот с banana → null')

    // Битый слот: plantedAt не число
    bad = { slots: [{ crop: 'wheat', plantedAt: 'abc' }, ...Array(START_SLOTS - 1).fill(null)] }
    db.normalizeUser(bad, '1')
    eq(bad.slots[0], null,              'слот с plantedAt="abc" → null')

    // Валидный слот — не трогает
    bad = { slots: [{ crop: 'wheat', plantedAt: 1000 }, ...Array(START_SLOTS - 1).fill(null)] }
    const changedSlot = db.normalizeUser(bad, '1')
    eq(bad.slots[0].crop, 'wheat',      'валидный слот сохранён')
    eq(changedSlot, false,              'normalizeUser с валидным слотом → false')

    // ---------- 9. Битый JSON ----------
    section('9. Битый JSON → .corrupt')
    await cleanTestFiles()
    await fs.writeFile(TEST_DB, 'это не JSON {{{{', 'utf-8')

    let uCorrupt = await db.getUser('777')
    eq(uCorrupt.id, '777',              'создан новый юзер')
    eq(uCorrupt.coin, START_COINS,      'coin стартовый')

    const corruptExists = await fileExists(TEST_DB_CORP)
    ok(corruptExists,                    'битый файл переложен в .corrupt')

    if (corruptExists) {
        const corruptContent = await fs.readFile(TEST_DB_CORP, 'utf-8')
        ok(corruptContent.startsWith('это не JSON'), '.corrupt содержит оригинал')
    }

    // ---------- 10. Пустой файл ----------
    section('10. Пустой файл')
    await cleanTestFiles()
    await fs.writeFile(TEST_DB, '   \n  \n', 'utf-8')

    let uEmpty = await db.getUser('888')
    eq(uEmpty.id, '888',                'создан юзер')
    eq(uEmpty.coin, START_COINS,        'coin стартовый')

    // ---------- 11. Нет файла — не создаёт ошибок ----------
    section('11. Файл отсутствует')
    await cleanTestFiles()

    let uNew = await db.getUser('999')
    eq(uNew.id, '999',                  'getUser при отсутствии файла — ок')
    ok(await fileExists(TEST_DB),       'файл создан после getUser')

    // ---------- 12. Нет .tmp после saveUser ----------
    section('12. Атомарная запись: .tmp не остаётся')

    await db.getUser('100')
    const tmpExists = await fileExists(TEST_DB_TMP)
    ok(!tmpExists,                      '.tmp удалён после записи (rename)')

    // ---------- 13. Проверка содержимого файла ----------
    section('13. Данные реально в файле')
    await cleanTestFiles()

    const x = await db.getUser('321')
    x.coin = 4321
    await db.saveUser('321', x)

    const raw = await readRawDb()
    ok(raw.users['321'] !== undefined, 'юзер 321 в файле')
    eq(raw.users['321'].coin, 4321,    'coin = 4321 в файле')
    eq(raw.users['321'].id, '321',     'id — строка в файле')

    // ---------- УБОРКА ----------
    await cleanTestFiles()

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
}

main().catch(err => {
    console.error('💥 Необработанная ошибка в тестах:', err)
    process.exit(1)
})