import 'drizzle-plus/sqlite/$cursor'
import { db } from './config/client'

describe('$cursor', () => {
  test('with one column', () => {
    // Ascending.
    expect(db.query.foo.$cursor({ id: 'asc' }, { id: 99 }))
      .toMatchInlineSnapshot(`
        {
          "orderBy": {
            "id": "asc",
          },
          "where": {
            "id": {
              "gt": 99,
            },
          },
        }
      `)

    // Descending.
    expect(db.query.foo.$cursor({ id: 'desc' }, { id: 99 }))
      .toMatchInlineSnapshot(`
        {
          "orderBy": {
            "id": "desc",
          },
          "where": {
            "id": {
              "lt": 99,
            },
          },
        }
      `)
  })

  test('with multiple columns', () => {
    expect(
      db.query.foo.$cursor(
        { name: 'asc', age: 'desc' },
        { name: 'John', age: 20 }
      )
    ).toMatchInlineSnapshot(`
      {
        "orderBy": {
          "age": "desc",
          "name": "asc",
        },
        "where": {
          "age": {
            "lt": 20,
          },
          "name": {
            "gte": "John",
          },
        },
      }
    `)

    // Reverse order.
    expect(
      db.query.foo.$cursor(
        { name: 'desc', age: 'asc' },
        { name: 'John', age: 20 }
      )
    ).toMatchInlineSnapshot(`
      {
        "orderBy": {
          "age": "asc",
          "name": "desc",
        },
        "where": {
          "age": {
            "gt": 20,
          },
          "name": {
            "lte": "John",
          },
        },
      }
    `)

    // Three columns.
    const cursor = db.query.foo.$cursor(
      { name: 'desc', age: 'desc', id: 'desc' },
      { name: 'John', age: 20, id: 99 }
    )

    // Verify that property order is preserved.
    expect(Object.entries(cursor.where)).toMatchInlineSnapshot(`
      [
        [
          "name",
          {
            "lte": "John",
          },
        ],
        [
          "age",
          {
            "lte": 20,
          },
        ],
        [
          "id",
          {
            "lt": 99,
          },
        ],
      ]
    `)
    expect(Object.entries(cursor.orderBy)).toMatchInlineSnapshot(`
      [
        [
          "name",
          "desc",
        ],
        [
          "age",
          "desc",
        ],
        [
          "id",
          "desc",
        ],
      ]
    `)
  })
})
