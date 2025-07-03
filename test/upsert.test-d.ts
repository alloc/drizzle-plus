import 'drizzle-plus/sqlite/upsert'
import { db } from './config/client'

describe('upsert', () => {
  test('return type', async () => {
    const result1 = await db.query.user.upsert({
      data: { id: 1 },
    })

    expectTypeOf<typeof result1>().toEqualTypeOf<{
      id: number
      name: string | null
      age: number | null
      handle: string | null
    }>()

    const result2 = await db.query.user.upsert({
      data: { id: 2 },
      returning: { id: true },
    })

    expectTypeOf<typeof result2>().toEqualTypeOf<{
      id: number
    }>()

    const result3 = await db.query.user.upsert({
      data: { id: 3 },
      returning: {},
    })

    expectTypeOf<typeof result3>().toEqualTypeOf<undefined>()
  })
})
