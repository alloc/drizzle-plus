import { sql } from 'drizzle-orm'
import 'drizzle-plus/sqlite/findManyAndCount'
import { foo } from './schema'
import { db } from './setup'

describe('findManyAndCount', () => {
  // Setup test data
  beforeAll(async () => {
    // Create the table
    await db.run(`CREATE TABLE IF NOT EXISTS foo (
      id INTEGER PRIMARY KEY,
      name TEXT,
      age INTEGER
    )`)

    // Clear any existing data
    await db.delete(foo)

    // Insert test data
    await db.insert(foo).values([
      { id: 1, name: 'Alice', age: 25 },
      { id: 2, name: 'Bob', age: 30 },
      { id: 3, name: 'Charlie', age: 35 },
      { id: 4, name: 'Diana', age: 28 },
      { id: 5, name: 'Eve', age: 22 },
    ])
  })

  afterAll(async () => {
    // Clean up
    await db.run(`DROP TABLE IF EXISTS foo`)
  })

  test('debug: check database setup', async () => {
    // Test basic select
    const allRecords = await db.select().from(foo)
    console.log('All records:', allRecords)
    expect(allRecords).toHaveLength(5)

    // Test direct count query
    const countResult = await db.run(sql`select count(*) from ${foo}`)
    console.log('Count result:', countResult)

    // Test what the session.run returns for count
    const { session } = db as any
    const directCountResult = await session.run(
      sql`select count(*) from ${foo}`
    )
    console.log('Direct count result:', directCountResult)
  })

  test('SQL output', () => {
    const query = db.query.foo.findManyAndCount()

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "count": {
          "params": [],
          "sql": "select count(*) from "foo"",
        },
        "findMany": {
          "params": [],
          "sql": "select "d0"."id" as "id", "d0"."name" as "name", "d0"."age" as "age" from "foo" as "d0"",
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
          "sql": "select count(*) from "foo" where "foo"."id" > ?",
          "typings": [
            "none",
          ],
        },
        "findMany": {
          "params": [
            100,
          ],
          "sql": "select "d0"."id" as "id", "d0"."name" as "name", "d0"."age" as "age" from "foo" as "d0" where "d0"."id" > ?",
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
    expect(result.count).toBe(5)
    expect(result.data).toHaveLength(5)
    expect(result.data).toEqual([
      { id: 1, name: 'Alice', age: 25 },
      { id: 2, name: 'Bob', age: 30 },
      { id: 3, name: 'Charlie', age: 35 },
      { id: 4, name: 'Diana', age: 28 },
      { id: 5, name: 'Eve', age: 22 },
    ])
  })

  test('returns data and count with filters', async () => {
    const result = await db.query.foo.findManyAndCount({
      where: {
        age: { gte: 30 },
      },
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('count')
    expect(result.count).toBe(2) // Bob (30) and Charlie (35)
    expect(result.data).toHaveLength(2)
    expect(result.data).toEqual([
      { id: 2, name: 'Bob', age: 30 },
      { id: 3, name: 'Charlie', age: 35 },
    ])
  })

  test('returns data and count with limit', async () => {
    const result = await db.query.foo.findManyAndCount({
      limit: 3,
    })

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('count')
    expect(result.count).toBe(5) // Total count should still be 5
    expect(result.data).toHaveLength(3) // But data should be limited to 3
    expect(result.data).toEqual([
      { id: 1, name: 'Alice', age: 25 },
      { id: 2, name: 'Bob', age: 30 },
      { id: 3, name: 'Charlie', age: 35 },
    ])
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
    expect(result.count).toBe(4) // Alice (25), Bob (30), Diana (28), Eve (22)
    expect(result.data).toHaveLength(2) // But data should be limited to 2
    expect(result.data).toEqual([
      { id: 1, name: 'Alice', age: 25 },
      { id: 2, name: 'Bob', age: 30 },
    ])
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
