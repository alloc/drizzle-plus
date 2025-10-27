import 'drizzle-plus/sqlite/findManyAndCount'
import { db } from '../config/client'
import { user } from '../config/schema'

describe('findManyAndCount (Integration)', () => {
  beforeAll(async () => {
    await db.insert(user).values([
      { id: 1, name: 'Alice', age: 25 },
      { id: 2, name: 'Bob', age: 30 },
      { id: 3, name: 'Charlie', age: 35 },
      { id: 4, name: 'Diana', age: 28 },
      { id: 5, name: 'Eve', age: 22 },
    ])
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
