import 'drizzle-plus/mysql/findManyAndCount'
import 'drizzle-plus/mysql/orThrow'
import 'drizzle-plus/mysql/updateMany'
import 'drizzle-plus/pg/create'
import 'drizzle-plus/pg/findManyAndCount'
import 'drizzle-plus/pg/orThrow'
import 'drizzle-plus/pg/updateMany'
import 'drizzle-plus/pg/upsert'
import 'drizzle-plus/sqlite/$findMany'
import 'drizzle-plus/sqlite/findUnique'
import 'drizzle-plus/sqlite/orThrow'
import { db } from './config/client'
import {
  mysqlDb,
  mysqlUser,
  pgDb,
  pgUser,
  sqliteDb,
  sqliteUser,
} from './config/dialects'
import { orderItem, user } from './config/schema'

beforeAll(async () => {
  await db.insert(user).values([
    { id: 201, name: 'Ada', age: 36, handle: 'ada' },
    { id: 202, name: 'Grace', age: 28, handle: 'grace' },
  ])
  await db.insert(orderItem).values({
    orderId: 20,
    productId: 7,
    quantity: 2,
  })
})

describe('create', () => {
  test('builds single, many, and duplicate-skipping inserts', () => {
    const single = pgDb.query.user.create({
      data: { id: 1, name: 'Ada' },
      returning: { id: true },
    })
    expect(single.toSQL()).toMatchObject({
      params: [1, 'Ada'],
      sql: expect.stringContaining('returning "id"'),
    })

    const many = pgDb.query.user.create({
      data: [
        { id: 1, name: 'Ada' },
        { id: 2, name: 'Grace' },
      ],
      returning: { id: true },
    })
    expect(many.toSQL().sql).toContain(
      'values ($1, $2, default, default), ($3, $4, default, default) returning "id"'
    )

    const skipDuplicates = pgDb.query.user.create({
      data: { id: 1 },
      skipDuplicates: true,
    })
    expect(skipDuplicates.toSQL().sql).toContain('on conflict do nothing')
  })
})

describe('findUnique', () => {
  test('finds primary-key and composite-key rows and returns undefined for misses', async () => {
    await expect(
      db.query.user.findUnique({
        where: { id: 201 },
        columns: { id: true, name: true },
      })
    ).resolves.toEqual({ id: 201, name: 'Ada' })

    await expect(
      db.query.orderItem.findUnique({
        where: { orderId: 20, productId: 7 },
      })
    ).resolves.toEqual({ orderId: 20, productId: 7, quantity: 2 })

    await expect(
      db.query.user.findUnique({ where: { id: 999 } })
    ).resolves.toBeUndefined()
  })

  test('rejects filters that do not identify a unique constraint', () => {
    expect(() => db.query.user.findUnique({ where: { name: 'Ada' } })).toThrow(
      'No matching primary key or unique constraint found'
    )

    expect(() =>
      db.query.user.findUnique({
        where: { OR: [{ id: 201 }, { id: 202 }] } as any,
      })
    ).toThrow('No matching primary key or unique constraint found')
  })
})

describe('query composition', () => {
  test('$findMany returns and merges validated configs', () => {
    const base = sqliteDb.query.user.$findMany({
      where: { id: 1 },
      columns: { id: true },
    })
    expect(sqliteDb.query.user.$findMany(base)).toBe(base)

    const page = sqliteDb.query.user.$findMany(base, {
      columns: { name: true },
      limit: 20,
    })
    expect(page).toEqual({
      where: { id: 1 },
      columns: { id: true, name: true },
      limit: 20,
      extras: undefined,
      with: undefined,
    })
  })
})

describe('dialect query extensions', () => {
  test('registers orThrow on each dialect query prototype', () => {
    const relationalQueries = [
      pgDb.query.user.findFirst(),
      mysqlDb.query.user.findFirst(),
      sqliteDb.query.user.findFirst(),
    ]
    const selectQueries = [
      pgDb.select({ id: pgUser.id }).from(pgUser),
      mysqlDb.select({ id: mysqlUser.id }).from(mysqlUser),
      sqliteDb.select({ id: sqliteUser.id }).from(sqliteUser),
    ]

    for (const query of [...relationalQueries, ...selectQueries]) {
      expect(typeof query.orThrow).toBe('function')
    }
  })

  test('updateMany uses PostgreSQL limited-update selection', () => {
    const query = pgDb.query.user.updateMany({
      set: { name: 'Ada' },
      where: { id: { gt: 0 } },
      orderBy: { id: 'asc' },
      limit: 2,
      returning: { id: true },
    })

    const result = query.toSQL()
    expect(result.sql).toContain('with "matched_rows" as')
    expect(result.sql).toContain('for update')
    expect(result.sql).toContain('returning "user"."id"')
  })

  test('updateMany uses MySQL native order and limit', () => {
    const query = mysqlDb.query.user.updateMany({
      set: { name: 'Ada' },
      where: { id: 1 },
      orderBy: { id: 'asc' },
      limit: 2,
    })

    expect(query.toSQL()).toMatchObject({
      params: ['Ada', 1, 2],
      sql: expect.stringContaining('order by `user`.`id` asc limit ?'),
    })
  })

  test('findManyAndCount removes paging from the count query', () => {
    const query = pgDb.query.user.findManyAndCount({
      where: { id: { gt: 0 } },
      orderBy: { id: 'desc' },
      limit: 2,
      offset: 4,
    })

    const result = query.toSQL()
    expect(result.findMany.sql).toContain('limit $2')
    expect(result.findMany.sql).toContain('offset $3')
    expect(result.count.sql).not.toContain('limit')
    expect(result.count.sql).not.toContain('offset')
  })

  test('upsert supports an explicit PostgreSQL conflict target', () => {
    const query = pgDb.query.user.upsert({
      data: { id: 1, handle: 'ada' },
      target: ['handle'],
      update: ({ excluded }) => ({ handle: excluded.handle }),
      returning: { id: true },
    })

    expect(query.toSQL().sql).toContain('on conflict ("handle") do update')
  })
})
