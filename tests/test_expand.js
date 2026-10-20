// test_expand.js — запускается вручную: node test_expand.js
const db = require('../src/service/db')
const logic = require('../src/service/logic')
const { SLOT_MAX_COUNT } = require('../src/service/config')

async function main() {
    const user = await db.getUser('5685152704')
    user.coin = 999999999  // чтобы точно хватило на все слоты

    while (user.slots.length < SLOT_MAX_COUNT) {
        const res = logic.expansion.expand(user)
        console.log(`Слотов: ${user.slots.length}, expand:`, res)
        if (!res.ok) {
            console.log('Остановка:', res.error)
            break
        }
    }

    console.log(`Итого слотов: ${user.slots.length}, нужно было: ${SLOT_MAX_COUNT}`)
    await db.saveUser('5685152704', user)
}

main().catch(console.error)