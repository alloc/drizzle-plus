import { eq, sql } from 'drizzle-orm'
import { mergeFindManyArgs, mergeRelationsFilter } from 'drizzle-plus'
import 'drizzle-plus/sqlite/orThrow'
import { db } from './config/client'
import { user } from './config/schema'

beforeAll(async () => {
  await db
    .insert(user)
    .values({ id: 301, name: 'Ada', age: 36, handle: 'ada-301' })
})

describe('orThrow', () => {
  test('throws for empty rows and supports a custom message', async () => {
    await expect(
      db.query.user.findFirst({ where: { id: 999 } }).orThrow()
    ).rejects.toMatchObject({ message: 'No rows returned' })

    await expect(
      db.query.user.findFirst({ where: { id: 999 } }).orThrow('Missing user')
    ).rejects.toMatchObject({ message: 'Missing user' })

    await expect(
      db.query.user.findMany({ where: { id: 999 } }).orThrow()
    ).rejects.toMatchObject({ message: 'No rows returned' })
  })

  test('returns existing rows and non-empty arrays', async () => {
    await expect(
      db.query.user.findFirst({ where: { id: 301 } }).orThrow()
    ).resolves.toMatchObject({ id: 301, name: 'Ada' })

    await expect(
      db.query.user.findMany({ where: { id: 301 } }).orThrow()
    ).resolves.toHaveLength(1)

    await expect(
      db.select({ id: user.id }).from(user).where(eq(user.id, 301)).orThrow()
    ).resolves.toEqual([{ id: 301 }])
  })
})

describe('mergeRelationsFilter', () => {
  test('merges ordinary fields and preserves both OR expressions', () => {
    expect(
      mergeRelationsFilter({ id: 1, name: 'left' }, { id: 2, age: { gt: 18 } })
    ).toEqual({ id: 2, name: 'left', age: { gt: 18 } })

    const left = { OR: [{ id: 1 }] }
    const right = { OR: [{ id: 2 }] }
    expect(mergeRelationsFilter(left, right)).toEqual({
      OR: undefined,
      AND: [{ OR: left.OR }, { OR: right.OR }],
    })
  })

  test('combines RAW and NOT operators', () => {
    const leftRaw = sql`left = true`
    const rightRaw = sql`right = true`
    expect(
      mergeRelationsFilter({ RAW: leftRaw }, { RAW: rightRaw })
    ).toMatchObject({
      RAW: undefined,
      AND: [{ RAW: leftRaw }, { RAW: rightRaw }],
    })

    expect(
      mergeRelationsFilter(
        { NOT: { id: 1, OR: [{ age: { gt: 10 } }] } },
        { NOT: { id: 2 } }
      )
    ).toEqual({
      NOT: { id: 2, OR: [{ age: { gt: 10 } }] },
    })
  })
})

describe('mergeFindManyArgs', () => {
  test('merges selections and lets the right config own scalar options', () => {
    expect(
      mergeFindManyArgs(
        {
          columns: { id: true },
          extras: { label: sql<string>`'left'` },
          with: { emails: true },
          where: { age: { gt: 18 } },
          limit: 10,
        },
        {
          columns: { name: true },
          extras: { status: sql<string>`'right'` },
          with: { profile: true },
          where: { id: 1 },
          limit: 2,
        }
      )
    ).toEqual({
      columns: { id: true, name: true },
      extras: {
        label: expect.anything(),
        status: expect.anything(),
      },
      with: { emails: true, profile: true },
      where: { age: { gt: 18 }, id: 1 },
      limit: 2,
      offset: undefined,
      orderBy: undefined,
    })
  })
})
