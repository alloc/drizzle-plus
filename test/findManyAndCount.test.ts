import 'drizzle-plus/sqlite/findManyAndCount'
import { db, truncate } from './config/client'
import { user } from './config/schema'

describe('findManyAndCount', () => {
  beforeAll(async () => {
    await truncate(['user'])
    await db.insert(user).values([
      { id: 1, name: 'Alice', age: 25 },
      { id: 2, name: 'Bob', age: 30 },
      { id: 3, name: 'Charlie', age: 35 },
      { id: 4, name: 'Diana', age: 28 },
      { id: 5, name: 'Eve', age: 22 },
    ])
  })

  test('SQL output', () => {
    const query = db.query.user.findManyAndCount()

    expect(query.toSQL()).toMatchInlineSnapshot(`
      {
        "count": {
          "params": [],
          "sql": "select count(*) AS "count" from "user"",
        },
        "findMany": {
          "params": [],
          "sql": "select "d0"."id" as "id", "d0"."name" as "name", "d0"."age" as "age", "d0"."handle" as "handle" from "user" as "d0"",
        },
      }
    `)

    const query2 = db.query.user.findManyAndCount({
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
          "sql": "select count(*) AS "count" from "user" where "user"."id" > ?",
          "typings": [
            "none",
          ],
        },
        "findMany": {
          "params": [
            100,
          ],
          "sql": "select "d0"."id" as "id", "d0"."name" as "name", "d0"."age" as "age", "d0"."handle" as "handle" from "user" as "d0" where "d0"."id" > ?",
          "typings": [
            "none",
          ],
        },
      }
    `)
  })

  test('returns data and count without filters', async () => {
    const result = await db.query.user.findManyAndCount({
      columns: { name: true, age: true },
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "count": 5,
        "data": [
          {
            "age": 25,
            "name": "Alice",
          },
          {
            "age": 30,
            "name": "Bob",
          },
          {
            "age": 35,
            "name": "Charlie",
          },
          {
            "age": 28,
            "name": "Diana",
          },
          {
            "age": 22,
            "name": "Eve",
          },
        ],
      }
    `)
  })

  test('returns data and count with filters', async () => {
    const result = await db.query.user.findManyAndCount({
      columns: { name: true, age: true },
      where: {
        age: { gte: 30 },
      },
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "count": 2,
        "data": [
          {
            "age": 30,
            "name": "Bob",
          },
          {
            "age": 35,
            "name": "Charlie",
          },
        ],
      }
    `)
  })

  test('returns data and count with limit', async () => {
    const result = await db.query.user.findManyAndCount({
      columns: { name: true, age: true },
      limit: 3,
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "count": 5,
        "data": [
          {
            "age": 25,
            "name": "Alice",
          },
          {
            "age": 30,
            "name": "Bob",
          },
          {
            "age": 35,
            "name": "Charlie",
          },
        ],
      }
    `)
  })

  test('returns data and count with filters and limit', async () => {
    const result = await db.query.user.findManyAndCount({
      columns: { name: true, age: true },
      where: {
        age: { lte: 30 },
      },
      limit: 2,
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "count": 4,
        "data": [
          {
            "age": 25,
            "name": "Alice",
          },
          {
            "age": 30,
            "name": "Bob",
          },
        ],
      }
    `)
  })

  test('returns empty data but correct count when no results match', async () => {
    const result = await db.query.user.findManyAndCount({
      where: {
        age: { gt: 100 },
      },
    })
    expect(result).toMatchInlineSnapshot(`
      {
        "count": 0,
        "data": [],
      }
    `)
  })
})
