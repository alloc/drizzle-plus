import { InferSelectModel } from 'drizzle-orm'
import 'drizzle-plus/sqlite/updateMany'
import { db } from './config/client'
import * as schema from './config/schema'

describe('updateMany', () => {
  test('return type', async () => {
    const numUpdated = await db.query.user.updateMany({
      set: { handle: '' },
    })

    expectTypeOf<typeof numUpdated>().toEqualTypeOf<number>()

    // Empty "returning" same as undefined.
    const numUpdated2 = await db.query.user.updateMany({
      set: { handle: '' },
      returning: {},
    })

    expectTypeOf<typeof numUpdated2>().toEqualTypeOf<number>()

    const results = await db.query.user.updateMany({
      set: { handle: '' },
      returning: { id: true },
    })

    expectTypeOf<typeof results>().toEqualTypeOf<{ id: number }[]>()

    // Return all columns.
    const results2 = await db.query.user.updateMany({
      set: { handle: '' },
      returning: user => user,
    })

    expectTypeOf<typeof results2>().toEqualTypeOf<
      InferSelectModel<typeof schema.user>[]
    >()
  })
})
