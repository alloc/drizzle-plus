import 'drizzle-plus/sqlite/findManyAndCount'
import { db } from './config/client'
import { foo } from './config/schema'

describe('findManyAndCount', () => {
  beforeAll(async () => {
    await db
      .insert(foo)
      .values([
        { id: 1, name: 'Alice', age: 25 },
        { id: 2, name: 'Bob', age: 30 },
        { id: 3, name: 'Charlie', age: 35 },
        { id: 4, name: 'Diana', age: 28 },
        { id: 5, name: 'Eve', age: 22 },
      ])
      .onConflictDoNothing()
  })

  test('SQL output', () => {
    const query = db.query.foo.findManyAndCount()

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "count": {
          "params": [],
          "sql": "select count(*) AS "count" from "foo"",
        },
        "findMany": {
          "params": [],
          "sql": "select "d0"."id" as "id", "d0"."name" as "name", "d0"."age" as "age", "d0"."handle" as "handle" from "foo" as "d0"",
        },
      }
    `)

    const query2 = db.query.foo.findManyAndCount({
      where: {
        id: { gt: 100 },
      },
    })

    expect(query2.toSQL()).toMatchInlineSnapshot(`
      {
        "count": {
          "params": [
            100,
          ],
          "sql": "select count(*) AS "count" from "foo" where "foo"."id" > ?",
          "typings": [
            "none",
          ],
        },
        "findMany": {
          "params": [
            100,
          ],
          "sql": "select "d0"."id" as "id", "d0"."name" as "name", "d0"."age" as "age", "d0"."handle" as "handle" from "foo" as "d0" where "d0"."id" > ?",
          "typings": [
            "none",
          ],
        },
      }
    `)
  })

  test('returns data and count without filters', async () => {
    const result = await db.query.foo.findManyAndCount()

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('count')
    // We don't know the exact count, but data should match the schema
    for (const rec of result.data) {
      expect(rec).toHaveProperty('id')
      expect(rec).toHaveProperty('name')
      expect(rec).toHaveProperty('age')
      expect(rec).toHaveProperty('handle')
    }
    expect(typeof result.count).toBe('number')
    expect(result.count).toBeGreaterThanOrEqual(result.data.length)
  })

  test('returns data and count with filters', async () => {
    const result = await db.query.foo.findManyAndCount({
      where: {
        age: { gte: 30 },
      },
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('count')
    for (const rec of result.data) {
      expect(rec).toHaveProperty('id')
      expect(rec).toHaveProperty('name')
      expect(rec).toHaveProperty('age')
      expect(rec).toHaveProperty('handle')
      expect(rec.age).toBeGreaterThanOrEqual(30)
    }
    expect(typeof result.count).toBe('number')
    expect(result.count).toBeGreaterThanOrEqual(result.data.length)
  })

  test('returns data and count with limit', async () => {
    const result = await db.query.foo.findManyAndCount({
      limit: 3,
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('count')
    expect(result.data.length).toBeLessThanOrEqual(3)
    for (const rec of result.data) {
      expect(rec).toHaveProperty('id')
      expect(rec).toHaveProperty('name')
      expect(rec).toHaveProperty('age')
      expect(rec).toHaveProperty('handle')
    }
    expect(typeof result.count).toBe('number')
    expect(result.count).toBeGreaterThanOrEqual(result.data.length)
  })

  test('returns data and count with filters and limit', async () => {
    const result = await db.query.foo.findManyAndCount({
      where: {
        age: { lte: 30 },
      },
      limit: 2,
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('count')
    expect(result.data.length).toBeLessThanOrEqual(2)
    for (const rec of result.data) {
      expect(rec).toHaveProperty('id')
      expect(rec).toHaveProperty('name')
      expect(rec).toHaveProperty('age')
      expect(rec).toHaveProperty('handle')
      expect(rec.age).toBeLessThanOrEqual(30)
    }
    expect(typeof result.count).toBe('number')
    expect(result.count).toBeGreaterThanOrEqual(result.data.length)
  })

  test('returns empty data but correct count when no results match', async () => {
    const result = await db.query.foo.findManyAndCount({
      where: {
        age: { gt: 100 },
      },
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('count')
    expect(result.count).toBe(0)
    expect(result.data).toHaveLength(0)
    expect(result.data).toEqual([])
  })
})
